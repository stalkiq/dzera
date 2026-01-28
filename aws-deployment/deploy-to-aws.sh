#!/bin/bash

# Deployment script for AWS Dzera to StalkIQ AWS Account
# Account ID: 016442247702

set -e

echo "🚀 Deploying AWS Dzera to AWS Account: 016442247702 (StalkIQ)"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
if [ -z "$AWS_ACCOUNT" ]; then
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

if [ "$AWS_ACCOUNT" != "016442247702" ]; then
    echo "⚠️  Warning: Current AWS account ($AWS_ACCOUNT) doesn't match StalkIQ account (016442247702)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ AWS credentials configured${NC}"
echo ""

# Navigate to deployment directory
cd "$(dirname "$0")"
DEPLOY_DIR=$(pwd)
PROJECT_ROOT=$(dirname "$DEPLOY_DIR")

echo "📦 Installing CDK dependencies..."
npm install

# Install CDK locally if not available
if ! command -v cdk &> /dev/null; then
    echo "📦 Installing AWS CDK locally..."
    npm install aws-cdk
    export PATH="$PATH:$(pwd)/node_modules/.bin"
fi

echo ""
echo "🏗️  Building Next.js application..."
cd "$PROJECT_ROOT"
npm run build

echo ""
echo "☁️  Bootstrapping CDK (if needed)..."
cd "$DEPLOY_DIR"
cdk bootstrap aws://016442247702/us-east-1 || echo "CDK already bootstrapped"

echo ""
echo "🚀 Deploying infrastructure..."
cdk deploy --all --require-approval never

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Check the CDK outputs above for your CloudFront URL and API Gateway endpoint"
echo "2. Update your frontend to use the API Gateway endpoint"
echo "3. Upload the built Next.js app to the S3 bucket (bucket name in CDK outputs)"
echo ""
echo "To upload frontend:"
echo "  aws s3 sync $PROJECT_ROOT/.next/static s3://BUCKET_NAME/_next/static"
echo "  aws s3 sync $PROJECT_ROOT/public s3://BUCKET_NAME/public"
echo "  # Then upload your HTML files"

