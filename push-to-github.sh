#!/bin/bash

# Script to push AWS Dzera to GitHub
# Run this script after agreeing to Xcode license if needed

set -e

echo "🚀 Pushing AWS Dzera to GitHub..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add remote (or update if exists)
echo "🔗 Setting up remote repository..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/stalkiq/dzera.git

# Add all files
echo "📝 Adding files..."
git add .

# Commit
echo "💾 Committing changes..."
git commit -m "Initial commit: AWS Dzera cost optimization tool

- Next.js frontend with matte grey theme
- Comprehensive AWS cost scanning (EC2, RDS, S3, DynamoDB, CloudFront, etc.)
- Sidebar navigation with informational pages
- AWS CDK deployment infrastructure
- Lambda function for serverless scanning
- KMS encryption for secure credential handling"

# Set main branch
echo "🌿 Setting main branch..."
git branch -M main

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push -u origin main

echo "✅ Successfully pushed to https://github.com/stalkiq/dzera.git"
echo ""
echo "📋 Repository URL: https://github.com/stalkiq/dzera"

