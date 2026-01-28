// src/app/about/page.tsx
"use client";

import { TrendingDown, DollarSign, Search, AlertTriangle, Zap } from "lucide-react";

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

        <section className="bg-gradient-to-br from-[#e5e5e5] to-[#d4d4d4] border border-[#d4d4d4] rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-[#262626] mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-[#404040] mb-4">
            Connect your AWS account and get a comprehensive cost analysis in minutes.
            No credit card required, completely free to use.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-[#525252] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#404040] transition-colors"
          >
            Start Scanning →
          </a>
        </section>
      </div>
    </div>
  );
}
