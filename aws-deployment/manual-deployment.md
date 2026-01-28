# Manual AWS Deployment Guide

If you prefer to deploy manually without CDK, follow these steps:

## Step 1: Create S3 Bucket for Frontend

```bash
aws s3 mb s3://aws-dzera-frontend-$(aws sts get-caller-identity --query Account --output text)
aws s3 website s3://aws-dzera-frontend-$(aws sts get-caller-identity --query Account --output text) \
  --index-document index.html --error-document index.html
```

## Step 2: Build and Upload Frontend

```bash
cd ..
npm run build
aws s3 sync .next/static s3://aws-dzera-frontend-$(aws sts get-caller-identity --query Account --output text)/_next/static
aws s3 cp out/index.html s3://aws-dzera-frontend-$(aws sts get-caller-identity --query Account --output text)/
```

## Step 3: Create KMS Key

```bash
aws kms create-key --description "AWS Dzera credentials encryption"
# Save the KeyId from the output
```

## Step 4: Create Lambda Function

1. Package the Lambda code:
```bash
cd lambda/scan
npm install
zip -r function.zip .
```

2. Create Lambda function:
```bash
aws lambda create-function \
  --function-name aws-dzera-scan \
  --runtime nodejs20.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables="{KMS_KEY_ID=YOUR_KMS_KEY_ID}"
```

## Step 5: Create API Gateway

```bash
# Create REST API
aws apigateway create-rest-api --name "AWS Dzera API"

# Get API ID and create resources/methods
# See AWS Console or use AWS CLI for full setup
```

## Step 6: Create CloudFront Distribution

Use AWS Console or CLI to create a CloudFront distribution pointing to your S3 bucket.

## Step 7: Update Frontend API Endpoint

Update your Next.js app to use the API Gateway endpoint instead of `/api/scan`.

