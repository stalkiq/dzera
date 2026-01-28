#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsDzeraStack } from '../lib/aws-dzera-stack';

const app = new cdk.App();
new AwsDzeraStack(app, 'AwsDzeraStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'AWS Dzera - Cost Optimization Tool',
});

