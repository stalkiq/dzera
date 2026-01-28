# Quick Deployment Guide for StalkIQ AWS Account

## Your AWS Account
- **Account ID**: 016442247702
- **Account Name**: StalkIQ
- **Region**: us-east-1 (recommended)

## Step-by-Step Deployment

### 1. Install CDK (if not already installed)
```bash
npm install -g aws-cdk
```

### 2. Install Dependencies
```bash
cd aws-deployment
npm install
```

### 3. Bootstrap CDK (First Time Only)
This creates the necessary S3 bucket and IAM roles for CDK:
```bash
cdk bootstrap aws://016442247702/us-east-1
```

### 4. Build Next.js App
```bash
cd ..
npm run build
# If using static export, ensure next.config.ts has output: 'export'
```

### 5. Deploy Infrastructure
```bash
cd aws-deployment
cdk deploy --all
```

### 6. Upload Frontend to S3
After deployment, upload your built Next.js app to the S3 bucket:
```bash
# Get the bucket name from CDK output, then:
aws s3 sync ../out s3://aws-dzera-frontend-016442247702-us-east-1 --delete
```

### 7. Update Frontend API Endpoint
Update your frontend to use the API Gateway endpoint from the CDK output.

## Expected Outputs

After deployment, you'll get:
- **CloudFront URL**: `https://d1234567890.cloudfront.net`
- **API Gateway URL**: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`
- **S3 Bucket**: `aws-dzera-frontend-016442247702-us-east-1`

## Cost Estimate

For your account, estimated monthly costs:
- **Low usage** (100 scans/month): ~$2-3
- **Medium usage** (1000 scans/month): ~$5-10
- **High usage** (10,000 scans/month): ~$30-50

## Troubleshooting

### If CDK bootstrap fails:
- Ensure your AWS credentials have admin permissions
- Check that you're using the correct account ID

### If deployment fails:
- Check CloudFormation console for error details
- Verify IAM permissions
- Ensure all dependencies are installed

