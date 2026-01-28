# 🚀 Deploy AWS Dzera to Your AWS Account

## Quick Start (3 Steps)

### 1. Install CDK Dependencies
```bash
cd aws-deployment
npm install
```

### 2. Bootstrap CDK (First Time Only)
```bash
npx cdk bootstrap aws://016442247702/us-east-1
```

### 3. Deploy
```bash
npx cdk deploy --all
```

That's it! The deployment will create:
- ✅ S3 bucket for frontend
- ✅ CloudFront distribution (CDN)
- ✅ API Gateway (REST API)
- ✅ Lambda function (scanning logic)
- ✅ KMS key (encryption)

## After Deployment

You'll get outputs with:
- **CloudFront URL**: Your app's public URL
- **API Gateway URL**: Backend API endpoint
- **S3 Bucket Name**: Where to upload frontend files

## Full Instructions

See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for detailed steps.

## Cost

- **Setup**: ~$5-10 one-time
- **Monthly** (1000 scans): ~$5-10/month
- **Free tier**: First 1M Lambda requests/month are free!

## Need Help?

- Check `aws-deployment/README.md` for architecture details
- Review CloudFormation in AWS Console if deployment fails
- Check CloudWatch logs for Lambda errors

