#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsDzeraStack } from '../lib/aws-dzera-stack';
import { CertificateStack } from '../lib/certificate-stack';

const app = new cdk.App();
const account = process.env.CDK_DEFAULT_ACCOUNT || '016442247702';
const region = process.env.CDK_DEFAULT_REGION || 'us-west-2';

// Main stack - creates hosted zone and infrastructure
// Deploy this first: cdk deploy AwsDzeraStack
const mainStack = new AwsDzeraStack(app, 'AwsDzeraStack', {
  env: {
    account: account,
    region: region,
  },
  description: 'AWS Dzera - Cost Optimization Tool',
});

// Certificate stack in us-east-1 (required for CloudFront)
// Deploy this second: cdk deploy CertificateStack
// Then get the certificate ARN and redeploy main stack with:
// cdk deploy AwsDzeraStack --parameters CertificateArn=<arn>
const certificateStack = new CertificateStack(app, 'CertificateStack', {
  env: {
    account: account,
    region: 'us-east-1',
  },
  description: 'SSL Certificate for AWS Dzera (us-east-1)',
});

// Certificate stack depends on main stack (for hosted zone)
certificateStack.addDependency(mainStack);

