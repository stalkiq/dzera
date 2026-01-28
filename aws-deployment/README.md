# AWS Deployment Guide for AWS Dzera

This guide will help you deploy AWS Dzera to AWS using a serverless architecture.

## Architecture Overview

```
┌─────────────┐
│   User      │
│  Browser    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  CloudFront     │ (CDN + HTTPS)
│  + S3           │ (Static Frontend)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  API Gateway    │ (REST API)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Lambda         │ (Scan Logic)
│  Functions      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  AWS Services   │ (EC2, RDS, S3, etc.)
│  (User's Account)│
└─────────────────┘
```

## Components

1. **Frontend**: Next.js app hosted on S3 + CloudFront
2. **API**: API Gateway REST API
3. **Backend**: Lambda functions for scanning
4. **Security**: Encrypted credential storage, IAM roles

## Prerequisites

- AWS CLI configured with admin access
- Node.js 18+ installed
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Docker (for Lambda bundling)

## Deployment Steps

### 1. Install Dependencies

```bash
cd aws-deployment
npm install
```

### 2. Configure AWS Account

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Set default region (e.g., us-east-1)
```

### 3. Bootstrap CDK (First Time Only)

```bash
cdk bootstrap
```

### 4. Deploy Infrastructure

```bash
cdk deploy --all
```

### 5. Get Frontend URL

After deployment, the stack will output:
- CloudFront Distribution URL
- API Gateway Endpoint URL

## Security Features

1. **Encrypted Credentials**: User credentials are encrypted using AWS KMS before being sent to Lambda
2. **Temporary Storage**: Credentials are only stored in memory during scan execution
3. **IAM Roles**: Lambda functions use IAM roles with minimal permissions
4. **HTTPS Only**: All traffic encrypted in transit
5. **CORS**: Configured for your domain only

## Cost Estimation

- **S3**: ~$0.023/GB storage + $0.005/1000 requests
- **CloudFront**: ~$0.085/GB data transfer (first 10TB)
- **Lambda**: Free tier (1M requests/month), then $0.20/1M requests
- **API Gateway**: $3.50/1M requests
- **KMS**: $1/month per key + $0.03/10K requests

**Estimated monthly cost for 1000 scans/month: ~$5-10**

## Manual Deployment (Alternative)

If you prefer not to use CDK, see `manual-deployment.md` for step-by-step instructions.

