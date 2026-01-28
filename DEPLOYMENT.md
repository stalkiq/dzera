# AWS Deployment Guide for AWS Dzera

This document explains how to deploy AWS Dzera to AWS.

## Architecture

The application uses a serverless architecture:

- **Frontend**: Next.js app hosted on S3 + CloudFront
- **API**: API Gateway REST API
- **Backend**: AWS Lambda functions
- **Security**: KMS for credential encryption

## Quick Start

### Option 1: AWS CDK (Recommended)

```bash
cd aws-deployment
npm install
cdk bootstrap  # First time only
cdk deploy
```

### Option 2: Manual Deployment

See `aws-deployment/manual-deployment.md` for step-by-step instructions.

## Security Considerations

### Current Implementation

The current setup encrypts credentials using KMS before sending to Lambda. However, for production, consider:

1. **AWS Cognito**: Use temporary credentials instead of permanent access keys
2. **IAM Roles**: Allow users to assume roles instead of sharing credentials
3. **AWS SSO**: Integrate with AWS SSO for enterprise deployments

### Recommended Production Setup

1. Replace credential input with AWS Cognito authentication
2. Use Cognito Identity Pool to get temporary AWS credentials
3. Lambda assumes a role with necessary permissions
4. No permanent credentials stored or transmitted

## Environment Variables

After deployment, update your frontend to use the API Gateway endpoint:

```env
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
NEXT_PUBLIC_KMS_KEY_ID=your-kms-key-id
```

## Cost Optimization

- Use Lambda provisioned concurrency only if needed
- Enable CloudFront caching for static assets
- Use S3 lifecycle policies for old logs
- Monitor API Gateway usage and set up alerts

## Monitoring

Set up CloudWatch alarms for:
- Lambda errors
- API Gateway 5xx errors
- Lambda duration > 4 minutes
- API Gateway throttling

## Troubleshooting

### Lambda Timeout

If scans timeout, increase Lambda timeout or optimize scan logic.

### CORS Errors

Ensure API Gateway CORS is configured correctly with your CloudFront domain.

### KMS Decryption Errors

Verify Lambda execution role has `kms:Decrypt` permission for the KMS key.

