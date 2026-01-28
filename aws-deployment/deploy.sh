#!/bin/bash

# AWS Dzera Deployment Script
set -e

echo "🚀 Starting AWS Dzera deployment..."

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK not found. Installing..."
    npm install -g aws-cdk
fi

# Navigate to deployment directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build Next.js app first
echo "🏗️  Building Next.js application..."
cd ..
npm run build

# Export static files (if using static export)
# Note: You may need to configure Next.js for static export
# Add to next.config.ts: output: 'export'

# Return to deployment directory
cd aws-deployment

# Bootstrap CDK (if needed)
echo "🔧 Bootstrapping CDK..."
cdk bootstrap || echo "CDK already bootstrapped"

# Deploy infrastructure
echo "☁️  Deploying AWS infrastructure..."
cdk deploy --all --require-approval never

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your Next.js build to the S3 bucket"
echo "2. Update your frontend to use the API Gateway endpoint"
echo "3. Configure CORS if needed"
echo ""
echo "Check the CDK outputs above for your CloudFront URL and API endpoint."

