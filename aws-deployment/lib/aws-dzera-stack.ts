import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import * as path from 'path';

export interface AwsDzeraStackProps extends cdk.StackProps {
  certificateArn?: string;
}

export class AwsDzeraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: AwsDzeraStackProps) {
    super(scope, id, props);

    // 1. KMS Key for encrypting credentials
    const kmsKey = new kms.Key(this, 'CredentialsKey', {
      description: 'KMS key for encrypting AWS credentials in transit',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 2. Lambda Function for Scanning
    const scanFunction = new lambda.Function(this, 'ScanFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/scan')),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        KMS_KEY_ID: kmsKey.keyId,
      },
    });
    kmsKey.grantDecrypt(scanFunction);

    // 3. API Gateway REST API
    const api = new apigateway.RestApi(this, 'DzeraApi', {
      restApiName: 'AWS Dzera API',
      description: 'API for AWS Dzera cost scanning',
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://d1gfk5i6gmcicg.cloudfront.net', 'http://localhost:3000'],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['*'],
        allowCredentials: false,
      },
    });

    const scanResource = api.root.addResource('scan');
    scanResource.addMethod('POST', new apigateway.LambdaIntegration(scanFunction));

    // 4. S3 Bucket for Frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `aws-dzera-frontend-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI');
    frontendBucket.grantRead(originAccessIdentity);

    // 5. CloudFront Distribution (With API Proxy)
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, { originAccessIdentity }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/prod/*': {
          origin: new origins.RestApiOrigin(api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontURL', { value: `https://${distribution.distributionDomainName}` });
    new cdk.CfnOutput(this, 'ApiGatewayUrl', { value: api.url });
  }
}
