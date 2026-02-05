import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

/**
 * Separate stack for SSL certificate in us-east-1 (required for CloudFront)
 * This must be deployed in us-east-1 region
 */
export class CertificateStack extends cdk.Stack {
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: props?.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1', // CloudFront requires certificates in us-east-1
      },
    });

    const domainName = 'awsdzera.com';

    // Look up hosted zone (created in AwsDzeraStack)
    // Route 53 hosted zones are global, so we can reference from us-east-1
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName,
    });

    // Create certificate in us-east-1
    this.certificate = new acm.Certificate(this, 'CloudFrontCertificate', {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      description: 'SSL Certificate ARN for CloudFront',
    });
  }
}

