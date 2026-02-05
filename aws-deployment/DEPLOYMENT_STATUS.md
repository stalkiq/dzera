# AWS Dzera Custom Domain Deployment Status

## ✅ Step 1: Main Stack Deployed
- **Status**: ✅ Complete
- **Route 53 Hosted Zone**: Created for `awsdzera.com`
- **Nameservers** (update your domain registrar with these):
  - `ns-1205.awsdns-22.org`
  - `ns-484.awsdns-60.com`
  - `ns-1867.awsdns-41.co.uk`
  - `ns-731.awsdns-27.net`

## ⏳ Step 2: Update Domain Registrar
**Action Required**: Update your domain registrar (where you bought awsdzera.com) to use the Route 53 nameservers listed above.

**How to do it:**
1. Log into your domain registrar (Route 53, GoDaddy, Namecheap, etc.)
2. Find DNS/Nameserver settings for `awsdzera.com`
3. Replace existing nameservers with the 4 nameservers above
4. Save changes

**Wait time**: DNS propagation takes 1-2 hours (can take up to 48 hours)

## ✅ Step 3: Certificate Stack Deployed
- **Status**: ✅ Complete (Certificate pending validation)
- **Certificate ARN**: `arn:aws:acm:us-east-1:016442247702:certificate/e74670b7-533d-4b1d-8b1a-9ea5565d1dbb`
- **Certificate Status**: `PENDING_VALIDATION`
- **DNS Validation Record**: Already created in Route 53

**Note**: Certificate validation will complete automatically once DNS propagates (after Step 2).

## ⏳ Step 4: Update Main Stack with Certificate
**Status**: Waiting for certificate validation

**Once certificate status changes to "ISSUED":**
```bash
cd aws-deployment
npx cdk deploy AwsDzeraStack --parameters CertificateArn=arn:aws:acm:us-east-1:016442247702:certificate/e74670b7-533d-4b1d-8b1a-9ea5565d1dbb --require-approval never
```

This will:
- Add `awsdzera.com` to CloudFront distribution
- Create Route 53 A and AAAA records
- Enable HTTPS on custom domain

## Check Certificate Status

```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:016442247702:certificate/e74670b7-533d-4b1d-8b1a-9ea5565d1dbb \
  --region us-east-1 \
  --query 'Certificate.Status' \
  --output text
```

When status is `ISSUED`, proceed with Step 4.

## Current Endpoints

- **CloudFront URL**: https://d1gfk5i6gmcicg.cloudfront.net
- **API Gateway**: https://8phpxwcke6.execute-api.us-west-2.amazonaws.com/prod/
- **Custom Domain**: Will be available at https://awsdzera.com after Step 4 completes

## Next Steps

1. ✅ Update domain registrar with Route 53 nameservers (Step 2)
2. ⏳ Wait for DNS propagation (1-2 hours)
3. ⏳ Wait for certificate validation (automatic after DNS propagates)
4. ⏳ Run Step 4 deployment command above
5. ⏳ Wait for CloudFront distribution update (15-20 minutes)
6. ✅ Access https://awsdzera.com

