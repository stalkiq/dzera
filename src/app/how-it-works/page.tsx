// src/app/how-it-works/page.tsx
"use client";

import { Search, DollarSign, AlertTriangle, ExternalLink, Zap } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-[#262626]">How It Works</h1>
        <p className="text-[#737373] text-lg">
          Understanding AWS Dzera's cost optimization process
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-8 h-8 text-[#525252]" />
            <h2 className="text-2xl font-semibold text-[#262626]">1. Comprehensive Scanning</h2>
          </div>
          <p className="text-[#404040] mb-4">
            AWS Dzera connects to your AWS account using read-only credentials and scans
            multiple services across different regions:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["EC2 Instances", "RDS Databases", "S3 Buckets", "DynamoDB Tables", "CloudFront", "NAT Gateways", "Elastic IPs", "EBS Volumes"].map((service) => (
              <div
                key={service}
                className="bg-[#f5f5f5] border border-[#d4d4d4] rounded px-3 py-2 text-center"
              >
                <p className="text-[#404040] text-sm">{service}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8 text-[#525252]" />
            <h2 className="text-2xl font-semibold text-[#262626]">2. Cost Analysis</h2>
          </div>
          <p className="text-[#404040] mb-4">
            For each resource found, AWS Dzera calculates estimated monthly costs based on:
          </p>
          <ul className="space-y-2 text-[#404040] ml-6 list-disc">
            <li>Instance types and sizes (EC2, RDS)</li>
            <li>Storage volumes and sizes (EBS, S3)</li>
            <li>Network usage (NAT Gateways, Elastic IPs)</li>
            <li>Service-specific pricing models</li>
            <li>Regional pricing differences</li>
          </ul>
        </section>

        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <h2 className="text-2xl font-semibold text-[#262626]">3. Issue Identification</h2>
          </div>
          <p className="text-[#404040] mb-4">
            Resources are categorized by severity and cost impact:
          </p>
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-600">Critical</h3>
              </div>
              <p className="text-[#404040] text-sm">
                High-cost resources like running EC2 instances, RDS databases, and NAT
                Gateways that can cost $50-500+ per month each.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-600">Warning</h3>
              </div>
              <p className="text-[#404040] text-sm">
                Medium-cost issues like unattached EBS volumes, Elastic IPs, or CloudFront
                distributions that cost $3-50 per month.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-600">Info</h3>
              </div>
              <p className="text-[#404040] text-sm">
                Optimization opportunities like versioned S3 buckets or replicated DynamoDB
                tables that may have lower-cost alternatives.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ExternalLink className="w-8 h-8 text-[#525252]" />
            <h2 className="text-2xl font-semibold text-[#262626]">4. Actionable Recommendations</h2>
          </div>
          <p className="text-[#404040] mb-4">
            Each finding includes:
          </p>
          <ul className="space-y-2 text-[#404040] ml-6 list-disc">
            <li>
              <strong className="text-[#262626]">Detailed description</strong> of what the resource
              is and why it's costing money
            </li>
            <li>
              <strong className="text-[#262626]">Estimated monthly cost</strong> so you can prioritize
              which issues to address first
            </li>
            <li>
              <strong className="text-[#262626]">Specific suggestions</strong> for how to reduce or
              eliminate the cost
            </li>
            <li>
              <strong className="text-[#262626]">Direct AWS Console links</strong> to quickly access
              and manage the resource
            </li>
          </ul>
        </section>

        <section className="bg-gradient-to-br from-[#e5e5e5] to-[#d4d4d4] border border-[#d4d4d4] rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-[#262626] mb-4">
            Ready to See Your Results?
          </h2>
          <p className="text-[#404040] mb-4">
            The entire scan takes 30-60 seconds and provides a complete breakdown of your
            AWS costs with actionable recommendations.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-[#525252] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#404040] transition-colors"
          >
            Run Your First Scan →
          </a>
        </section>
      </div>
    </div>
  );
}

