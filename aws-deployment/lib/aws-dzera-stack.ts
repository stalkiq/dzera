import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class AwsDzeraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // KMS Key for encrypting credentials
    const kmsKey = new kms.Key(this, 'CredentialsKey', {
      description: 'KMS key for encrypting AWS credentials in transit',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for Frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `aws-dzera-frontend-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA fallback
      publicReadAccess: false, // CloudFront will handle access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OriginAccessIdentity',
      {
        comment: 'OAI for AWS Dzera frontend',
      }
    );

    // Grant CloudFront access to S3
    frontendBucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Lambda Function for Scanning
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

    // Grant Lambda permission to decrypt with KMS
    kmsKey.grantDecrypt(scanFunction);

    // API Gateway REST API
    const api = new apigateway.RestApi(this, 'DzeraApi', {
      restApiName: 'AWS Dzera API',
      description: 'API for AWS Dzera cost scanning',
      defaultCorsPreflightOptions: {
        allowOrigins: [
          `https://${distribution.distributionDomainName}`,
          'http://localhost:3000', // For local development
        ],
        allowMethods: ['POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
        allowCredentials: false,
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 10,
        throttlingBurstLimit: 20,
      },
    });

    // API Gateway Lambda Integration
    const scanIntegration = new apigateway.LambdaIntegration(scanFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // API Resource
    const scanResource = api.root.addResource('scan');
    scanResource.addMethod('POST', scanIntegration, {
      apiKeyRequired: false, // Set to true if you want API keys
    });

    // Outputs
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket for frontend assets',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for credential encryption',
    });
  }
}

