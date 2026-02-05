// src/app/about/page.tsx
"use client";

import { TrendingDown, DollarSign, Search, AlertTriangle, Zap, ExternalLink } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#737373] to-[#525252] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">DZ</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#262626]">What is AWS Dzera?</h1>
            <p className="text-[#737373] text-lg">
              Your intelligent AWS cost optimization assistant
            </p>
          </div>
        </div>
      </div>

      <div className="prose max-w-none space-y-6">
        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#262626] mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#525252]" />
            The Problem
          </h2>
          <p className="text-[#404040] leading-relaxed">
            AWS bills can be confusing and expensive. Hidden costs from unused resources,
            forgotten instances, and inefficient configurations silently drain your budget
            every month. Without proper visibility, you're paying for resources you don't
            even know exist.
          </p>
        </section>

        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#262626] mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#525252]" />
            The Solution: AWS Dzera
          </h2>
          <p className="text-[#404040] leading-relaxed mb-4">
            <strong className="text-[#262626]">AWS Dzera</strong> is a powerful cost optimization
            tool that scans your AWS account to identify exactly why your bill is high. It
            finds expensive resources, unused services, and optimization opportunities that
            can save you hundreds or thousands of dollars per month.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-[#f5f5f5] p-4 rounded-lg border border-[#d4d4d4]">
              <Search className="w-8 h-8 text-[#525252] mb-2" />
              <h3 className="text-lg font-semibold text-[#262626] mb-2">
                Comprehensive Scanning
              </h3>
              <p className="text-[#737373] text-sm">
                Scans EC2, RDS, S3, DynamoDB, CloudFront, NAT Gateways, Elastic IPs, and more
                across multiple regions
              </p>
            </div>
            <div className="bg-[#f5f5f5] p-4 rounded-lg border border-[#d4d4d4]">
              <TrendingDown className="w-8 h-8 text-[#525252] mb-2" />
              <h3 className="text-lg font-semibold text-[#262626] mb-2">
                Cost Estimates
              </h3>
              <p className="text-[#737373] text-sm">
                Get accurate monthly cost estimates for each resource, helping you prioritize
                which optimizations will have the biggest impact
              </p>
            </div>
            <div className="bg-[#f5f5f5] p-4 rounded-lg border border-[#d4d4d4]">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mb-2" />
              <h3 className="text-lg font-semibold text-[#262626] mb-2">
                Smart Recommendations
              </h3>
              <p className="text-[#737373] text-sm">
                Receive actionable suggestions for each finding, with direct links to AWS
                Console for quick fixes
              </p>
            </div>
            <div className="bg-[#f5f5f5] p-4 rounded-lg border border-[#d4d4d4]">
              <DollarSign className="w-8 h-8 text-[#525252] mb-2" />
              <h3 className="text-lg font-semibold text-[#262626] mb-2">
                Save Money
              </h3>
              <p className="text-[#737373] text-sm">
                Identify and eliminate wasteful spending. Many users save 20-40% on their
                AWS bills after using Dzera
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#262626] mb-4">
            How AWS Dzera Helps You Reduce Costs
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#e5e5e5] rounded-full flex items-center justify-center">
                <span className="text-[#525252] font-bold">1</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#262626] mb-1">
                  Find Running Resources
                </h3>
                <p className="text-[#404040] text-sm">
                  Discovers EC2 instances, RDS databases, and other services running 24/7
                  that you might have forgotten about. These can cost hundreds per month.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#e5e5e5] rounded-full flex items-center justify-center">
                <span className="text-[#525252] font-bold">2</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#262626] mb-1">
                  Identify Unattached Resources
                </h3>
                <p className="text-[#404040] text-sm">
                  Finds EBS volumes, Elastic IPs, and other resources not connected to anything
                  but still costing money.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#e5e5e5] rounded-full flex items-center justify-center">
                <span className="text-[#525252] font-bold">3</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#262626] mb-1">
                  Detect Costly Configurations
                </h3>
                <p className="text-[#404040] text-sm">
                  Highlights expensive setups like NAT Gateways, replicated DynamoDB tables,
                  and versioned S3 buckets that may not be necessary.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#e5e5e5] rounded-full flex items-center justify-center">
                <span className="text-[#525252] font-bold">4</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#262626] mb-1">
                  Prioritize by Impact
                </h3>
                <p className="text-[#404040] text-sm">
                  See estimated monthly costs for each finding, so you know which
                  optimizations will save the most money.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#262626] mb-6">
            How It Works
          </h2>
          <p className="text-[#737373] mb-6">
            Understanding AWS Dzera's cost optimization process
          </p>

          <div className="space-y-6">
            <div className="bg-[#f5f5f5] border border-[#d4d4d4] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-8 h-8 text-[#525252]" />
                <h3 className="text-xl font-semibold text-[#262626]">1. Comprehensive Scanning</h3>
              </div>
              <p className="text-[#404040] mb-4">
                AWS Dzera connects to your AWS account using read-only credentials and scans
                multiple services across different regions:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["EC2 Instances", "RDS Databases", "S3 Buckets", "DynamoDB Tables", "CloudFront", "NAT Gateways", "Elastic IPs", "EBS Volumes"].map((service) => (
                  <div
                    key={service}
                    className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-center"
                  >
                    <p className="text-[#404040] text-sm">{service}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#f5f5f5] border border-[#d4d4d4] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-8 h-8 text-[#525252]" />
                <h3 className="text-xl font-semibold text-[#262626]">2. Cost Analysis</h3>
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
            </div>

            <div className="bg-[#f5f5f5] border border-[#d4d4d4] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                <h3 className="text-xl font-semibold text-[#262626]">3. Issue Identification</h3>
              </div>
              <p className="text-[#404040] mb-4">
                Resources are categorized by severity and cost impact:
              </p>
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-red-600">Critical</h4>
                  </div>
                  <p className="text-[#404040] text-sm">
                    High-cost resources like running EC2 instances, RDS databases, and NAT
                    Gateways that can cost $50-500+ per month each.
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-600">Warning</h4>
                  </div>
                  <p className="text-[#404040] text-sm">
                    Medium-cost issues like unattached EBS volumes, Elastic IPs, or CloudFront
                    distributions that cost $3-50 per month.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-600">Info</h4>
                  </div>
                  <p className="text-[#404040] text-sm">
                    Optimization opportunities like versioned S3 buckets or replicated DynamoDB
                    tables that may have lower-cost alternatives.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#f5f5f5] border border-[#d4d4d4] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <ExternalLink className="w-8 h-8 text-[#525252]" />
                <h3 className="text-xl font-semibold text-[#262626]">4. Actionable Recommendations</h3>
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
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[#e5e5e5] to-[#d4d4d4] border border-[#d4d4d4] rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-[#262626] mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-[#404040] mb-4">
            The entire scan takes 30-60 seconds and provides a complete breakdown of your
            AWS costs with actionable recommendations. Connect your AWS account and get a comprehensive cost analysis in minutes.
            No credit card required, completely free to use.
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
