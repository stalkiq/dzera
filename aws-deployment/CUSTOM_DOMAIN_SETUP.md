# Custom Domain Setup: awsdzera.com

## Prerequisites

1. **Register the domain** `awsdzera.com` (if not already registered)
   - Register with a domain registrar (Route 53, GoDaddy, Namecheap, etc.)

## Deployment Steps

### Step 1: Deploy Main Stack (Creates Hosted Zone)

```bash
cd aws-deployment
npx cdk deploy AwsDzeraStack
```

This will:
- Create Route 53 hosted zone for `awsdzera.com`
- Output the nameservers

### Step 2: Update Domain Registrar

1. **Get the nameservers from the CDK output:**
   - Look for `NameServers` output after deployment
   - Or get them from AWS Console → Route 53 → Hosted Zones → awsdzera.com

2. **Update your domain registrar:**
   - Go to your domain registrar (where you bought awsdzera.com)
   - Update the nameservers to match the Route 53 nameservers
   - Wait for DNS propagation (usually 1-2 hours, can take up to 48 hours)

### Step 3: Deploy Certificate Stack

```bash
npx cdk deploy CertificateStack
```

This will:
- Create SSL certificate in us-east-1 (required for CloudFront)
- Validate the certificate using DNS records
- Output the certificate ARN

**Note:** Certificate validation can take 5-30 minutes.

### Step 4: Update Main Stack with Certificate

After the certificate is validated, get the ARN from the output and redeploy:

```bash
# Get certificate ARN from CertificateStack output, then:
npx cdk deploy AwsDzeraStack --parameters CertificateArn=arn:aws:acm:us-east-1:016442247702:certificate/xxxxx
```

This will:
- Attach the certificate to CloudFront
- Configure the custom domain
- Create Route 53 A and AAAA records pointing to CloudFront

### Step 5: Wait for CloudFront

CloudFront distribution updates can take 15-20 minutes. Once complete, your site will be available at:
- **https://awsdzera.com**

## SSL Certificate

The CDK will automatically:
- Request an SSL certificate in `us-east-1` (required for CloudFront)
- Validate it using DNS records in Route 53
- Attach it to the CloudFront distribution

**Note**: Certificate validation can take 5-30 minutes.

## After Deployment

Once deployed, your app will be available at:
- **Custom Domain**: `https://awsdzera.com`
- **CloudFront URL**: `https://d1gfk5i6gmcicg.cloudfront.net` (still works)

## Troubleshooting

### Certificate Validation Fails
- Ensure Route 53 hosted zone exists
- Check that nameservers are correctly configured
- Wait for DNS propagation

### Domain Not Resolving
- Verify Route 53 A record was created
- Check nameserver configuration at registrar
- Wait for DNS propagation (can take up to 48 hours)

### CloudFront Distribution Shows "In Progress"
- This is normal - distributions take 15-20 minutes to deploy
- Custom domain will work once distribution is ready

## Manual Setup (Alternative)

If CDK automatic setup doesn't work:

1. **Request Certificate Manually:**
   ```bash
   aws acm request-certificate \
     --domain-name awsdzera.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Add DNS Validation Records** to Route 53

3. **Wait for Validation** (5-30 minutes)

4. **Update CloudFront Distribution** manually in console to use the certificate

