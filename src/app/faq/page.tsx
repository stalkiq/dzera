// src/app/faq/page.tsx
"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "Is AWS Dzera safe to use?",
    answer: "Yes! AWS Dzera uses read-only AWS permissions, meaning it can only view your resources—it cannot modify, delete, or create anything. Your credentials are used only for the scan and are never stored. All processing happens locally on your machine.",
  },
  {
    question: "How much does AWS Dzera cost?",
    answer: "AWS Dzera is completely free to use. There are no subscription fees, usage limits, or hidden costs. You can run as many scans as you need.",
  },
  {
    question: "What AWS services does Dzera scan?",
    answer: "Dzera scans EC2 instances, RDS databases, S3 buckets, DynamoDB tables, CloudFront distributions, NAT Gateways, Elastic IPs, EBS volumes, and more across multiple AWS regions (us-west-2 and us-east-1 by default).",
  },
  {
    question: "How accurate are the cost estimates?",
    answer: "Cost estimates are based on AWS pricing data and are accurate for typical usage patterns. Actual costs may vary based on data transfer, reserved instances, discounts, and actual usage. The estimates are designed to help you identify high-cost resources and prioritize optimizations.",
  },
  {
    question: "Do I need to install anything?",
    answer: "No installation required! AWS Dzera runs entirely in your web browser. You just need to provide AWS credentials with read-only access.",
  },
  {
    question: "What permissions does AWS Dzera need?",
    answer: "AWS Dzera requires read-only access to your AWS account. The easiest way is to attach the AWS-managed 'ReadOnlyAccess' policy to an IAM user. This gives Dzera permission to list and describe resources but not to modify anything.",
  },
  {
    question: "Can I scan multiple AWS accounts?",
    answer: "Yes! You can scan different AWS accounts by using different IAM user credentials. Simply enter the credentials for each account you want to analyze.",
  },
  {
    question: "How long does a scan take?",
    answer: "A typical scan takes 30-60 seconds, depending on the number of resources in your AWS account. The scan checks multiple services across multiple regions, so accounts with many resources may take slightly longer.",
  },
  {
    question: "What should I do with the findings?",
    answer: "Review the findings, prioritize by cost (start with critical/high-cost items), and follow the suggestions. Each finding includes a direct link to the AWS Console where you can manage the resource. Always verify resources are truly unused before deleting them.",
  },
  {
    question: "Will AWS Dzera affect my AWS account performance?",
    answer: "No. AWS Dzera only performs read operations (list and describe API calls), which have minimal impact on your AWS account. These are the same types of calls the AWS Console makes when you browse your resources.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-[#262626]">Frequently Asked Questions</h1>
        <p className="text-[#737373] text-lg">
          Everything you need to know about AWS Dzera
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white border border-[#d4d4d4] rounded-lg overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-[#f5f5f5] transition-colors"
            >
              <h3 className="text-lg font-semibold text-[#262626] pr-4">{faq.question}</h3>
              <ChevronDown
                className={`w-5 h-5 text-[#737373] flex-shrink-0 transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-6 pb-6">
                <p className="text-[#404040] leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 mt-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[#262626] mb-4">Still have questions?</h2>
          <p className="text-[#404040] mb-4">
            If you can't find the answer you're looking for, check out our{" "}
            <a href="/getting-started" className="text-[#525252] hover:underline">
              Getting Started
            </a>{" "}
            guide or{" "}
            <a href="/how-it-works" className="text-[#525252] hover:underline">
              How It Works
            </a>{" "}
            page for more detailed information.
          </p>
        </section>
    </div>
  );
}

