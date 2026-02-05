# Fix: awsdzera.com "Server Can't Be Found"

## Why it's not working:
The domain `awsdzera.com` isn't working because:
1. ❌ Nameservers haven't been updated at your domain registrar
2. ⏳ Certificate is still pending validation
3. ⏳ Domain hasn't been added to CloudFront yet

## Quick Fix Steps:

### Step 1: Update Nameservers at Your Domain Registrar

**Where did you buy awsdzera.com?** (Route 53, GoDaddy, Namecheap, etc.)

1. **Log into your domain registrar**
2. **Find DNS/Nameserver settings** for `awsdzera.com`
3. **Replace existing nameservers** with these Route 53 nameservers:

```
ns-1205.awsdns-22.org
ns-484.awsdns-60.com
ns-1867.awsdns-41.co.uk
ns-731.awsdns-27.net
```

4. **Save changes**

### Step 2: Wait for DNS Propagation
- Usually takes **1-2 hours**
- Can take up to **48 hours** in some cases
- You can check with: `dig awsdzera.com NS`

### Step 3: Wait for Certificate Validation
- Certificate will automatically validate once DNS propagates
- Check status:
```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:016442247702:certificate/e74670b7-533d-4b1d-8b1a-9ea5565d1dbb \
  --region us-east-1 \
  --query 'Certificate.Status'
```

### Step 4: Complete CloudFront Setup
Once certificate status is `ISSUED`, run:
```bash
cd aws-deployment
npx cdk deploy AwsDzeraStack \
  --parameters CertificateArn=arn:aws:acm:us-east-1:016442247702:certificate/e74670b7-533d-4b1d-8b1a-9ea5565d1dbb \
  --require-approval never
```

### Step 5: Wait for CloudFront
- CloudFront distribution update takes **15-20 minutes**
- Then `https://awsdzera.com` will work!

## Current Working URLs:

While waiting, you can use:
- **CloudFront**: https://d1gfk5i6gmcicg.cloudfront.net
- **API Gateway**: https://8phpxwcke6.execute-api.us-west-2.amazonaws.com/prod/

## Check Progress:

```bash
# Check if nameservers are updated
dig awsdzera.com NS +short

# Check certificate status
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:016442247702:certificate/e74670b7-533d-4b1d-8b1a-9ea5565d1dbb \
  --region us-east-1 \
  --query 'Certificate.Status' \
  --output text
```

