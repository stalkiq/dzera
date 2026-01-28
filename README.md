# AWS Dzera

**AWS Dzera** is an intelligent AWS cost optimization tool that scans your AWS account to identify exactly why your bill is high. It finds expensive resources, unused services, and optimization opportunities that can save you hundreds or thousands of dollars per month.

## Features

- 🔍 **Comprehensive Scanning** - Scans EC2, RDS, S3, DynamoDB, CloudFront, NAT Gateways, Elastic IPs, EBS volumes, and more
- 💰 **Cost Estimates** - Get accurate monthly cost estimates for each resource
- 🎯 **Smart Recommendations** - Receive actionable suggestions with direct AWS Console links
- 🔒 **Secure** - Read-only access, no data storage, all processing happens locally
- 🆓 **Free** - Completely free to use, no subscription fees

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Pages

- **Cost Scanner** (`/`) - Main page to scan your AWS account
- **What is AWS Dzera** (`/about`) - Learn about the application and how it helps reduce costs
- **Getting Started** (`/getting-started`) - Step-by-step guide to set up AWS credentials
- **How It Works** (`/how-it-works`) - Detailed explanation of the scanning process
- **FAQ** (`/faq`) - Frequently asked questions

## AWS Credentials Setup

AWS Dzera requires read-only AWS credentials to scan your account. See the [Getting Started](/getting-started) page for detailed instructions on creating an IAM user with read-only access.

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) - AWS API integration
- [Lucide React](https://lucide.dev/) - Icons

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
