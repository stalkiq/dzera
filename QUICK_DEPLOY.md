# Quick Deploy to AWS - StalkIQ Account

## Your AWS Account
- **Account ID**: 016442247702
- **Account Name**: StalkIQ

## Prerequisites ✅

You already have:
- ✅ AWS CLI installed and configured
- ✅ AWS credentials set up (Account: 016442247702)
- ✅ Node.js installed

## Deployment Steps

### Step 1: Install CDK (Local Installation)

```bash
cd aws-deployment
npm install
npx cdk --version  # Verify CDK is available
```

### Step 2: Bootstrap CDK (First Time Only)

```bash
cd aws-deployment
npx cdk bootstrap aws://016442247702/us-east-1
```

This creates the necessary infrastructure for CDK in your AWS account.

### Step 3: Deploy Infrastructure

```bash
cd aws-deployment
npx cdk deploy --all
```

This will:
- Create S3 bucket for frontend
- Create CloudFront distribution
- Create API Gateway
- Create Lambda function
- Create KMS key for encryption

**Note**: The first deployment takes 5-10 minutes. You'll see progress in the terminal.

### Step 4: Get Deployment Outputs

After deployment completes, you'll see outputs like:
```
Outputs:
AwsDzeraStack.CloudFrontURL = https://d1234567890.cloudfront.net
AwsDzeraStack.ApiGatewayUrl = https://abc123.execute-api.us-east-1.amazonaws.com/prod
AwsDzeraStack.FrontendBucketName = aws-dzera-frontend-016442247702-us-east-1
```

### Step 5: Build and Upload Frontend

Since Next.js uses server-side rendering, we have two options:

#### Option A: Deploy to Vercel (Easier)
Vercel handles Next.js deployments automatically:
1. Connect your GitHub repo to Vercel
2. Update the API endpoint in your code to use the API Gateway URL
3. Deploy

#### Option B: Static Export + S3 (More Complex)
1. Update `next.config.ts` to enable static export:
```typescript
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};
```

2. Build:
```bash
npm run build
```

3. Upload to S3:
```bash
aws s3 sync out s3://aws-dzera-frontend-016442247702-us-east-1 --delete
```

### Step 6: Update Frontend API Endpoint

Update `src/app/page.tsx` to use your API Gateway URL instead of `/api/scan`:

```typescript
const res = await fetch("https://YOUR-API-GATEWAY-URL/prod/scan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(credentials),
});
```

## Cost Estimate

For your StalkIQ account:
- **First month**: ~$5-10 (includes setup)
- **Ongoing** (1000 scans/month): ~$5-10/month
- **High usage** (10,000 scans/month): ~$30-50/month

## Troubleshooting

### If CDK bootstrap fails:
- Ensure your AWS credentials have admin permissions
- Check IAM permissions in AWS Console

### If deployment fails:
- Check CloudFormation console for detailed errors
- Verify all dependencies are installed: `cd aws-deployment && npm install`

### If Lambda times out:
- Increase timeout in `aws-dzera-stack.ts` (currently 5 minutes)
- Check CloudWatch logs for errors

## Next Steps After Deployment

1. **Test the API**: Use the API Gateway URL to test scanning
2. **Configure CORS**: Update CORS settings if needed
3. **Set up monitoring**: Add CloudWatch alarms
4. **Custom domain** (optional): Add your own domain to CloudFront

## Need Help?

- Check `aws-deployment/README.md` for detailed docs
- Review CloudFormation stack in AWS Console
- Check CloudWatch logs for Lambda function

