// src/app/why-dzera/page.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";

// White Diamond D Logo Component
const DLogo = ({ size = "sm", variant = "white" }: { size?: "xs" | "sm" | "md" | "lg" | "xl"; variant?: "white" | "orange" | "dark" }) => {
  const sizes = {
    xs: { wrapper: "w-3 h-3", text: "text-[6px]" },
    sm: { wrapper: "w-4 h-4", text: "text-[8px]" },
    md: { wrapper: "w-6 h-6", text: "text-[10px]" },
    lg: { wrapper: "w-8 h-8", text: "text-sm" },
    xl: { wrapper: "w-12 h-12", text: "text-xl" }
  };
  const colors = {
    white: { bg: "bg-white", text: "text-gray-900" },
    orange: { bg: "bg-[#FF9900]", text: "text-black" },
    dark: { bg: "bg-gray-800", text: "text-white" }
  };
  return (
    <div className={`relative ${sizes[size].wrapper} flex items-center justify-center flex-shrink-0`}>
      <div className={`absolute inset-0 ${colors[variant].bg} rotate-45 rounded-[2px] shadow-sm`}></div>
      <span className={`relative ${colors[variant].text} font-black ${sizes[size].text} z-10`}>D</span>
    </div>
  );
};

const faqs = [
  {
    question: "Is AWS Dzera safe to use?",
    answer: "Absolutely. AWS Dzera operates exclusively with read-only AWS permissions, meaning it can only view your resources—it cannot modify, delete, or create anything in your account. Your credentials are used solely for the duration of the scan and are never stored, logged, or transmitted to any external servers. All processing occurs directly in your browser session.",
  },
  {
    question: "How much does AWS Dzera cost?",
    answer: "AWS Dzera is completely free to use with no subscription fees, usage limits, or hidden costs. Our mission is to help developers and organizations optimize their cloud spending without adding another line item to their budget. Run as many analyses as needed, as frequently as you need.",
  },
  {
    question: "What AWS services does Dzera analyze?",
    answer: "Dzera performs comprehensive analysis across EC2 instances, RDS databases, Aurora clusters, S3 buckets, DynamoDB tables and global table replicas, CloudFront distributions, NAT Gateways, Elastic IPs, EBS volumes, Lambda functions, ElastiCache clusters, and more. Analysis spans multiple AWS regions (us-west-2 and us-east-1 by default) to ensure complete coverage.",
  },
  {
    question: "How accurate are the cost estimates?",
    answer: "Cost estimates are calculated using current AWS pricing data and are highly accurate for typical usage patterns. Dzera factors in instance types, storage classes, data transfer rates, and region-specific pricing. Actual costs may vary based on reserved instances, savings plans, enterprise discounts, and actual usage volumes. Estimates are designed to identify high-cost resources and prioritize optimization efforts.",
  },
  {
    question: "Do I need to install anything?",
    answer: "No installation required. AWS Dzera runs entirely in your web browser as a modern web application. Simply provide AWS credentials with read-only access, and Dzera handles everything else. No agents, no plugins, no CLI tools required on your end.",
  },
  {
    question: "What IAM permissions does Dzera require?",
    answer: "Dzera requires read-only access to your AWS account. The simplest approach is to attach the AWS-managed 'ReadOnlyAccess' policy to a dedicated IAM user. This grants Dzera permission to list and describe resources across services while ensuring it cannot modify any resources. For enhanced security, you can create a custom policy that limits access to specific services.",
  },
  {
    question: "Can I analyze multiple AWS accounts?",
    answer: "Yes. You can analyze different AWS accounts by providing credentials for each account you want to review. This is particularly useful for organizations managing multiple accounts for different environments (development, staging, production) or different business units. Simply run separate analyses with the appropriate credentials.",
  },
  {
    question: "How long does an analysis take?",
    answer: "A typical analysis completes in 30-60 seconds, depending on the number and complexity of resources in your AWS account. The analysis queries multiple services across multiple regions, so accounts with extensive infrastructure may require slightly longer. Progress is displayed in real-time in the terminal pane.",
  },
  {
    question: "What should I do with the findings?",
    answer: "Review findings by severity (critical, warning, informational) and prioritize by cost impact. Each finding includes specific details about the resource, estimated monthly cost, actionable recommendations, and a direct link to the AWS Console for that resource. Always verify resources are truly unused or misconfigured before making changes.",
  },
  {
    question: "Will Dzera affect my AWS account performance?",
    answer: "No. Dzera performs only read operations (List and Describe API calls), which have minimal impact on your AWS account and are rate-limited appropriately. These are the same types of calls the AWS Console makes when you browse your resources. Your running workloads are completely unaffected.",
  },
  {
    question: "How does Dzera compare to AWS Cost Explorer?",
    answer: "AWS Cost Explorer shows aggregated billing data by service. Dzera complements this by identifying the specific resources driving those costs. While Cost Explorer tells you 'EC2 cost $500 this month,' Dzera tells you exactly which instances are running, their types, and whether they're being utilized efficiently.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes. Dzera never stores your AWS credentials or the data retrieved during analysis. All operations occur in your browser session. We don't have access to your AWS account, your resources, or your analysis results. Your data never leaves your control.",
  },
];

export default function WhyDzeraPage() {
  const [activeSection, setActiveSection] = useState("whitepaper");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const script = `echo "--- S3 BUCKETS ---" \\
&& aws s3 ls \\
&& echo "\\n--- CLOUDFRONT DISTRIBUTIONS ---" \\
&& aws cloudfront list-distributions --query "DistributionList.Items[*].{Id:Id,DomainName:DomainName,Status:Status,Comment:Comment}" --output table \\
&& echo "\\n--- DYNAMODB TABLES (us-west-2) ---" \\
&& aws dynamodb list-tables --region us-west-2 \\
&& echo "\\n--- DYNAMODB TABLES (us-east-1) ---" \\
&& aws dynamodb list-tables --region us-east-1 \\
&& echo "\\n--- EC2 INSTANCES (Running) ---" \\
&& aws ec2 describe-instances --filters "Name=instance-state-name,Values=running" --query "Reservations[*].Instances[*].{Id:InstanceId,Type:InstanceType,Status:State.Name}" --output table \\
&& echo "\\n--- NAT GATEWAYS ---" \\
&& aws ec2 describe-nat-gateways --query "NatGateways[*].{Id:NatGatewayId,State:State,VpcId:VpcId}" --output table \\
&& echo "\\n--- ELASTIC IPS ---" \\
&& aws ec2 describe-addresses --query "Addresses[*].{PublicIp:PublicIp,AllocationId:AllocationId,AssociationId:AssociationId}" --output table`;

  const renderWhitepaper = () => (
    <div className="space-y-8">
      {/* Article Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <DLogo size="lg" variant="orange" />
          <div>
            <h1 className="text-3xl font-serif text-black">AWS Cost Analysis With Dzera</h1>
            <p className="text-gray-700 italic">Methodology, Architecture, and Implementation</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">From AWS Dzera Documentation</p>
      </div>

      {/* Infobox - Full width on mobile, float right on larger screens */}
      <div className="w-full sm:float-right sm:ml-6 mb-6 sm:w-80 bg-gray-50 border border-gray-300 p-4 text-sm">
        <div className="text-center mb-3">
          <div className="w-full h-32 bg-gradient-to-br from-[#232f3e] to-[#131A22] rounded flex items-center justify-center mb-2">
            <DLogo size="xl" variant="orange" />
          </div>
          <p className="font-semibold italic">AWS Dzera</p>
        </div>
        <table className="w-full text-gray-900">
          <tbody>
            <tr className="border-t border-gray-300">
              <td className="font-semibold py-1 pr-2 text-black">Type:</td>
              <td className="py-1 text-gray-800">FinOps Platform</td>
            </tr>
            <tr className="border-t border-gray-300">
              <td className="font-semibold py-1 pr-2 text-black">Purpose:</td>
              <td className="py-1 text-gray-800">Infrastructure Cost Analysis</td>
            </tr>
            <tr className="border-t border-gray-300">
              <td className="font-semibold py-1 pr-2 text-black">Method:</td>
              <td className="py-1 text-gray-800">Real-Time Resource Scanning</td>
            </tr>
            <tr className="border-t border-gray-300">
              <td className="font-semibold py-1 pr-2 text-black">Access:</td>
              <td className="py-1 text-gray-800">Read-Only Permissions</td>
            </tr>
            <tr className="border-t border-gray-300">
              <td className="font-semibold py-1 pr-2 text-black">Cost:</td>
              <td className="py-1 text-gray-800">Free</td>
            </tr>
            <tr className="border-t border-gray-300">
              <td className="font-semibold py-1 pr-2 text-black">License:</td>
              <td className="py-1 text-gray-800">MIT</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Executive Summary */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Executive Summary
        </h2>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <p className="text-gray-800 leading-relaxed">
            AWS Dzera is a comprehensive FinOps tool designed to demystify AWS billing by correlating live infrastructure state with cost data. Unlike traditional billing dashboards that show aggregated service totals, Dzera identifies the specific resources responsible for your monthly spend and provides actionable remediation recommendations.
          </p>
        </div>
        <p className="text-gray-800 leading-relaxed mb-4">
          The platform operates on a simple principle: visibility precedes optimization. By enumerating all active resources across multiple AWS services and regions, calculating estimated costs using current pricing data, and presenting findings with severity classifications, Dzera enables informed decisions about infrastructure spending.
        </p>
        <div className="bg-gray-50 border border-gray-300 rounded p-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <DLogo size="xs" variant="dark" />
            Core Methodology
          </h4>
          <ul className="list-disc ml-6 space-y-1 text-gray-800">
            <li>Inventory all active resources that incur ongoing charges</li>
            <li>Correlate inventory with AWS pricing models and estimate monthly costs</li>
            <li>Classify findings by severity based on cost impact and optimization potential</li>
            <li>Provide direct console links for immediate remediation</li>
          </ul>
        </div>
      </section>

      {/* The Problem */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          The Problem: AWS Bill Opacity
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          AWS billing presents a fundamental challenge: the gap between aggregated cost data and specific resource identification. Consider a typical scenario:
        </p>
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-900 italic">
            &ldquo;Your EC2 charges increased by 40% this month.&rdquo;
          </p>
          <p className="text-red-700 text-sm mt-2">
            But which instances? In which regions? Running what workloads? Are they needed?
          </p>
        </div>
        <p className="text-gray-800 leading-relaxed mb-4">
          This opacity leads to several organizational challenges:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-300 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="dark" />
              <h4 className="font-semibold text-gray-900">Orphaned Resources</h4>
            </div>
            <p className="text-gray-700 text-sm">
              Development instances, test databases, and temporary infrastructure remain running long after their purpose has ended, accumulating charges invisibly.
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-300 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="dark" />
              <h4 className="font-semibold text-gray-900">Configuration Drift</h4>
            </div>
            <p className="text-gray-700 text-sm">
              Resources provisioned with generous specifications during initial setup are never right-sized as actual usage patterns emerge.
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-300 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="dark" />
              <h4 className="font-semibold text-gray-900">Hidden Costs</h4>
            </div>
            <p className="text-gray-700 text-sm">
              NAT Gateways, Elastic IPs, and cross-region replication generate charges that don&apos;t map to obvious workloads, making them easy to overlook.
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-300 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="dark" />
              <h4 className="font-semibold text-gray-900">Attribution Gaps</h4>
            </div>
            <p className="text-gray-700 text-sm">
              Without resource-level visibility, teams cannot accurately attribute costs to projects, making budget planning and chargeback impossible.
            </p>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          The Solution: Resource-Level Analysis
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Dzera bridges the gap between billing aggregates and specific resources through systematic enumeration:
        </p>
        
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-green-900">1. Comprehensive Inventory</h4>
            </div>
            <p className="text-green-800 text-sm">
              Query all relevant AWS services across configured regions to build a complete picture of active infrastructure.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-green-900">2. Cost Correlation</h4>
            </div>
            <p className="text-green-800 text-sm">
              Apply current AWS pricing to each resource based on type, size, region, and configuration to estimate monthly charges.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-green-900">3. Severity Classification</h4>
            </div>
            <p className="text-green-800 text-sm">
              Categorize findings by cost impact and optimization potential: Critical (high-cost running resources), Warning (unused/misconfigured), Informational (optimization opportunities).
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-green-900">4. Actionable Output</h4>
            </div>
            <p className="text-green-800 text-sm">
              Provide specific recommendations and direct console links for each finding, enabling immediate investigation and remediation.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Technical Architecture
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Dzera operates entirely within the user&apos;s browser session, ensuring credentials never leave the client environment:
        </p>
        
        <div className="bg-gray-900 rounded p-4 mb-4">
          <code className="text-green-400 text-sm block">
            User Browser → AWS API Gateway → Lambda Function → AWS Services<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;Results rendered client-side (no data persistence)
          </code>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <DLogo size="xs" variant="dark" />
            Security Model
          </h4>
          <ul className="space-y-1 text-yellow-800 list-disc ml-4 text-sm">
            <li>Credentials transmitted directly to AWS APIs, never stored</li>
            <li>Read-only operations only (List, Describe, Get)</li>
            <li>All processing occurs in-session; no persistent backend</li>
            <li>IAM permissions constrain all operations</li>
          </ul>
        </div>
      </section>

      {/* Services Analyzed */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Services Analyzed
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Dzera analyzes the AWS services most commonly associated with unexpected cost increases:
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="border border-gray-600 px-3 py-2 text-left font-bold">Service</th>
                <th className="border border-gray-600 px-3 py-2 text-left font-bold">Cost Driver</th>
                <th className="border border-gray-600 px-3 py-2 text-left font-bold">Common Issues</th>
              </tr>
            </thead>
            <tbody className="text-gray-900">
              <tr className="bg-white">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">EC2</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Hourly compute</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Oversized instances, 24/7 dev environments</td>
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">RDS</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Instance hours + storage</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Multi-AZ without need, oversized instances</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">NAT Gateway</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Hourly + data processing</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Forgotten gateways, excessive data transfer</td>
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">Elastic IP</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Hourly when unassociated</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Unattached IPs from terminated instances</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">DynamoDB</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Capacity + storage</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Global table replicas, over-provisioned capacity</td>
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">CloudFront</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Requests + data transfer</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Unused distributions, expensive price classes</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">S3</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Storage + requests</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Versioning without lifecycle, wrong storage class</td>
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">EBS</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Provisioned storage</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Unattached volumes from deleted instances</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Conclusion */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Conclusion
        </h2>
        <div className="bg-gray-50 border border-gray-300 rounded p-4">
          <p className="text-gray-800 leading-relaxed">
            AWS Dzera transforms the traditionally opaque process of AWS cost analysis into a systematic, repeatable workflow. By correlating live infrastructure state with pricing data and presenting findings with actionable recommendations, Dzera enables organizations to understand, control, and optimize their cloud spending. The tool&apos;s read-only, browser-based architecture ensures security while eliminating deployment complexity.
          </p>
        </div>
      </section>
    </div>
  );

  const renderWhatIsDzera = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <DLogo size="lg" variant="orange" />
          <h1 className="text-3xl font-serif text-black">What is AWS Dzera?</h1>
        </div>
        <p className="text-gray-700 italic">Your intelligent AWS cost optimization platform</p>
      </div>

      {/* Overview */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Overview
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          <strong>AWS Dzera</strong> is a comprehensive FinOps platform that provides instant visibility into your AWS infrastructure costs. Unlike billing dashboards that show aggregated totals, Dzera identifies the specific resources driving your monthly spend and delivers actionable optimization recommendations.
        </p>
        <div className="bg-[#232f3e] text-white rounded-lg p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <DLogo size="lg" variant="orange" />
            <div>
              <h3 className="text-xl font-bold">The Dzera Difference</h3>
              <p className="text-gray-300 text-sm">From billing confusion to resource clarity</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Traditional billing tells you:</p>
              <p className="text-[#FF9900] font-mono">&ldquo;EC2: $847.23/month&rdquo;</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Dzera tells you:</p>
              <p className="text-green-400 font-mono">&ldquo;i-abc123 (m5.xlarge) running 24/7 in us-west-2 costs ~$140/mo&rdquo;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Key Capabilities
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-300 p-4 rounded">
            <div className="flex items-center gap-2 mb-3">
              <DLogo size="md" variant="orange" />
              <h3 className="text-lg font-semibold text-gray-900">Multi-Service Scanning</h3>
            </div>
            <p className="text-gray-700 text-sm mb-2">
              Comprehensive analysis across all major AWS cost centers:
            </p>
            <ul className="text-gray-800 text-xs space-y-1 ml-4 list-disc">
              <li>EC2, RDS, Aurora database instances</li>
              <li>S3, EBS, EFS storage resources</li>
              <li>NAT Gateways, Elastic IPs, VPC endpoints</li>
              <li>CloudFront, API Gateway distributions</li>
              <li>DynamoDB, ElastiCache clusters</li>
              <li>Lambda functions and provisioned concurrency</li>
            </ul>
          </div>
          <div className="bg-gray-50 border border-gray-300 p-4 rounded">
            <div className="flex items-center gap-2 mb-3">
              <DLogo size="md" variant="orange" />
              <h3 className="text-lg font-semibold text-gray-900">Real-Time Cost Estimation</h3>
            </div>
            <p className="text-gray-700 text-sm mb-2">
              Accurate cost calculations using current AWS pricing:
            </p>
            <ul className="text-gray-800 text-xs space-y-1 ml-4 list-disc">
              <li>Instance type and region-specific rates</li>
              <li>Storage class and volume type pricing</li>
              <li>Data transfer and request charges</li>
              <li>Hourly, daily, and monthly projections</li>
              <li>Comparison with reserved/savings plan rates</li>
            </ul>
          </div>
          <div className="bg-gray-50 border border-gray-300 p-4 rounded">
            <div className="flex items-center gap-2 mb-3">
              <DLogo size="md" variant="orange" />
              <h3 className="text-lg font-semibold text-gray-900">Intelligent Classification</h3>
            </div>
            <p className="text-gray-700 text-sm mb-2">
              Findings organized by severity and impact:
            </p>
            <ul className="text-gray-800 text-xs space-y-1 ml-4 list-disc">
              <li><span className="text-red-600 font-medium">Critical:</span> High-cost running resources</li>
              <li><span className="text-yellow-600 font-medium">Warning:</span> Unused or misconfigured items</li>
              <li><span className="text-blue-600 font-medium">Info:</span> Optimization opportunities</li>
              <li>Cost-sorted prioritization</li>
            </ul>
          </div>
          <div className="bg-gray-50 border border-gray-300 p-4 rounded">
            <div className="flex items-center gap-2 mb-3">
              <DLogo size="md" variant="orange" />
              <h3 className="text-lg font-semibold text-gray-900">Actionable Recommendations</h3>
            </div>
            <p className="text-gray-700 text-sm mb-2">
              Specific guidance for each finding:
            </p>
            <ul className="text-gray-800 text-xs space-y-1 ml-4 list-disc">
              <li>Direct AWS Console links</li>
              <li>Rightsizing recommendations</li>
              <li>Reserved Instance opportunities</li>
              <li>Architecture optimization suggestions</li>
              <li>Resource cleanup guidance</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          How It Works
        </h2>
        
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-[#FF9900] rounded-full flex items-center justify-center text-black font-bold">1</div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Connect Your Account</h4>
              <p className="text-gray-700 text-sm">
                Provide AWS credentials with read-only access. Dzera recommends using a dedicated IAM user with the AWS-managed ReadOnlyAccess policy for security.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-[#FF9900] rounded-full flex items-center justify-center text-black font-bold">2</div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Automated Analysis</h4>
              <p className="text-gray-700 text-sm">
                Dzera queries multiple AWS services across configured regions, building a complete inventory of active resources and their configurations.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-[#FF9900] rounded-full flex items-center justify-center text-black font-bold">3</div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Cost Correlation</h4>
              <p className="text-gray-700 text-sm">
                Each resource is matched with current AWS pricing data to calculate estimated monthly costs based on type, size, region, and configuration.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-[#FF9900] rounded-full flex items-center justify-center text-black font-bold">4</div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Review and Act</h4>
              <p className="text-gray-700 text-sm">
                Review prioritized findings, understand cost drivers, and take action using direct console links and specific recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Use Cases
        </h2>
        
        <div className="space-y-4">
          <div className="bg-gray-50 border-l-4 border-[#FF9900] p-4 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-gray-900">Monthly Bill Review</h4>
            </div>
            <p className="text-gray-700 text-sm">
              Run Dzera at the start of each billing cycle to understand what&apos;s driving costs and identify optimization opportunities before charges accumulate.
            </p>
          </div>
          <div className="bg-gray-50 border-l-4 border-[#FF9900] p-4 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-gray-900">Post-Project Cleanup</h4>
            </div>
            <p className="text-gray-700 text-sm">
              After completing a project or sprint, use Dzera to identify orphaned resources that should be terminated to prevent ongoing charges.
            </p>
          </div>
          <div className="bg-gray-50 border-l-4 border-[#FF9900] p-4 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-gray-900">Cost Spike Investigation</h4>
            </div>
            <p className="text-gray-700 text-sm">
              When your AWS bill unexpectedly increases, Dzera helps identify which new resources or configuration changes are responsible.
            </p>
          </div>
          <div className="bg-gray-50 border-l-4 border-[#FF9900] p-4 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-gray-900">Infrastructure Audit</h4>
            </div>
            <p className="text-gray-700 text-sm">
              Maintain visibility into your AWS footprint across accounts and regions, ensuring alignment between infrastructure and business requirements.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#232f3e] to-[#131A22] rounded-lg p-6 text-center">
        <DLogo size="xl" variant="orange" />
        <h3 className="text-xl font-bold text-white mt-4 mb-2">Ready to Optimize?</h3>
        <p className="text-gray-300 text-sm mb-4">
          Start analyzing your AWS infrastructure in under 60 seconds.
        </p>
        <a
          href="/"
          className="inline-block bg-[#FF9900] hover:bg-[#e68a00] text-black font-bold py-2 px-6 rounded transition-colors"
        >
          Launch Analyzer
        </a>
      </div>
    </div>
  );

  const renderFAQ = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <DLogo size="lg" variant="orange" />
          <h1 className="text-3xl font-serif text-black">Frequently Asked Questions</h1>
        </div>
        <p className="text-gray-700 italic">Everything you need to know about AWS Dzera</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white border border-gray-300 rounded overflow-hidden"
          >
            <button
              onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DLogo size="sm" variant={openFaqIndex === index ? "orange" : "dark"} />
                <h3 className="text-base font-semibold text-gray-900 pr-4">{faq.question}</h3>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${
                  openFaqIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            {openFaqIndex === index && (
              <div className="px-4 pb-4 border-t border-gray-200 ml-7">
                <p className="text-gray-800 leading-relaxed text-sm pt-3">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAmazonNova = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <DLogo size="lg" variant="orange" />
          <div>
            <h1 className="text-3xl font-serif text-black">Amazon Nova in AWS Dzera</h1>
            <p className="text-gray-700 italic">AI-powered intelligence throughout the platform</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">How Amazon Nova enhances cost optimization</p>
      </div>

      {/* What is Amazon Nova */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          What is Amazon Nova?
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          <strong>Amazon Nova</strong> is a family of foundation models developed by Amazon and available through AWS. Nova models are designed for speed, cost-efficiency, and deep understanding of AWS services and cloud infrastructure. AWS Dzera integrates <strong>Nova 2 Lite</strong> — a lightweight, low-latency model optimized for conversational interactions and domain-specific knowledge tasks.
        </p>
        <div className="bg-[#232f3e] text-white rounded-lg p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <DLogo size="lg" variant="orange" />
            <div>
              <h3 className="text-xl font-bold">Why Nova?</h3>
              <p className="text-gray-300 text-sm">Built by Amazon, for Amazon&apos;s cloud</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/5 rounded p-3">
              <p className="text-[#FF9900] font-semibold mb-1">Native AWS Knowledge</p>
              <p className="text-gray-300 text-xs">Deep understanding of AWS services, pricing models, and best practices — trained on AWS documentation.</p>
            </div>
            <div className="bg-white/5 rounded p-3">
              <p className="text-[#FF9900] font-semibold mb-1">Low Latency</p>
              <p className="text-gray-300 text-xs">Nova 2 Lite delivers sub-second responses, keeping the conversational experience fast and natural.</p>
            </div>
            <div className="bg-white/5 rounded p-3">
              <p className="text-[#FF9900] font-semibold mb-1">Cost Effective</p>
              <p className="text-gray-300 text-xs">Lightweight model means low inference costs, aligning with Dzera&apos;s mission to reduce — not add — cloud spend.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How Nova is Integrated */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          How Nova is Integrated
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Nova is not confined to a single chatbox — it&apos;s woven throughout the Dzera experience as an intelligence layer that assists users at every stage of the cost optimization workflow.
        </p>

        <div className="space-y-4">
          {/* Integration 1: Smart Onboarding */}
          <div className="bg-gray-50 border border-gray-300 p-5 rounded">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#FF9900] rounded-full flex items-center justify-center text-black font-bold text-lg">1</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Smart Onboarding Assistant</h3>
                <p className="text-xs text-gray-500">Pre-scan experience</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-3">
              When a user first visits Dzera, Nova greets them with a conversational onboarding flow instead of a static form. The assistant adapts its guidance based on the user&apos;s self-reported AWS experience level:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="bg-white border border-gray-200 rounded p-3">
                <p className="font-semibold text-sm text-gray-900 mb-1">&ldquo;I&apos;m new to AWS&rdquo;</p>
                <p className="text-xs text-gray-600">Full step-by-step IAM walkthrough with links to the AWS Console, explaining what access keys are and how to create them safely.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded p-3">
                <p className="font-semibold text-sm text-gray-900 mb-1">&ldquo;I know the basics&rdquo;</p>
                <p className="text-xs text-gray-600">Quick reminder about IAM best practices and ReadOnlyAccess policy, with direct links to create credentials.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded p-3">
                <p className="font-semibold text-sm text-gray-900 mb-1">&ldquo;I&apos;m an AWS expert&rdquo;</p>
                <p className="text-xs text-gray-600">Minimal guidance — confirms read-only API usage and immediately presents credential fields.</p>
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
              <p className="text-blue-800 text-xs">
                <strong>Key Feature:</strong> Nova validates credential format in real-time, catching common mistakes like temporary session tokens (ASIA vs AKIA) or truncated secret keys before the scan even begins.
              </p>
            </div>
          </div>

          {/* Integration 2: Chatbot */}
          <div className="bg-gray-50 border border-gray-300 p-5 rounded">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#FF9900] rounded-full flex items-center justify-center text-black font-bold text-lg">2</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AWS Cost Optimization Chatbot</h3>
                <p className="text-xs text-gray-500">Always-available assistant</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-3">
              The right sidebar features a persistent Nova-powered chatbot specialized in AWS cost optimization. Users can ask questions at any point — before, during, or after a scan:
            </p>
            <div className="bg-gray-900 rounded p-4 mb-3">
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="text-[#FF9900] font-bold flex-shrink-0">User:</span>
                  <span className="text-gray-300">&ldquo;Why is my NAT Gateway so expensive?&rdquo;</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-400 font-bold flex-shrink-0">Nova:</span>
                  <span className="text-gray-300">&ldquo;NAT Gateways charge $0.045/hour (~$32.40/month) just to exist, plus $0.045 per GB of data processed. If your private subnets route internet traffic through it, the data processing charges can exceed the hourly rate. Consider: 1) VPC endpoints for S3/DynamoDB ($0 data charge), 2) Moving workloads to public subnets if they don&apos;t need private networking, 3) Scheduling NAT Gateways off during non-business hours.&rdquo;</span>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-yellow-800 text-xs">
                <strong>System Prompt:</strong> Nova is pre-configured with a system prompt that focuses its responses specifically on AWS cost optimization, FinOps best practices, and infrastructure efficiency. It understands Dzera&apos;s capabilities and can guide users to specific features.
              </p>
            </div>
          </div>

          {/* Integration 3: In-Context Help */}
          <div className="bg-gray-50 border border-gray-300 p-5 rounded">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#FF9900] rounded-full flex items-center justify-center text-black font-bold text-lg">3</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">In-Context Help During Onboarding</h3>
                <p className="text-xs text-gray-500">Ask questions while setting up</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-3">
              While entering credentials in the onboarding flow, users can type free-form questions directly to Nova without leaving the setup screen. This means users don&apos;t need to switch to a separate help page or documentation — they get answers inline:
            </p>
            <ul className="list-disc ml-6 space-y-1 text-gray-700 text-sm">
              <li>&ldquo;What&apos;s the difference between AKIA and ASIA keys?&rdquo;</li>
              <li>&ldquo;Is it safe to use my root account credentials?&rdquo;</li>
              <li>&ldquo;How do I create a read-only IAM user?&rdquo;</li>
              <li>&ldquo;Can Dzera delete any of my resources?&rdquo;</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Technical Architecture
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Nova is integrated through a serverless backend architecture that keeps costs low and latency minimal:
        </p>
        <div className="bg-gray-900 rounded p-4 mb-4">
          <code className="text-green-400 text-sm block leading-relaxed">
            User Message → API Gateway → Lambda Function → Nova API<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Nova 2 Lite (model: nova-2-lite-v1)<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br/>
            AI Response → Lambda → API Gateway → User Interface
          </code>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="border border-gray-600 px-3 py-2 text-left font-bold">Component</th>
                <th className="border border-gray-600 px-3 py-2 text-left font-bold">Technology</th>
                <th className="border border-gray-600 px-3 py-2 text-left font-bold">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-gray-900">
              <tr className="bg-white">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">Model</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Nova 2 Lite (nova-2-lite-v1)</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Generate conversational AI responses</td>
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">API</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">OpenAI-compatible endpoint</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Standard chat completions interface</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">Backend</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">AWS Lambda (Node.js 20.x)</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Serverless request handling</td>
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">Gateway</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">AWS API Gateway (REST)</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">HTTPS endpoint with CORS</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">Frontend</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Next.js (React)</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Chat UI with message history</td>
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-black">Infrastructure</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">AWS CDK (TypeScript)</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">Infrastructure as Code deployment</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Conversation Design */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Conversation Design
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Nova maintains full conversation history within each session, enabling multi-turn dialogues where follow-up questions retain context:
        </p>
        <div className="bg-gray-900 rounded p-4 mb-4 space-y-2">
          <div className="flex gap-2 text-sm">
            <span className="text-[#FF9900] font-bold flex-shrink-0">User:</span>
            <span className="text-gray-300">&ldquo;What services does Dzera scan?&rdquo;</span>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="text-green-400 font-bold flex-shrink-0">Nova:</span>
            <span className="text-gray-300">&ldquo;Dzera scans EC2, RDS, S3, DynamoDB, CloudFront, NAT Gateways, Elastic IPs, and EBS volumes...&rdquo;</span>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="text-[#FF9900] font-bold flex-shrink-0">User:</span>
            <span className="text-gray-300">&ldquo;Which of those is usually the most expensive?&rdquo;</span>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="text-green-400 font-bold flex-shrink-0">Nova:</span>
            <span className="text-gray-300">&ldquo;EC2 and RDS are typically the largest cost drivers, often accounting for 50-70% of total spend...&rdquo;</span>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-300 rounded p-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <DLogo size="xs" variant="dark" />
            System Prompt Configuration
          </h4>
          <p className="text-gray-700 text-sm mb-2">
            Nova&apos;s system prompt constrains responses to AWS cost optimization topics:
          </p>
          <ul className="list-disc ml-6 space-y-1 text-gray-700 text-sm">
            <li>Focused on AWS services, pricing, and architecture</li>
            <li>Provides actionable cost-saving recommendations</li>
            <li>References specific AWS pricing data where possible</li>
            <li>Understands Dzera&apos;s capabilities and guides users to features</li>
            <li>Responds concisely — optimized for chat, not essays</li>
          </ul>
        </div>
      </section>

      {/* Security & Privacy */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Security &amp; Privacy
        </h2>
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <ul className="space-y-2 text-green-800 text-sm">
            <li className="flex items-start gap-2">
              <DLogo size="xs" variant="dark" />
              <span><strong>No credentials sent to Nova:</strong> AWS access keys are only used for the scan Lambda — they are never included in chat messages or Nova API calls.</span>
            </li>
            <li className="flex items-start gap-2">
              <DLogo size="xs" variant="dark" />
              <span><strong>No data persistence:</strong> Chat history exists only in the browser session. Closing the tab clears all conversation data.</span>
            </li>
            <li className="flex items-start gap-2">
              <DLogo size="xs" variant="dark" />
              <span><strong>Serverless processing:</strong> Lambda functions are ephemeral — no standing servers store or cache conversation data.</span>
            </li>
            <li className="flex items-start gap-2">
              <DLogo size="xs" variant="dark" />
              <span><strong>API key isolation:</strong> The Nova API key is stored as a Lambda environment variable and is never exposed to the frontend.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Future Roadmap */}
      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Future Nova Integrations
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Planned enhancements that will deepen Nova&apos;s role in the Dzera platform:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 border-l-4 border-[#FF9900] p-4 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-gray-900">Scan Results Analysis</h4>
            </div>
            <p className="text-gray-700 text-sm">
              After a scan completes, Nova will automatically summarize findings, highlight the biggest savings opportunities, and generate a prioritized action plan.
            </p>
          </div>
          <div className="bg-gray-50 border-l-4 border-[#FF9900] p-4 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-gray-900">Natural Language Search</h4>
            </div>
            <p className="text-gray-700 text-sm">
              Instead of filtering by service name, users will be able to search using plain English: &ldquo;services that cost money when idle&rdquo; or &ldquo;cheapest way to store files.&rdquo;
            </p>
          </div>
          <div className="bg-gray-50 border-l-4 border-[#FF9900] p-4 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-gray-900">Proactive Recommendations</h4>
            </div>
            <p className="text-gray-700 text-sm">
              Nova will surface contextual tips based on what the user is viewing — browsing EC2? Nova suggests Reserved Instances. Looking at S3? Nova recommends lifecycle policies.
            </p>
          </div>
          <div className="bg-gray-50 border-l-4 border-[#FF9900] p-4 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <DLogo size="sm" variant="orange" />
              <h4 className="font-semibold text-gray-900">Error Explanation</h4>
            </div>
            <p className="text-gray-700 text-sm">
              When scan errors occur, Nova will automatically explain the error in plain language and suggest resolution steps — no more cryptic error messages.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#232f3e] to-[#131A22] rounded-lg p-6 text-center">
        <DLogo size="xl" variant="orange" />
        <h3 className="text-xl font-bold text-white mt-4 mb-2">Try Nova in Dzera</h3>
        <p className="text-gray-300 text-sm mb-4">
          Open the analyzer and start chatting with Nova about your AWS costs.
        </p>
        <a
          href="/"
          className="inline-block bg-[#FF9900] hover:bg-[#e68a00] text-black font-bold py-2 px-6 rounded transition-colors"
        >
          Launch Analyzer
        </a>
      </div>
    </div>
  );

  const renderCLIScript = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <DLogo size="lg" variant="orange" />
          <h1 className="text-3xl font-serif text-black">CLI Script Reference</h1>
        </div>
        <p className="text-gray-700 italic">Execute cost discovery directly from your terminal</p>
      </div>

      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Prerequisites
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          This script uses your local AWS CLI credentials. Ensure the AWS CLI is installed and configured:
        </p>
        <div className="bg-gray-900 rounded p-4 mb-4">
          <code className="text-green-400 text-sm">
            $ aws configure<br/>
            AWS Access Key ID [None]: AKIA...<br/>
            AWS Secret Access Key [None]: ********<br/>
            Default region name [None]: us-west-2<br/>
            Default output format [None]: json
          </code>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Inventory Script
        </h2>
        <div className="bg-gray-50 border border-gray-300 rounded overflow-hidden">
          <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <DLogo size="xs" variant="dark" />
              cost-inventory.sh
            </span>
            <span className="text-xs text-gray-700 font-medium">Copy + Paste into Terminal</span>
          </div>
          <pre className="p-4 text-xs leading-relaxed bg-gray-900 text-green-400 overflow-x-auto font-mono">
{script}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Resources Checked
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {["S3 Buckets", "CloudFront", "DynamoDB", "EC2 Instances", "NAT Gateways", "Elastic IPs"].map((item) => (
            <div key={item} className="bg-gray-50 border border-gray-300 rounded p-3 flex items-center gap-2">
              <DLogo size="xs" variant="orange" />
              <span className="text-sm text-gray-800">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-serif text-black mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
          <DLogo size="sm" variant="dark" />
          Additional Commands
        </h2>
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <DLogo size="xs" variant="dark" />
              Cost Explorer (Last 30 Days)
            </h4>
            <div className="bg-gray-900 rounded p-3">
              <code className="text-green-400 text-xs">
                aws ce get-cost-and-usage --time-period Start=$(date -d &apos;-30 days&apos; +%Y-%m-%d),End=$(date +%Y-%m-%d) --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE
              </code>
            </div>
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <DLogo size="xs" variant="dark" />
              RDS Instances
            </h4>
            <div className="bg-gray-900 rounded p-3">
              <code className="text-green-400 text-xs">
                {`aws rds describe-db-instances --query 'DBInstances[*].{ID:DBInstanceIdentifier,Class:DBInstanceClass,Engine:Engine,Status:DBInstanceStatus}' --output table`}
              </code>
            </div>
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <DLogo size="xs" variant="dark" />
              Lambda Functions
            </h4>
            <div className="bg-gray-900 rounded p-3">
              <code className="text-green-400 text-xs">
                {`aws lambda list-functions --query 'Functions[*].{Name:FunctionName,Runtime:Runtime,Memory:MemorySize,Timeout:Timeout}' --output table`}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gray-50 border border-gray-300 rounded p-6 text-center">
        <DLogo size="lg" variant="orange" />
        <h3 className="text-lg font-bold text-gray-900 mt-3 mb-2">Prefer a Visual Interface?</h3>
        <p className="text-gray-800 text-sm mb-4">
          Get the same insights with automated analysis and a professional dashboard.
        </p>
        <a
          href="/"
          className="inline-block bg-[#FF9900] hover:bg-[#e68a00] text-black font-bold py-2 px-6 rounded transition-colors"
        >
          Open Dzera Analyzer
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col lg:flex-row">
        {/* Mobile Menu */}
        <div className="lg:hidden bg-gray-50 border-b border-gray-300 p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <DLogo size="sm" variant="dark" />
            Contents
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSection("whitepaper")}
              className={`px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                activeSection === "whitepaper"
                  ? "bg-[#FF9900] text-black font-medium"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <DLogo size="xs" variant={activeSection === "whitepaper" ? "dark" : "dark"} />
              Whitepaper
            </button>
            <button
              onClick={() => setActiveSection("what-is-dzera")}
              className={`px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                activeSection === "what-is-dzera"
                  ? "bg-[#FF9900] text-black font-medium"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <DLogo size="xs" variant={activeSection === "what-is-dzera" ? "dark" : "dark"} />
              What is Dzera
            </button>
            <button
              onClick={() => setActiveSection("faq")}
              className={`px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                activeSection === "faq"
                  ? "bg-[#FF9900] text-black font-medium"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <DLogo size="xs" variant={activeSection === "faq" ? "dark" : "dark"} />
              FAQ
            </button>
            <button
              onClick={() => setActiveSection("cli-script")}
              className={`px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                activeSection === "cli-script"
                  ? "bg-[#FF9900] text-black font-medium"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <DLogo size="xs" variant={activeSection === "cli-script" ? "dark" : "dark"} />
              CLI Script
            </button>
            <button
              onClick={() => setActiveSection("amazon-nova")}
              className={`px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                activeSection === "amazon-nova"
                  ? "bg-[#FF9900] text-black font-medium"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <DLogo size="xs" variant={activeSection === "amazon-nova" ? "dark" : "dark"} />
              Amazon Nova
            </button>
          </div>
          <div className="mt-4">
            <a
              href="/"
              className="w-full bg-[#FF9900] hover:bg-[#e68a00] text-black font-bold py-2 px-4 rounded text-center transition-colors text-sm flex items-center justify-center gap-2"
            >
              <DLogo size="xs" variant="dark" />
              Launch Analyzer
            </a>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-gray-50 border-r border-gray-300 min-h-screen p-4">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DLogo size="sm" variant="orange" />
              Contents
            </h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveSection("whitepaper")}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                  activeSection === "whitepaper"
                    ? "bg-[#FF9900] text-black font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <DLogo size="xs" variant={activeSection === "whitepaper" ? "dark" : "dark"} />
                Why Dzera (Whitepaper)
              </button>
              <button
                onClick={() => setActiveSection("what-is-dzera")}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                  activeSection === "what-is-dzera"
                    ? "bg-[#FF9900] text-black font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <DLogo size="xs" variant={activeSection === "what-is-dzera" ? "dark" : "dark"} />
                What is Dzera
              </button>
              <button
                onClick={() => setActiveSection("faq")}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                  activeSection === "faq"
                    ? "bg-[#FF9900] text-black font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <DLogo size="xs" variant={activeSection === "faq" ? "dark" : "dark"} />
                FAQ
              </button>
              <button
                onClick={() => setActiveSection("cli-script")}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                  activeSection === "cli-script"
                    ? "bg-[#FF9900] text-black font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <DLogo size="xs" variant={activeSection === "cli-script" ? "dark" : "dark"} />
                CLI Script
              </button>
              <button
                onClick={() => setActiveSection("amazon-nova")}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                  activeSection === "amazon-nova"
                    ? "bg-[#FF9900] text-black font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <DLogo size="xs" variant={activeSection === "amazon-nova" ? "dark" : "dark"} />
                Amazon Nova
              </button>
            </nav>
          </div>

          <div className="border-t border-gray-300 pt-4">
            <a
              href="/"
              className="w-full bg-[#FF9900] hover:bg-[#e68a00] text-black font-bold py-2 px-4 rounded text-center transition-colors text-sm flex items-center justify-center gap-2"
            >
              <DLogo size="xs" variant="dark" />
              Launch Analyzer
            </a>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t border-gray-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Quick Facts</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <DLogo size="xs" variant="dark" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <DLogo size="xs" variant="dark" />
                <span>Read-Only Access</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <DLogo size="xs" variant="dark" />
                <span>No Installation</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <DLogo size="xs" variant="dark" />
                <span>Multi-Region</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <DLogo size="xs" variant="dark" />
                <span>MIT Licensed</span>
              </div>
            </div>
          </div>

          {/* External Links */}
          <div className="mt-6 pt-4 border-t border-gray-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Resources</h3>
            <div className="space-y-2 text-xs">
              <a href="https://github.com/stalkiq/dzera" target="_blank" className="flex items-center gap-2 text-gray-700 hover:text-[#FF9900] transition-colors">
                <DLogo size="xs" variant="dark" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a href="https://console.aws.amazon.com/iam" target="_blank" className="flex items-center gap-2 text-gray-700 hover:text-[#FF9900] transition-colors">
                <DLogo size="xs" variant="dark" />
                <span>AWS IAM Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a href="https://aws.amazon.com/pricing/" target="_blank" className="flex items-center gap-2 text-gray-700 hover:text-[#FF9900] transition-colors">
                <DLogo size="xs" variant="dark" />
                <span>AWS Pricing</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8 max-w-4xl">
          {activeSection === "whitepaper" && renderWhitepaper()}
          {activeSection === "what-is-dzera" && renderWhatIsDzera()}
          {activeSection === "faq" && renderFAQ()}
          {activeSection === "amazon-nova" && renderAmazonNova()}
          {activeSection === "cli-script" && renderCLIScript()}
        </div>
      </div>
    </div>
  );
}
