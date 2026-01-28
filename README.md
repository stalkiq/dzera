# AWS Dzera

**AWS Dzera** is an intelligent AWS cost optimization tool that scans your AWS account to identify exactly why your bill is high. It finds expensive resources, unused services, and optimization opportunities that can save you hundreds or thousands of dollars per month.

![AWS Dzera](https://img.shields.io/badge/AWS-Dzera-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## ✨ Features

- 🔍 **Comprehensive Scanning** - Scans EC2, RDS, S3, DynamoDB, CloudFront, NAT Gateways, Elastic IPs, EBS volumes, and more across multiple regions
- 💰 **Cost Estimates** - Get accurate monthly cost estimates for each resource, helping you prioritize which optimizations will have the biggest impact
- 🎯 **Smart Recommendations** - Receive actionable suggestions for each finding, with direct links to AWS Console for quick fixes
- 🔒 **Secure** - Read-only access, encrypted credential handling, all processing happens securely
- 🆓 **Free** - Completely free to use, no subscription fees
- 🎨 **Modern UI** - Clean, matte grey interface with intuitive navigation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- AWS CLI configured (for local development)
- AWS account with read-only IAM user credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/stalkiq/dzera.git
cd dzera

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1. **Get AWS Credentials**: Create an IAM user with read-only access (see [Getting Started Guide](/getting-started))
2. **Enter Credentials**: Input your Access Key ID and Secret Access Key
3. **Run Scan**: Click "Scan AWS Account" and wait 30-60 seconds
4. **Review Findings**: See cost-driving resources categorized by severity
5. **Take Action**: Follow suggestions and use direct AWS Console links to optimize

## 🏗️ Architecture

### Local Development
- **Frontend**: Next.js 16 with React 19
- **Backend**: Next.js API routes
- **AWS SDK**: Direct API calls using user credentials

### Production Deployment (AWS)
- **Frontend**: S3 + CloudFront
- **API**: API Gateway REST API
- **Backend**: AWS Lambda functions
- **Security**: KMS encryption for credentials

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Project Structure

```
aws-cost-janitor/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── about/        # About page
│   │   ├── getting-started/  # Setup guide
│   │   ├── how-it-works/     # How it works page
│   │   └── faq/          # FAQ page
│   ├── components/       # React components
│   │   └── sidebar.tsx  # Navigation sidebar
│   └── lib/              # Utility libraries
│       ├── costScanner.ts    # Main scanning logic
│       └── awsScan.ts        # Legacy scanner
├── aws-deployment/       # AWS CDK infrastructure
│   ├── lib/              # CDK stack definitions
│   └── lambda/           # Lambda function code
└── public/               # Static assets
```

## 🔐 Security

- **Read-Only Access**: AWS Dzera only uses read-only permissions. It cannot modify, delete, or create any resources.
- **No Data Storage**: Credentials are used only for the scan and are never stored.
- **Encrypted Transmission**: In production, credentials are encrypted using AWS KMS before transmission.
- **Local Processing**: In development, all scanning happens locally on your machine.

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📦 Deployment

### Deploy to AWS

```bash
cd aws-deployment
npm install
cdk bootstrap  # First time only
cdk deploy
```

See [aws-deployment/README.md](./aws-deployment/README.md) for detailed instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AWS SDK for JavaScript v3
- Icons from [Lucide React](https://lucide.dev/)

## 📞 Support

- **Documentation**: Check the [Getting Started](/getting-started) and [FAQ](/faq) pages
- **Issues**: Open an issue on [GitHub](https://github.com/stalkiq/dzera/issues)
- **Questions**: See the [FAQ page](/faq) for common questions

---

Made with ❤️ for AWS cost optimization
