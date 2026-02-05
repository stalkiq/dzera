# Deploying AWS Dzera with Custom Domain (awsdzera.com)

## Quick Start

The deployment is a 4-step process:

1. Deploy main stack (creates hosted zone)
2. Update domain registrar with Route 53 nameservers
3. Deploy certificate stack (creates SSL certificate)
4. Update main stack with certificate ARN

## Detailed Steps

### Step 1: Deploy Main Stack

```bash
cd aws-deployment
npx cdk deploy AwsDzeraStack
```

**What this does:**
- Creates Route 53 hosted zone for `awsdzera.com`
- Creates S3 bucket, CloudFront, API Gateway, Lambda, KMS
- Outputs the Route 53 nameservers

**Save the nameservers** from the output - you'll need them in Step 2.

### Step 2: Update Domain Registrar

1. **Get nameservers** from Step 1 output (look for `NameServers`)
   - Example: `ns-123.awsdns-12.com, ns-456.awsdns-45.net, ...`

2. **Go to your domain registrar** (where you bought awsdzera.com)
   - Route 53, GoDaddy, Namecheap, etc.

3. **Update nameservers:**
   - Find DNS/Nameserver settings for awsdzera.com
   - Replace existing nameservers with the Route 53 nameservers
   - Save changes

4. **Wait for DNS propagation** (usually 1-2 hours, can take up to 48 hours)
   - You can check propagation: `dig awsdzera.com NS`

### Step 3: Deploy Certificate Stack

```bash
npx cdk deploy CertificateStack
```

**What this does:**
- Creates SSL certificate in us-east-1 (required for CloudFront)
- Validates certificate using DNS records in Route 53
- Outputs the certificate ARN

**Note:** Certificate validation takes 5-30 minutes. Wait until status is "Issued" in ACM console.

### Step 4: Update Main Stack with Certificate

After certificate is validated:

1. **Get certificate ARN** from CertificateStack output
   - Look for `CertificateArn` in the output
   - Example: `arn:aws:acm:us-east-1:016442247702:certificate/12345678-1234-1234-1234-123456789012`

2. **Redeploy main stack with certificate:**
   ```bash
   npx cdk deploy AwsDzeraStack --parameters CertificateArn=arn:aws:acm:us-east-1:016442247702:certificate/YOUR_CERT_ID
   ```

**What this does:**
- Attaches SSL certificate to CloudFront
- Configures `awsdzera.com` as custom domain
- Creates Route 53 A and AAAA records pointing to CloudFront

### Step 5: Wait for CloudFront

CloudFront distribution updates take 15-20 minutes. Once complete:

- ✅ **https://awsdzera.com** will be live!

## Verify Deployment

```bash
# Check hosted zone
aws route53 list-hosted-zones --query 'HostedZones[?Name==`awsdzera.com.`]'

# Check certificate status
aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[?DomainName==`awsdzera.com`]'

# Check CloudFront distribution
aws cloudfront list-distributions --query 'DistributionList.Items[?Aliases.Items[?@==`awsdzera.com`]]'
```

## Troubleshooting

### Certificate validation fails
- Ensure nameservers are correctly updated at registrar
- Wait for DNS propagation (can take up to 48 hours)
- Check Route 53 hosted zone has the validation records

### Domain not resolving
- Verify Route 53 A record exists and points to CloudFront
- Check nameserver configuration at registrar
- Wait for DNS propagation

### CloudFront shows "In Progress"
- This is normal - distributions take 15-20 minutes to deploy
- Custom domain will work once distribution is ready

## Cost Estimate

- **Route 53 hosted zone**: $0.50/month
- **Route 53 queries**: $0.40 per million queries
- **SSL Certificate**: Free (AWS Certificate Manager)
- **CloudFront**: Pay per use (first 50GB free/month)
- **Total**: ~$1-5/month for low traffic

