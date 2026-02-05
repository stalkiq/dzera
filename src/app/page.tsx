// src/app/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ExternalLink, X, ChevronRight, Command, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";

type CostFinding = {
  service: string;
  resourceId: string;
  resourceName?: string;
  region: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  estimatedMonthlyCost: number;
  estimatedHourlyCost: number;
  suggestion: string;
  actionUrl?: string;
};

type ScanResult = {
  findings: CostFinding[];
  totalEstimatedMonthlyCost: number;
  totalEstimatedHourlyCost: number;
  startedAt: string;
  finishedAt: string;
};

// Service descriptions for optimization pages
const serviceDescriptions: Record<string, { desc: string; details: string; scans: string[] }> = {
  "ec2": {
    desc: "Elastic Compute Cloud - Virtual servers in the cloud.",
    details: "EC2 provides resizable compute capacity with complete control over your computing resources. Launch instances with various CPU, memory, storage, and networking configurations. You pay by the hour or second (minimum 60 seconds) depending on instance type. EC2 is ideal for applications requiring full OS control, custom software stacks, or specific hardware configurations. Costs are driven by instance type, running hours, storage (EBS), data transfer, and optional features like Elastic IPs and load balancers.",
    scans: ["Running instances and their hourly costs", "Instance type and sizing efficiency", "Reserved Instance coverage gaps", "Idle or underutilized instances", "Stopped instances with attached EBS volumes"]
  },
  "lightsail": {
    desc: "Simplified VPS hosting with predictable pricing.",
    details: "Lightsail offers virtual private servers with pre-configured environments at fixed monthly prices. Each bundle includes compute, SSD storage, and data transfer allowances. It's the easiest way to launch websites, blogs, dev environments, or small applications. Lightsail is significantly cheaper than EC2 for simple workloads but lacks advanced networking and scaling features. Common cost drivers include running instances 24/7, snapshot storage, static IPs, and load balancers.",
    scans: ["Active instances and bundles", "Snapshot storage costs", "Static IP allocations", "Load balancer configurations", "Unused or idle instances"]
  },
  "lambda": {
    desc: "Serverless compute that runs code without provisioning servers.",
    details: "Lambda executes code in response to events like API calls, file uploads, database changes, or schedules. You pay only for compute time consumed (billed in 1ms increments) with no charge when code isn't running. Functions auto-scale from zero to thousands of concurrent executions. Lambda is ideal for event-driven architectures, APIs, and data processing. Cost optimization focuses on memory allocation (affects CPU), execution duration, and avoiding over-provisioned concurrency.",
    scans: ["Function invocation frequency and costs", "Memory allocation vs actual usage", "Provisioned concurrency charges", "Duration and timeout optimization", "Cold start patterns"]
  },
  "s3": {
    desc: "Scalable object storage with 99.999999999% durability.",
    details: "S3 stores unlimited objects up to 5TB each across multiple storage classes optimized for different access patterns. Standard for frequent access, Intelligent-Tiering for unknown patterns, Glacier for archives. You pay for storage volume, requests (PUT/GET), and data transfer out. Key cost factors include choosing the right storage class, implementing lifecycle policies to transition old data, managing versioning overhead, and optimizing transfer acceleration usage.",
    scans: ["Bucket storage classes and volumes", "Lifecycle policy effectiveness", "Versioning overhead analysis", "Cross-region replication costs", "Incomplete multipart uploads"]
  },
  "rds": {
    desc: "Managed relational databases for MySQL, PostgreSQL, SQL Server, Oracle, MariaDB.",
    details: "RDS handles database administration tasks like backups, patching, and failover while you focus on your application. Choose from multiple database engines and instance types. Multi-AZ deployments provide high availability with automatic failover. Read replicas scale read-heavy workloads. Costs are driven by instance hours, storage (provisioned or autoscaling), I/O requests, backup retention beyond free tier, and data transfer. Reserved Instances offer up to 69% savings.",
    scans: ["Instance sizing vs actual utilization", "Multi-AZ deployment necessity", "Storage provisioning efficiency", "Backup retention and snapshot costs", "Read replica optimization"]
  },
  "aurora": {
    desc: "MySQL/PostgreSQL-compatible with 5x performance improvement.",
    details: "Aurora is AWS's cloud-native relational database with automatic storage scaling up to 128TB, 15 read replicas with sub-10ms lag, and continuous backup to S3. Aurora Serverless v2 scales compute automatically based on demand. Costs include instance hours, storage ($0.10/GB-month), I/O requests ($0.20 per million), and backup storage beyond cluster volume. Aurora typically costs more than RDS but offers better performance, availability, and operational simplicity.",
    scans: ["Cluster configurations and costs", "Read replica count optimization", "Serverless capacity unit usage", "Storage I/O patterns", "Backup storage beyond free tier"]
  },
  "dynamodb": {
    desc: "Serverless NoSQL with single-digit millisecond latency at any scale.",
    details: "DynamoDB is a fully managed key-value and document database handling millions of requests per second. Choose provisioned capacity (predictable costs) or on-demand (pay-per-request). Global Tables replicate data across regions for low-latency global access. Costs come from read/write capacity units (or requests), storage, streams, backups, and global table replication. On-demand is 6-7x more expensive per request but ideal for unpredictable workloads.",
    scans: ["Provisioned vs on-demand efficiency", "Read/write capacity utilization", "Global table replication costs", "Backup and PITR charges", "TTL optimization opportunities"]
  },
  "cloudfront": {
    desc: "Global CDN with 400+ edge locations for low-latency content delivery.",
    details: "CloudFront caches content at edge locations worldwide, reducing latency and offloading origin servers. It integrates natively with S3, EC2, ALB, and Lambda@Edge for dynamic content processing. Pricing varies by region (Price Classes let you limit regions), data transfer out, requests, and optional features like field-level encryption. Optimizing cache hit ratios directly reduces origin requests and costs. Origin Shield adds another caching layer for frequently accessed content.",
    scans: ["Distribution traffic and costs", "Cache hit ratio analysis", "Origin request frequency", "Price class optimization", "Lambda@Edge invocation costs"]
  },
  "nat-gateway": {
    desc: "Managed NAT enabling private subnet internet access.",
    details: "NAT Gateway allows instances in private subnets to connect to the internet while preventing inbound connections. It's a significant cost driver: $0.045/hour (~$32/month) plus $0.045/GB processed. Multi-AZ deployments multiply these costs. Alternatives include NAT instances (cheaper but self-managed), VPC endpoints for AWS services (free for S3/DynamoDB gateway endpoints), and IPv6 (no NAT needed). Review whether all traffic truly needs NAT.",
    scans: ["Gateway hourly charges", "Data processing volumes", "Multi-AZ redundancy costs", "VPC endpoint alternatives", "Traffic pattern analysis"]
  },
  "elastic-ip": {
    desc: "Static public IPv4 addresses for dynamic cloud resources.",
    details: "Elastic IPs provide static public IP addresses that you can rapidly remap between instances. They're free when associated with a running instance but cost $0.005/hour (~$3.60/month) when idle or associated with stopped instances. With IPv4 exhaustion, AWS now charges for all public IPv4 addresses. Audit regularly for orphaned IPs from terminated instances or unused allocations.",
    scans: ["Unassociated IP charges", "IP address inventory", "Association with stopped instances", "IPv6 migration opportunities", "Release recommendations"]
  },
  "vpc": {
    desc: "Isolated virtual network with complete control over IP addressing, routing, and security.",
    details: "VPC itself is free, but associated resources drive costs: NAT Gateways, VPC endpoints (interface endpoints cost $0.01/hour), Transit Gateway attachments ($0.05/hour), VPN connections, and data transfer between AZs ($0.01/GB). Peering is free but data transfer applies. Optimize by using Gateway endpoints (free) for S3/DynamoDB, consolidating NAT Gateways, and minimizing cross-AZ traffic through proper service placement.",
    scans: ["NAT Gateway deployments", "VPC endpoint configurations", "Transit Gateway attachments", "Cross-AZ data transfer", "Peering connection patterns"]
  },
  "api-gateway": {
    desc: "Fully managed API service handling authentication, throttling, and caching.",
    details: "API Gateway creates, publishes, and manages REST, HTTP, and WebSocket APIs at any scale. REST APIs offer more features but cost $3.50/million requests. HTTP APIs are simpler and 71% cheaper at $1.00/million. WebSocket APIs charge per message and connection minutes. Caching reduces backend calls but adds hourly charges. Consider HTTP APIs for simple proxies, REST for complex transformations, and direct Lambda URLs for internal services.",
    scans: ["Request volume and pricing tier", "REST vs HTTP API efficiency", "Cache utilization analysis", "WebSocket connection costs", "Authorization overhead"]
  },
  "ecs": {
    desc: "Container orchestration running Docker containers on AWS infrastructure.",
    details: "ECS manages container deployment, scaling, and networking. With EC2 launch type, you manage and pay for the underlying instances. Fargate launch type is serverless—pay for vCPU and memory per second with no cluster management. ECS itself is free; you pay for compute (EC2 or Fargate), load balancers, and data transfer. Fargate is simpler but typically 13-33% more expensive than well-utilized EC2. Spot Fargate offers up to 70% savings for fault-tolerant workloads.",
    scans: ["Task and service configurations", "Fargate vs EC2 cost comparison", "Container resource allocation", "Auto-scaling efficiency", "Spot capacity utilization"]
  },
  "eks": {
    desc: "Managed Kubernetes with automatic upgrades and high availability.",
    details: "EKS runs Kubernetes control plane across multiple AZs with automatic upgrades and patching. You pay $0.10/hour per cluster (~$72/month) plus compute costs (EC2 or Fargate). Additional charges for EKS add-ons, load balancers, and data transfer. Unlike ECS, EKS has a per-cluster fee regardless of workload. Consider consolidating small workloads into fewer clusters and using Karpenter for efficient node provisioning.",
    scans: ["Cluster management fees", "Node group configurations", "Fargate profile costs", "Add-on service charges", "Cluster consolidation opportunities"]
  },
  "sagemaker": {
    desc: "End-to-end ML platform for building, training, and deploying models.",
    details: "SageMaker provides Jupyter notebooks, built-in algorithms, training infrastructure, and hosting endpoints. Costs accumulate quickly from: notebook instances (running 24/7), training jobs (instance hours), endpoints (always-on inference), and storage. Serverless inference and multi-model endpoints reduce costs for variable workloads. Real-time endpoints cost significantly more than batch transform for infrequent predictions. Stop notebooks when not in use.",
    scans: ["Notebook instance hours", "Training job optimization", "Endpoint hosting efficiency", "Storage and data transfer", "Serverless vs provisioned inference"]
  },
  "bedrock": {
    desc: "Generative AI service with foundation models from leading providers.",
    details: "Bedrock provides API access to foundation models from Anthropic, AI21, Stability AI, Meta, and Amazon without managing infrastructure. Pricing is per-token for on-demand or per-hour for Provisioned Throughput. Claude models: ~$8-15/million input tokens. Fine-tuning adds storage and training costs. Provisioned Throughput guarantees capacity but requires commitment. For cost optimization, choose appropriate model sizes, implement prompt caching, and batch requests where possible.",
    scans: ["Model invocation costs", "Token consumption patterns", "Provisioned Throughput utilization", "Model selection optimization", "Prompt efficiency analysis"]
  },
  "cloudwatch": {
    desc: "Monitoring service for metrics, logs, alarms, and dashboards.",
    details: "CloudWatch collects metrics and logs from AWS resources and applications. Basic monitoring is free; detailed monitoring costs $0.30/metric/month. Log ingestion: $0.50/GB, storage: $0.03/GB/month. Custom metrics: $0.30/metric/month. Dashboards: $3/month each. Alarms: $0.10/alarm/month. Costs grow quickly with high-volume logging and custom metrics. Use metric filters instead of high-cardinality custom metrics, set log retention periods, and consolidate dashboards.",
    scans: ["Custom metric charges", "Log ingestion and storage", "Dashboard widget costs", "Alarm configuration fees", "Log retention optimization"]
  },
  "iam": {
    desc: "Identity and Access Management controlling who can access what.",
    details: "IAM is free but critical for security and cost governance. Users, groups, roles, and policies control access to AWS services. Misconfigured IAM can lead to security breaches or over-provisioned access causing unexpected costs. Best practices: principle of least privilege, regular access reviews, use roles instead of long-term credentials, enable MFA, and implement service control policies for organization-wide guardrails.",
    scans: ["Policy complexity analysis", "Role trust relationships", "Access key rotation status", "Unused credentials", "Cross-account access patterns"]
  },
  "kms": {
    desc: "Encryption key management with hardware security module backing.",
    details: "KMS creates and manages encryption keys used across AWS services. AWS managed keys are free; customer managed keys cost $1/month plus $0.03 per 10,000 API calls. Automatic key rotation is included. High-volume encryption operations (envelope encryption) can drive API costs. Optimize by caching data keys, using envelope encryption efficiently, and auditing key usage. Consider AWS-owned keys for services where customer-managed keys aren't required.",
    scans: ["Customer managed key costs", "API request charges", "Key rotation configurations", "Cross-account key usage", "Key policy audit"]
  },
  "sns": {
    desc: "Pub/sub messaging for decoupling microservices and sending notifications.",
    details: "SNS fans out messages to multiple subscribers including SQS, Lambda, HTTP endpoints, email, and SMS. Publishing is nearly free ($0.50/million). Delivery costs vary: Lambda/SQS free, HTTP $0.60/million, SMS varies by country ($0.00645-$0.0645/message US). Mobile push is $0.50/million. High-volume SMS notifications or international messaging can be expensive. Consider SQS for point-to-point, EventBridge for event routing, or Pinpoint for marketing messages.",
    scans: ["Message delivery costs", "SMS pricing by destination", "Topic subscription optimization", "Delivery retry configuration", "Alternative service evaluation"]
  },
  "sqs": {
    desc: "Fully managed message queuing for decoupling distributed systems.",
    details: "SQS enables asynchronous communication between services with automatic scaling and high durability. Standard queues: $0.40/million requests (first 1M free). FIFO queues: $0.50/million (plus $0.05/million for deduplication). Long polling reduces empty receives. Message retention up to 14 days. Batch operations (up to 10 messages) reduce costs. Dead-letter queues capture failed messages. Consider combining with SNS for fan-out patterns.",
    scans: ["Request pricing analysis", "FIFO vs Standard efficiency", "Message retention periods", "Dead-letter queue usage", "Batch operation optimization"]
  },
  "elasticache": {
    desc: "Managed Redis and Memcached for microsecond-latency caching.",
    details: "ElastiCache runs in-memory data stores for caching, session management, and real-time analytics. You pay for node hours based on instance type. Reserved nodes offer up to 55% savings. Redis offers persistence, replication, and cluster mode; Memcached is simpler for basic caching. Data tiering (Redis) moves less-accessed data to SSD, reducing costs. Serverless ElastiCache provides pay-per-use pricing without capacity planning.",
    scans: ["Node type efficiency", "Cluster mode configurations", "Reserved node coverage", "Data tiering opportunities", "Memory utilization analysis"]
  },
  "redshift": {
    desc: "Petabyte-scale data warehouse with columnar storage and MPP.",
    details: "Redshift runs complex analytical queries across petabytes using massively parallel processing. RA3 nodes separate compute and storage, scaling independently. Serverless automatically provisions capacity. Costs include node hours, managed storage ($0.024/GB), Spectrum queries against S3 ($5/TB scanned), and concurrency scaling (on-demand pricing per second). Reserved instances provide up to 75% savings for steady workloads.",
    scans: ["Cluster node utilization", "Concurrency scaling costs", "Spectrum query optimization", "Reserved instance coverage", "Workload management analysis"]
  },
  "athena": {
    desc: "Serverless SQL queries on S3 data without infrastructure management.",
    details: "Athena queries data directly in S3 using standard SQL, charging $5/TB scanned. No infrastructure to manage—queries run on-demand. Optimization is critical: use columnar formats (Parquet, ORC) for 30-90% cost reduction, partition data by common query patterns, compress files, and use workgroups to set data scan limits. Query result caching reuses results for identical queries. Federated queries extend to other data sources.",
    scans: ["Data scanned per query", "Columnar format adoption", "Partition strategy effectiveness", "Workgroup configurations", "Query result caching"]
  },
  "glue": {
    desc: "Serverless ETL service with built-in data catalog.",
    details: "Glue handles extract-transform-load workloads with automatic code generation, job scheduling, and a central data catalog. You pay for DPU-hours: $0.44/DPU-hour for ETL jobs, crawlers billed per DPU-second. Development endpoints cost while running. Cost optimization: use auto-scaling, appropriate worker types (G.1X vs G.2X), bookmark jobs to process only new data, limit crawler scope, and consider Glue Studio for visual ETL. Data Catalog charges for API calls and storage.",
    scans: ["DPU hour consumption", "Crawler run frequency", "Job bookmark efficiency", "Worker type optimization", "Development endpoint costs"]
  },
  "kinesis": {
    desc: "Real-time data streaming at any scale.",
    details: "Kinesis ingests and processes real-time streaming data from thousands of sources simultaneously. Data Streams charges per shard-hour ($0.015) plus PUT payload units. Firehose charges per GB ingested with no shard management. Data Analytics runs SQL on streams ($0.11/KPU-hour). Enhanced fan-out ($0.015/consumer-shard-hour) enables multiple consumers reading at full speed. Optimize by right-sizing shards to utilization, using Firehose for simple delivery, and batching producers.",
    scans: ["Shard hour charges", "Enhanced fan-out costs", "Data retention periods", "Consumer application efficiency", "Producer batching optimization"]
  },
  "cost-explorer": {
    desc: "Visualize, understand, and manage AWS costs and usage.",
    details: "Cost Explorer provides default reports for cost analysis with filtering by service, account, tag, and more. Free tier includes the UI console. API access costs $0.01 per request (can add up with automation). Rightsizing recommendations for EC2, Savings Plans recommendations, and anomaly detection (extra charges). Enable hourly granularity only when needed. For programmatic access, cache responses to reduce API calls.",
    scans: ["API request charges", "Savings Plans recommendations", "Reserved Instance analysis", "Anomaly detection alerts", "Rightsizing recommendations"]
  },
  "budgets": {
    desc: "Set custom budgets and receive alerts when thresholds are exceeded.",
    details: "AWS Budgets tracks costs and usage against defined thresholds. First two budgets are free; additional budgets cost $0.02/day each (~$0.62/month). Budget Actions can automatically apply policies when thresholds are breached (e.g., stop EC2 instances, apply SCPs). Configure multiple alert thresholds (e.g., 50%, 80%, 100%) for early warning. Combine with cost allocation tags for granular department or project budgets.",
    scans: ["Budget action configurations", "Alert threshold settings", "Forecasting accuracy", "Cost allocation tags", "Action automation setup"]
  },
  "savings-plans": {
    desc: "Save up to 72% on compute with flexible hourly commitment.",
    details: "Savings Plans provide discounted rates in exchange for committing to consistent compute usage ($/hour) for 1 or 3 years. Compute Savings Plans apply to EC2, Fargate, and Lambda across any region, instance family, or OS—maximum flexibility. EC2 Instance Savings Plans are cheaper but locked to a specific instance family and region. Plans apply automatically to eligible usage. Monitor utilization to ensure you're using your commitment; unused commitment is lost.",
    scans: ["Commitment utilization rates", "Coverage recommendations", "Compute vs EC2 plan comparison", "Expiration tracking", "Underutilization analysis"]
  },
  "reserved-instances": {
    desc: "Reserve capacity for 1-3 years with up to 75% discount.",
    details: "Reserved Instances (RIs) provide capacity reservation and billing discount for EC2, RDS, ElastiCache, OpenSearch, and Redshift. Standard RIs offer larger discounts but limited flexibility. Convertible RIs can exchange for different configurations. Partial upfront balances cost vs. cash flow. RIs apply to matching usage automatically. Unused RIs can be sold on the Reserved Instance Marketplace. New workloads often benefit more from Savings Plans' flexibility.",
    scans: ["Utilization percentages", "Modification opportunities", "Marketplace listing potential", "Convertible exchange options", "Expiration planning"]
  }
};

// Subtle D Triangle Logo Component
// Themed icon system matching the diamond D style
type IconVariant = "d" | "files" | "chart" | "gear" | "grid" | "user" | "book" | "refresh" | "search" | "terminal" | "key" | "cloud";

const ThemedIcon = ({ 
  variant = "d", 
  size = "sm", 
  active = false 
}: { 
  variant?: IconVariant;
  size?: "xs" | "sm" | "md" | "lg"; 
  active?: boolean 
}) => {
  const sizes = {
    xs: { wrapper: "w-3 h-3", icon: 8 },
    sm: { wrapper: "w-4 h-4", icon: 10 },
    md: { wrapper: "w-6 h-6", icon: 14 },
    lg: { wrapper: "w-8 h-8", icon: 18 }
  };
  
  const iconColor = active ? "#000" : "#9ca3af";
  const bgColor = active ? "bg-[#FF9900]" : "bg-gray-700";
  const iconSize = sizes[size].icon;
  
  const renderIcon = () => {
    switch(variant) {
      case "files":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <rect x="3" y="2" width="7" height="9" rx="1" stroke={iconColor} strokeWidth="1.5" fill="none"/>
            <rect x="6" y="5" width="7" height="9" rx="1" stroke={iconColor} strokeWidth="1.5" fill={active ? "#FF9900" : "#374151"}/>
          </svg>
        );
      case "chart":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <rect x="2" y="8" width="3" height="6" rx="0.5" fill={iconColor}/>
            <rect x="6.5" y="5" width="3" height="9" rx="0.5" fill={iconColor}/>
            <rect x="11" y="2" width="3" height="12" rx="0.5" fill={iconColor}/>
          </svg>
        );
      case "gear":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.5" stroke={iconColor} strokeWidth="1.5"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      case "grid":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" fill={iconColor}/>
            <rect x="9" y="2" width="5" height="5" rx="1" fill={iconColor}/>
            <rect x="2" y="9" width="5" height="5" rx="1" fill={iconColor}/>
            <rect x="9" y="9" width="5" height="5" rx="1" fill={iconColor}/>
          </svg>
        );
      case "user":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" stroke={iconColor} strokeWidth="1.5"/>
            <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      case "book":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <path d="M2 3a1 1 0 011-1h4v12H3a1 1 0 01-1-1V3z" fill={iconColor}/>
            <path d="M8 2h5a1 1 0 011 1v10a1 1 0 01-1 1H8V2z" stroke={iconColor} strokeWidth="1.5"/>
            <line x1="10" y1="5" x2="12" y2="5" stroke={active ? "#FF9900" : "#374151"} strokeWidth="1"/>
            <line x1="10" y1="7" x2="12" y2="7" stroke={active ? "#FF9900" : "#374151"} strokeWidth="1"/>
          </svg>
        );
      case "refresh":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <path d="M2 8a6 6 0 0110.5-4M14 8a6 6 0 01-10.5 4" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12.5 1v3h-3M3.5 15v-3h3" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "search":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4" stroke={iconColor} strokeWidth="1.5"/>
            <line x1="10" y1="10" x2="14" y2="14" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      case "terminal":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <rect x="1" y="2" width="14" height="12" rx="2" stroke={iconColor} strokeWidth="1.5"/>
            <path d="M4 6l3 2.5L4 11" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="9" y1="11" x2="12" y2="11" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      case "key":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <circle cx="5" cy="6" r="3" stroke={iconColor} strokeWidth="1.5"/>
            <path d="M7.5 8L14 8M11 8v3M14 8v2" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      case "cloud":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <path d="M4 11a3 3 0 01-.5-5.95 4.5 4.5 0 018.95.9A2.5 2.5 0 0112 11H4z" stroke={iconColor} strokeWidth="1.5" fill="none"/>
          </svg>
        );
      default: // "d" - the default diamond D logo
        return (
          <span className={`relative ${active ? "text-black" : "text-gray-300"} font-black text-[${sizes[size].icon * 0.7}px] z-10`}>D</span>
        );
    }
  };
  
  // For the "d" variant, use the original diamond style
  if (variant === "d") {
    const textSizes = { xs: "text-[6px]", sm: "text-[8px]", md: "text-[10px]", lg: "text-sm" };
    return (
      <div className={`relative ${sizes[size].wrapper} flex items-center justify-center flex-shrink-0`}>
        <div className={`absolute inset-0 ${bgColor} rotate-45 rounded-[1px] transition-colors`}></div>
        <span className={`relative ${active ? "text-black" : "text-gray-300"} font-black ${textSizes[size]} z-10`}>D</span>
      </div>
    );
  }
  
  // For other icons, use a subtle diamond background with the icon
  return (
    <div className={`relative ${sizes[size].wrapper} flex items-center justify-center flex-shrink-0`}>
      <div className={`absolute inset-0 ${bgColor} rotate-45 rounded-[1px] transition-colors opacity-30`}></div>
      <div className="relative z-10 flex items-center justify-center">
        {renderIcon()}
      </div>
    </div>
  );
};

// Keep DLogo as an alias for the default diamond D
const DLogo = ({ size = "sm", active = false }: { size?: "xs" | "sm" | "md" | "lg"; active?: boolean }) => (
  <ThemedIcon variant="d" size={size} active={active} />
);

// Comprehensive search data structure
type SearchItem = {
  id: string;
  type: "service" | "action" | "command" | "doc" | "pattern" | "insight";
  title: string;
  description: string;
  category: string;
  keywords: string[];
  action?: () => void;
  icon?: string;
  badge?: string;
};

export default function Home() {
  const [step, setStep] = useState<"setup" | "scanning" | "results">("setup");
  const [activeTab, setActiveTab] = useState("credentials.aws");
  const [openTabs, setOpenTabs] = useState(["credentials.aws"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'warn' | 'error' | 'success'}[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    accessKeyId: "",
    secretAccessKey: "",
  });
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Mobile navigation state
  const [mobileView, setMobileView] = useState<"scan" | "services" | "chat" | "terminal" | "details">("scan");
  
  // Command Palette Search State
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  // Keyboard shortcut to open command palette (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Focus search input when palette opens
  React.useEffect(() => {
    if (showCommandPalette && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showCommandPalette]);

  // Core utility functions
  const addLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }]);
  }, []);

  const handleTabClick = useCallback((tabId: string) => {
    if (!openTabs.includes(tabId)) {
      setOpenTabs(prev => [...prev, tabId]);
    }
    setActiveTab(tabId);
  }, [openTabs]);

  const closeTab = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (openTabs.length === 1) return;
    const newTabs = openTabs.filter(t => t !== tabId);
    setOpenTabs(newTabs);
    if (activeTab === tabId) {
      setActiveTab(newTabs[newTabs.length - 1]);
    }
  }, [openTabs, activeTab]);

  const handleServiceClick = useCallback((service: string) => {
    setSelectedService(service);
    addLog(`Analyzing ${service} configuration...`, "info");
    addLog(`Retrieving optimization recommendations for ${service}...`, "success");
    
    const tabId = `${service.toLowerCase().replace(/\s+/g, '-')}.md`;
    setOpenTabs(prev => prev.includes(tabId) ? prev : [...prev, tabId]);
    setActiveTab(tabId);
    
    // Switch to details view on mobile
    setMobileView("details");

    setTimeout(() => {
      addLog(`${service} analysis complete.`, "info");
    }, 800);
  }, [addLog]);

  // Comprehensive search items database
  const searchItems = useMemo<SearchItem[]>(() => [
    // AWS Services - Compute
    { id: "ec2", type: "service", title: "EC2 Instances", description: "Analyze running instances, rightsizing opportunities, and Reserved Instance coverage", category: "Compute", keywords: ["ec2", "instance", "server", "compute", "vm", "virtual machine"], badge: "Hot" },
    { id: "lambda", type: "service", title: "Lambda Functions", description: "Review function invocations, memory allocation, and provisioned concurrency costs", category: "Compute", keywords: ["lambda", "serverless", "function", "faas"] },
    { id: "fargate", type: "service", title: "Fargate Tasks", description: "Container runtime costs and task configuration analysis", category: "Compute", keywords: ["fargate", "container", "ecs", "task"] },
    { id: "lightsail", type: "service", title: "Lightsail VPS", description: "Simple VPS instances and associated resources", category: "Compute", keywords: ["lightsail", "vps", "simple"] },
    
    // AWS Services - Storage
    { id: "s3", type: "service", title: "S3 Buckets", description: "Storage class optimization, lifecycle policies, and versioning costs", category: "Storage", keywords: ["s3", "storage", "bucket", "object", "archive"], badge: "Hot" },
    { id: "ebs", type: "service", title: "EBS Volumes", description: "Unattached volumes, snapshot costs, and IOPS provisioning", category: "Storage", keywords: ["ebs", "volume", "disk", "storage", "snapshot"] },
    { id: "efs", type: "service", title: "EFS File Systems", description: "Elastic file storage throughput and storage class analysis", category: "Storage", keywords: ["efs", "file", "nfs", "elastic"] },
    { id: "glacier", type: "service", title: "S3 Glacier", description: "Archive storage retrieval costs and tier optimization", category: "Storage", keywords: ["glacier", "archive", "cold", "deep"] },
    
    // AWS Services - Database
    { id: "rds", type: "service", title: "RDS Databases", description: "Instance sizing, Multi-AZ costs, and storage provisioning", category: "Database", keywords: ["rds", "database", "mysql", "postgres", "sql", "aurora"] },
    { id: "dynamodb", type: "service", title: "DynamoDB Tables", description: "Capacity mode analysis, global table replication, and DAX caching", category: "Database", keywords: ["dynamodb", "nosql", "table", "dynamo"], badge: "Hot" },
    { id: "elasticache", type: "service", title: "ElastiCache", description: "Redis/Memcached cluster costs and node optimization", category: "Database", keywords: ["elasticache", "redis", "memcached", "cache"] },
    { id: "redshift", type: "service", title: "Redshift Clusters", description: "Data warehouse node costs and concurrency scaling", category: "Database", keywords: ["redshift", "warehouse", "analytics", "data"] },
    
    // AWS Services - Networking
    { id: "nat", type: "service", title: "NAT Gateways", description: "Data processing costs and architecture optimization", category: "Networking", keywords: ["nat", "gateway", "network", "vpc", "egress"], badge: "$$" },
    { id: "elb", type: "service", title: "Load Balancers", description: "ALB/NLB costs, LCU charges, and idle balancer detection", category: "Networking", keywords: ["elb", "alb", "nlb", "load balancer", "lb"] },
    { id: "cloudfront", type: "service", title: "CloudFront CDN", description: "Distribution costs, price class optimization, and cache efficiency", category: "Networking", keywords: ["cloudfront", "cdn", "distribution", "edge"] },
    { id: "vpc", type: "service", title: "VPC Resources", description: "VPC endpoints, Transit Gateway attachments, and peering costs", category: "Networking", keywords: ["vpc", "endpoint", "transit", "peering"] },
    { id: "eip", type: "service", title: "Elastic IPs", description: "Unassociated IP addresses incurring hourly charges", category: "Networking", keywords: ["elastic ip", "eip", "public ip", "address"], badge: "$$" },
    
    // Quick Actions
    { id: "scan-all", type: "action", title: "Start Full Environment Scan", description: "Analyze all AWS resources across all regions", category: "Actions", keywords: ["scan", "analyze", "start", "full", "all"] },
    { id: "export-csv", type: "action", title: "Export Results to CSV", description: "Download cost analysis as spreadsheet", category: "Actions", keywords: ["export", "csv", "download", "spreadsheet"] },
    { id: "schedule-scan", type: "action", title: "Schedule Recurring Scan", description: "Set up automated daily/weekly cost analysis", category: "Actions", keywords: ["schedule", "recurring", "automate", "daily", "weekly"] },
    { id: "compare-months", type: "action", title: "Compare Month-over-Month", description: "View cost trends and changes over time", category: "Actions", keywords: ["compare", "month", "trend", "history"] },
    
    // CLI Commands
    { id: "cli-cost", type: "command", title: "aws ce get-cost-and-usage", description: "Query Cost Explorer API for spending data", category: "CLI Commands", keywords: ["cli", "cost", "explorer", "ce", "usage"] },
    { id: "cli-ec2", type: "command", title: "aws ec2 describe-instances", description: "List all EC2 instances with details", category: "CLI Commands", keywords: ["cli", "ec2", "describe", "instances", "list"] },
    { id: "cli-s3", type: "command", title: "aws s3 ls --summarize", description: "List S3 buckets with size summary", category: "CLI Commands", keywords: ["cli", "s3", "list", "buckets", "size"] },
    { id: "cli-rds", type: "command", title: "aws rds describe-db-instances", description: "List all RDS database instances", category: "CLI Commands", keywords: ["cli", "rds", "describe", "database"] },
    
    // Cost Patterns & Insights
    { id: "pattern-spike", type: "pattern", title: "Cost Spike Detection", description: "Identify sudden increases in daily spending", category: "Patterns", keywords: ["spike", "increase", "sudden", "anomaly", "alert"] },
    { id: "pattern-unused", type: "pattern", title: "Unused Resource Finder", description: "Detect idle EC2, unattached EBS, unused EIPs", category: "Patterns", keywords: ["unused", "idle", "orphan", "unattached", "waste"] },
    { id: "pattern-ri", type: "pattern", title: "Reserved Instance Coverage", description: "Analyze RI utilization and purchase recommendations", category: "Patterns", keywords: ["reserved", "ri", "savings", "commitment", "discount"] },
    { id: "pattern-sp", type: "pattern", title: "Savings Plans Analysis", description: "Compute and EC2 Savings Plans optimization", category: "Patterns", keywords: ["savings plan", "sp", "commitment", "discount", "compute"] },
    
    // Documentation
    { id: "doc-setup", type: "doc", title: "IAM Setup Guide", description: "Create read-only credentials for safe scanning", category: "Documentation", keywords: ["setup", "iam", "credentials", "policy", "permissions"] },
    { id: "doc-security", type: "doc", title: "Security Best Practices", description: "Keep your AWS credentials safe", category: "Documentation", keywords: ["security", "best practices", "safe", "protect"] },
    { id: "doc-pricing", type: "doc", title: "AWS Pricing Models", description: "Understanding On-Demand, Reserved, and Spot pricing", category: "Documentation", keywords: ["pricing", "model", "on-demand", "spot", "reserved"] },
    { id: "doc-api", type: "doc", title: "Dzera API Reference", description: "Programmatic access to Dzera scanning", category: "Documentation", keywords: ["api", "reference", "programmatic", "integrate"] },
    
    // AI Insights
    { id: "insight-optimize", type: "insight", title: "Generate Optimization Report", description: "AI-powered recommendations based on your usage", category: "AI Insights", keywords: ["ai", "optimize", "recommendation", "report", "suggest"], badge: "AI" },
    { id: "insight-forecast", type: "insight", title: "Cost Forecast", description: "Predict next month's spending based on trends", category: "AI Insights", keywords: ["forecast", "predict", "future", "estimate", "projection"], badge: "AI" },
    { id: "insight-anomaly", type: "insight", title: "Anomaly Detection", description: "AI-detected unusual spending patterns", category: "AI Insights", keywords: ["anomaly", "unusual", "detect", "ai", "pattern"], badge: "AI" },
  ], []);

  // Fuzzy search algorithm with scoring
  const fuzzySearch = useCallback((query: string, items: SearchItem[]): SearchItem[] => {
    if (!query.trim()) {
      // Show recent searches or popular items when no query
      return items.filter(item => item.badge === "Hot" || item.badge === "AI").slice(0, 8);
    }
    
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    return items
      .map(item => {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const descLower = item.description.toLowerCase();
        const categoryLower = item.category.toLowerCase();
        
        for (const term of searchTerms) {
          // Exact title match = highest score
          if (titleLower === term) score += 100;
          // Title starts with term
          else if (titleLower.startsWith(term)) score += 50;
          // Title contains term
          else if (titleLower.includes(term)) score += 30;
          // Keyword exact match
          if (item.keywords.some(k => k === term)) score += 40;
          // Keyword contains term
          if (item.keywords.some(k => k.includes(term))) score += 20;
          // Description contains term
          if (descLower.includes(term)) score += 10;
          // Category match
          if (categoryLower.includes(term)) score += 15;
        }
        
        // Boost items with badges
        if (item.badge && score > 0) score += 5;
        
        return { item, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(result => result.item)
      .slice(0, 12);
  }, []);

  // Filter search results
  const filteredSearchResults = useMemo(() => {
    let results = fuzzySearch(commandSearch, searchItems);
    if (activeFilter) {
      results = results.filter(item => item.type === activeFilter);
    }
    return results;
  }, [commandSearch, searchItems, activeFilter, fuzzySearch]);

  // Handle search result selection
  const handleSearchSelect = useCallback((item: SearchItem) => {
    // Add to recent searches
    setRecentSearches(prev => {
      const newRecent = [item.title, ...prev.filter(s => s !== item.title)].slice(0, 5);
      return newRecent;
    });
    
    setShowCommandPalette(false);
    setCommandSearch("");
    setSelectedIndex(0);
    
    // Execute action based on item type
    switch (item.type) {
      case "service":
        handleServiceClick(item.title.replace(/\s+/g, '-'));
        addLog(`Opening ${item.title} analysis...`, "info");
        break;
      case "action":
        if (item.id === "scan-all") {
          handleTabClick("credentials.aws");
          addLog("Navigate to credentials to start full scan", "info");
        } else {
          addLog(`Action: ${item.title}`, "info");
        }
        break;
      case "command":
        navigator.clipboard?.writeText(item.title);
        addLog(`Copied to clipboard: ${item.title}`, "success");
        break;
      case "doc":
        window.open("/why-dzera", "_self");
        break;
      case "pattern":
      case "insight":
        handleTabClick("cost-reports.md");
        addLog(`Loading ${item.title}...`, "info");
        break;
    }
  }, [handleServiceClick, handleTabClick, addLog]);

  // Keyboard navigation in search
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredSearchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredSearchResults[selectedIndex]) {
      e.preventDefault();
      handleSearchSelect(filteredSearchResults[selectedIndex]);
    }
  }, [filteredSearchResults, selectedIndex, handleSearchSelect]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [commandSearch]);

  const handleVerify = async () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      setError("Please provide both credentials");
      return;
    }

    setStep("scanning");
    setError(null);
    setLogs([]);
    addLog("Initializing infrastructure analysis...", "info");
    addLog("Validating credentials...", "info");

    try {
      const logSequence = [
        { msg: "Connection established. Enumerating regions...", delay: 800 },
        { msg: "Analyzing EC2 fleet in us-west-2...", delay: 1500 },
        { msg: "Evaluating S3 storage configurations...", delay: 2200 },
        { msg: "Assessing CloudFront distribution costs...", delay: 3000 },
        { msg: "Reviewing RDS deployments...", delay: 3800 },
        { msg: "Calculating optimization opportunities...", delay: 4500 },
      ];

      logSequence.forEach(l => {
        setTimeout(() => addLog(l.msg, "info"), l.delay);
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `Analysis failed with status ${res.status}`);
      }

      const data = (await res.json()) as ScanResult;
      addLog(`Analysis complete. Identified ${data.findings.length} optimization opportunities.`, "success");
      
      setTimeout(() => {
        setResult(data);
        setStep("results");
      }, 1000);

    } catch (e: any) {
      addLog(`Error: ${e.message}`, "error");
      if (e.name === "AbortError") {
        setError("Analysis timed out. Please verify your credentials and retry.");
      } else {
        setError(e.message || "Analysis failed. Verify your credentials and IAM permissions.");
      }
      setTimeout(() => setStep("setup"), 2000);
      console.error("Analysis error:", e);
    }
  };

  // Get service info for optimization pages
  const getServiceInfo = (tabId: string) => {
    const serviceKey = tabId.replace('.md', '').toLowerCase();
    return serviceDescriptions[serviceKey] || {
      desc: "AWS service providing cloud infrastructure capabilities.",
      details: "This AWS service provides various cloud computing capabilities. Dzera analyzes resource utilization, pricing models, and configuration settings to identify cost optimization opportunities. Review the analysis scope below to understand what parameters are evaluated for this service.",
      scans: ["Resource utilization analysis", "Cost allocation review", "Configuration optimization", "Pricing model recommendations"]
    };
  };

  if (step === "setup") {
    return (
      <div className="min-h-screen bg-[#0b0f14] text-[#e5e7eb] px-2 sm:px-4 py-3 sm:py-6 pb-20 sm:pb-6">
        <div className="max-w-[1600px] mx-auto space-y-3 sm:space-y-4">
          {/* Header - Simplified for mobile */}
          <div className="flex items-center justify-between px-1 sm:px-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <DLogo size="md" active />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white leading-none tracking-tight">AWS Dzera</h1>
                <p className="text-[#FF9900] text-[7px] sm:text-[8px] font-bold uppercase tracking-widest">Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile status indicator */}
              <div className="sm:hidden flex items-center gap-1.5 bg-[#161b22] px-2 py-1 rounded border border-[#30363d]">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] text-gray-400">Ready</span>
              </div>
              {/* Desktop status */}
              <div className="hidden sm:flex items-center gap-2 bg-[#161b22] px-3 py-1.5 rounded-md border border-[#30363d]">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-400">Connected</span>
              </div>
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0d1117] border-t border-[#30363d] px-2 py-2 z-50">
            <div className="flex justify-around items-center max-w-md mx-auto">
              <button 
                onClick={() => setMobileView("scan")}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-colors ${mobileView === "scan" ? "bg-[#FF9900]/20 text-[#FF9900]" : "text-gray-400"}`}
              >
                <ThemedIcon variant="key" size="sm" active={mobileView === "scan"} />
                <span className="text-[10px] font-medium">Scan</span>
              </button>
              <button 
                onClick={() => { setMobileView("services"); handleTabClick("aws-services.json"); }}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-colors ${mobileView === "services" ? "bg-[#FF9900]/20 text-[#FF9900]" : "text-gray-400"}`}
              >
                <ThemedIcon variant="grid" size="sm" active={mobileView === "services"} />
                <span className="text-[10px] font-medium">Services</span>
              </button>
              <button 
                onClick={() => setMobileView("chat")}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-colors ${mobileView === "chat" ? "bg-[#FF9900]/20 text-[#FF9900]" : "text-gray-400"}`}
              >
                <ThemedIcon variant="d" size="sm" active={mobileView === "chat"} />
                <span className="text-[10px] font-medium">Chat</span>
              </button>
              <button 
                onClick={() => setMobileView("terminal")}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-colors ${mobileView === "terminal" ? "bg-[#FF9900]/20 text-[#FF9900]" : "text-gray-400"}`}
              >
                <ThemedIcon variant="terminal" size="sm" active={mobileView === "terminal"} />
                <span className="text-[10px] font-medium">Logs</span>
              </button>
            </div>
          </div>

          {/* Mobile Content Area */}
          <div className="sm:hidden">
            {/* Scan View */}
            {mobileView === "scan" && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-black text-white">Connect AWS Account</h2>
                  <p className="text-gray-400 text-xs">Enter your credentials to analyze infrastructure costs.</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Access Key ID</label>
                    <input
                      type="text"
                      placeholder="AKIA..."
                      value={credentials.accessKeyId}
                      onChange={(e) => setCredentials(prev => ({ ...prev, accessKeyId: e.target.value }))}
                      className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-3 text-sm text-white focus:ring-1 focus:ring-[#FF9900] focus:border-[#FF9900] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Secret Access Key</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={credentials.secretAccessKey}
                      onChange={(e) => setCredentials(prev => ({ ...prev, secretAccessKey: e.target.value }))}
                      className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-3 text-sm text-white focus:ring-1 focus:ring-[#FF9900] focus:border-[#FF9900] outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleVerify}
                  disabled={!credentials.accessKeyId || !credentials.secretAccessKey}
                  className="w-full bg-[#FF9900] hover:bg-[#e68a00] disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold py-3.5 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <DLogo size="xs" />
                  <span>ANALYZE INFRASTRUCTURE</span>
                </button>

                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
                    <DLogo size="xs" />
                    Security Notice
                  </h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Use an IAM user with ReadOnlyAccess policy. Dzera only reads resources and never modifies your account.
                  </p>
                </div>

                {/* Quick Links */}
                <div className="flex gap-2">
                  <a href="/why-dzera" className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-center text-xs text-gray-400 hover:text-[#FF9900] hover:border-[#FF9900]/50 transition-colors">
                    Documentation
                  </a>
                  <a href="https://github.com/stalkiq/dzera" target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-center text-xs text-gray-400 hover:text-[#FF9900] hover:border-[#FF9900]/50 transition-colors">
                    GitHub
                  </a>
                </div>
              </div>
            )}

            {/* Services View */}
            {mobileView === "services" && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ThemedIcon variant="grid" size="sm" active />
                    AWS Services
                  </h2>
                  <button onClick={() => setShowCommandPalette(true)} className="text-gray-400 hover:text-[#FF9900] p-1.5 bg-[#161b22] rounded-lg border border-[#30363d]">
                    <ThemedIcon variant="search" size="sm" />
                  </button>
                </div>
                
                <input 
                  type="text"
                  placeholder="Filter services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#FF9900] outline-none"
                />

                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {[
                    { cat: "Compute", items: ["EC2", "Lambda", "Lightsail", "Fargate"] },
                    { cat: "Storage", items: ["S3", "EBS", "EFS", "Glacier"] },
                    { cat: "Database", items: ["RDS", "DynamoDB", "Aurora", "ElastiCache"] },
                    { cat: "Network", items: ["VPC", "CloudFront", "NAT Gateway", "API Gateway"] },
                  ].filter(g => g.items.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))).map(group => (
                    <div key={group.cat} className="bg-[#161b22] rounded-lg p-3 border border-[#30363d]">
                      <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">{group.cat}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.filter(i => i.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                          <button
                            key={item}
                            onClick={() => handleServiceClick(item)}
                            className="bg-[#0d1117] text-gray-300 text-xs px-2.5 py-1.5 rounded border border-[#30363d] hover:border-[#FF9900]/50 hover:text-[#FF9900] transition-colors"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat View */}
            {mobileView === "chat" && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
                <div className="h-10 bg-[#161b22] flex items-center border-b border-[#30363d] px-3">
                  <span className="text-xs font-bold text-gray-400">Dzera Assistant</span>
                </div>
                <ChatInterface />
              </div>
            )}

            {/* Terminal View */}
            {mobileView === "terminal" && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
                <div className="h-10 bg-[#161b22] flex items-center justify-between border-b border-[#30363d] px-3">
                  <div className="flex items-center gap-2">
                    <ThemedIcon variant="terminal" size="xs" active />
                    <span className="text-xs font-bold text-gray-400">Terminal</span>
                  </div>
                  <button onClick={() => setLogs([])} className="text-[10px] text-gray-500 hover:text-white">Clear</button>
                </div>
                <div className="p-3 h-[calc(100%-40px)] overflow-y-auto font-mono text-xs space-y-1">
                  {logs.length === 0 ? (
                    <p className="text-gray-500">Awaiting analysis initialization...</p>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className={`flex items-start gap-2 ${
                        log.type === 'error' ? 'text-red-400' : 
                        log.type === 'warn' ? 'text-yellow-400' : 
                        log.type === 'success' ? 'text-green-400' : 'text-gray-300'
                      }`}>
                        <span className="text-gray-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                        <span>{log.msg}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Service Details View */}
            {mobileView === "details" && activeTab.endsWith('.md') && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
                <div className="h-12 bg-[#161b22] flex items-center justify-between border-b border-[#30363d] px-3">
                  <div className="flex items-center gap-2">
                    <DLogo size="sm" active />
                    <span className="text-sm font-bold text-white capitalize">{activeTab.replace('.md', '').replace(/-/g, ' ')}</span>
                  </div>
                  <button 
                    onClick={() => setMobileView("services")} 
                    className="text-xs text-gray-400 hover:text-[#FF9900] bg-[#0d1117] border border-[#30363d] px-3 py-1.5 rounded-lg"
                  >
                    ← Back
                  </button>
                </div>
                <div className="p-4 h-[calc(100%-48px)] overflow-y-auto space-y-4">
                  {(() => {
                    const serviceName = activeTab.replace('.md', '').replace(/-/g, ' ');
                    const serviceInfo = getServiceInfo(activeTab);
                    return (
                      <>
                        {/* Service Header */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <DLogo size="lg" active />
                            <h2 className="text-xl font-black text-white tracking-tight capitalize">
                              {serviceName}
                            </h2>
                          </div>
                          <p className="text-gray-400 text-sm">{serviceInfo.desc}</p>
                        </div>

                        {/* Service Overview */}
                        <div className="bg-gradient-to-r from-[#FF9900]/10 to-transparent border-l-2 border-[#FF9900] p-3 rounded-r-lg">
                          <h3 className="text-xs font-bold text-[#FF9900] uppercase tracking-wider mb-2">Service Overview</h3>
                          <p className="text-gray-300 text-sm leading-relaxed">{serviceInfo.details}</p>
                        </div>

                        {/* Analysis Scope */}
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Analysis Scope</h3>
                          <div className="space-y-2">
                            {serviceInfo.scans.map((scan: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <DLogo size="xs" active />
                                <span className="text-gray-300 text-sm">{scan}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Optimization Actions */}
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Actions</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <a 
                              href={`https://console.aws.amazon.com/${serviceName.toLowerCase().replace(/\s+/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center hover:border-[#FF9900]/50 transition-colors"
                            >
                              <ThemedIcon variant="d" size="sm" active />
                              <p className="text-xs text-gray-400 mt-1">AWS Console</p>
                            </a>
                            <button 
                              onClick={() => {
                                addLog(`Deep scan initiated for ${serviceName}...`, "info");
                                setMobileView("terminal");
                              }}
                              className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center hover:border-[#FF9900]/50 transition-colors"
                            >
                              <ThemedIcon variant="terminal" size="sm" active />
                              <p className="text-xs text-gray-400 mt-1">Deep Scan</p>
                            </button>
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                          <h3 className="text-xs font-bold text-[#FF9900] mb-2 flex items-center gap-2">
                            <DLogo size="xs" active />
                            Recommendation
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            For comprehensive {serviceName} cost optimization, run a full infrastructure analysis using your AWS credentials. 
                            This will identify specific resources, their costs, and actionable savings opportunities.
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:block">
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden flex flex-row h-[800px]">
            {/* Activity Bar - Hidden on mobile */}
            <div className="hidden sm:flex w-12 bg-[#0d1117] border-r border-[#30363d] flex-col items-center py-3 gap-2">
              <div className="group relative">
                <div onClick={() => handleTabClick("credentials.aws")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                  <ThemedIcon variant="files" size="sm" active={activeTab === "credentials.aws"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Explorer</div>
              </div>
              
              <div className="group relative">
                <div onClick={() => handleTabClick("cost-reports.md")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                  <ThemedIcon variant="chart" size="sm" active={activeTab === "cost-reports.md"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Reports</div>
              </div>

              <div className="group relative">
                <div onClick={() => handleTabClick("scanner.config")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                  <ThemedIcon variant="gear" size="sm" active={activeTab === "scanner.config"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Configuration</div>
              </div>

              <div className="group relative">
                <div onClick={() => handleTabClick("aws-services.json")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                  <ThemedIcon variant="grid" size="sm" active={activeTab === "aws-services.json"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Services</div>
              </div>

              <div className="group relative">
                <button 
                  onClick={() => setShowCommandPalette(true)} 
                  className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22] bg-[#FF9900]/10 border border-[#FF9900]/30"
                  aria-label="Search"
                  title="Search (⌘K)"
                >
                  <ThemedIcon variant="search" size="sm" active={showCommandPalette} />
                </button>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Search (⌘K)</div>
              </div>

              <div className="mt-auto flex flex-col gap-2 mb-1">
                <div className="group relative">
                  <div onClick={() => handleTabClick("scanner.config")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                    <ThemedIcon variant="gear" size="sm" active={false} />
                  </div>
                  <div className="absolute left-14 bottom-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Settings</div>
                </div>
                <div className="group relative">
                  <div onClick={() => handleTabClick("credentials.aws")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                    <ThemedIcon variant="user" size="sm" active={false} />
                  </div>
                  <div className="absolute left-14 bottom-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Account</div>
                </div>
              </div>
            </div>

            {/* Side Bar (Explorer) */}
            <div className="hidden md:flex w-64 bg-[#0d1117] border-r border-[#30363d] flex-col">
              <div className="px-4 py-3 flex items-center justify-between border-b border-[#30363d]/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Explorer</span>
                <div className="flex items-center gap-2">
                  <div onClick={() => handleTabClick("credentials.aws")} className="cursor-pointer"><ThemedIcon variant="files" size="xs" /></div>
                  <div onClick={() => { addLog("Refreshing workspace...", "info"); window.location.reload(); }} className="cursor-pointer"><ThemedIcon variant="refresh" size="xs" /></div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-2 py-2 space-y-0.5">
                  <div className="flex items-center gap-1 py-1 px-2 text-gray-400 group cursor-pointer hover:bg-[#161b22] rounded transition-colors">
                    <ChevronRight className="w-3 h-3 rotate-90 text-gray-600 group-hover:text-gray-400" />
                    <span className="text-[11px] font-bold uppercase text-gray-500 group-hover:text-gray-400">AWS-DZERA</span>
                  </div>
                  <div 
                    onClick={() => handleTabClick("credentials.aws")}
                    className={`flex items-center gap-2 py-1.5 px-4 cursor-pointer transition-all duration-200 rounded-md mx-1 ${activeTab === "credentials.aws" ? "text-[#FF9900] bg-[#FF9900]/10 border-l-2 border-[#FF9900]" : "text-gray-400 hover:bg-[#161b22] hover:text-gray-200"}`}
                  >
                    <ThemedIcon variant="key" size="xs" active={activeTab === "credentials.aws"} />
                    <span className="text-xs font-medium">credentials.aws</span>
                  </div>
                  <div 
                    onClick={() => handleTabClick("scanner.config")}
                    className={`flex items-center gap-2 py-1.5 px-4 cursor-pointer transition-all duration-200 rounded-md mx-1 ${activeTab === "scanner.config" ? "text-[#FF9900] bg-[#FF9900]/10 border-l-2 border-[#FF9900]" : "text-gray-400 hover:bg-[#161b22] hover:text-gray-200"}`}
                  >
                    <ThemedIcon variant="gear" size="xs" active={activeTab === "scanner.config"} />
                    <span className="text-xs font-medium">scanner.config</span>
                  </div>
                  <div 
                    onClick={() => handleTabClick("cost-reports.md")}
                    className={`flex items-center gap-2 py-1.5 px-4 cursor-pointer transition-all duration-200 rounded-md mx-1 ${activeTab === "cost-reports.md" ? "text-[#FF9900] bg-[#FF9900]/10 border-l-2 border-[#FF9900]" : "text-gray-400 hover:bg-[#161b22] hover:text-gray-200"}`}
                  >
                    <ThemedIcon variant="chart" size="xs" active={activeTab === "cost-reports.md"} />
                    <span className="text-xs font-medium">cost-reports.md</span>
                  </div>
                  <div 
                    onClick={() => handleTabClick("aws-services.json")}
                    className={`flex items-center gap-2 py-1.5 px-4 cursor-pointer transition-all duration-200 rounded-md mx-1 ${activeTab === "aws-services.json" ? "text-[#FF9900] bg-[#FF9900]/10 border-l-2 border-[#FF9900]" : "text-gray-400 hover:bg-[#161b22] hover:text-gray-200"}`}
                  >
                    <ThemedIcon variant="grid" size="xs" active={activeTab === "aws-services.json"} />
                    <span className="text-xs font-medium">aws-services.json</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#30363d]">
                    <a 
                      href="/why-dzera" 
                      className="flex items-center gap-2 py-1.5 px-2 text-gray-400 group cursor-pointer hover:bg-[#161b22] rounded transition-colors"
                    >
                      <ThemedIcon variant="book" size="xs" />
                      <span className="text-[11px] font-bold uppercase text-gray-500 group-hover:text-[#FF9900] transition-colors">Documentation</span>
                      <ExternalLink className="w-2.5 h-2.5 text-gray-600 ml-auto" />
                    </a>
                    <a 
                      href="https://github.com/stalkiq/dzera" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 py-1.5 px-2 text-gray-400 group cursor-pointer hover:bg-[#161b22] rounded transition-colors"
                    >
                      <ThemedIcon variant="cloud" size="xs" />
                      <span className="text-[11px] font-bold uppercase text-gray-500 group-hover:text-[#FF9900] transition-colors">GitHub</span>
                      <ExternalLink className="w-2.5 h-2.5 text-gray-600 ml-auto" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 bg-[#0d1117] flex flex-col min-w-0">
              {/* Tab Bar */}
              <div className="h-9 bg-[#161b22] flex items-center border-b border-[#30363d] overflow-x-auto no-scrollbar">
                {openTabs.map((tabId) => (
                  <div 
                    key={tabId}
                    onClick={() => setActiveTab(tabId)}
                    className={`px-4 h-full flex items-center gap-2 border-r border-[#30363d] cursor-pointer min-w-fit transition-all ${activeTab === tabId ? "bg-[#0d1117] border-t-[3px] border-t-[#FF9900]" : "bg-[#161b22] hover:bg-[#1c2128]"}`}
                  >
                    <DLogo size="xs" active={activeTab === tabId} />
                    <span className={`text-xs ${activeTab === tabId ? "text-gray-200" : "text-gray-500"}`}>{tabId}</span>
                    <X 
                      className="w-3 h-3 text-gray-600 hover:text-gray-300 ml-1" 
                      onClick={(e) => closeTab(e, tabId)}
                    />
                  </div>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                {activeTab === "credentials.aws" && (
                  <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2 text-center lg:text-left">
                      <h2 className="text-3xl font-black text-white tracking-tight">Connect AWS Account</h2>
                      <p className="text-gray-400 text-sm">Provide your access credentials to initiate the infrastructure cost analysis.</p>
                    </div>

                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-6 shadow-xl">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Access Key ID</label>
                          <input
                            type="text"
                            placeholder="AKIA..."
                            value={credentials.accessKeyId}
                            onChange={(e) =>
                              setCredentials({ ...credentials, accessKeyId: e.target.value })
                            }
                            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Secret Access Key</label>
                          <input
                            type="password"
                            placeholder="••••••••••••••••"
                            value={credentials.secretAccessKey}
                            onChange={(e) =>
                              setCredentials({
                                ...credentials,
                                secretAccessKey: e.target.value,
                              })
                            }
                            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
                          <DLogo size="sm" />
                          <span className="text-sm text-red-200">{error}</span>
                        </div>
                      )}

                      <button
                        onClick={handleVerify}
                        className="w-full bg-[#FF9900] hover:bg-[#e68a00] text-black font-black py-3.5 rounded-lg shadow-lg shadow-orange-500/10 hover:shadow-orange-500/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                      >
                        <DLogo size="sm" active />
                        ANALYZE INFRASTRUCTURE
                      </button>
                    </div>

                    <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-5">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <DLogo size="sm" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-blue-300">Security Notice</h4>
                        <p className="text-xs text-blue-200/70 leading-relaxed">
                          For optimal security, utilize an IAM user configured with <code className="bg-blue-500/20 px-1 rounded">ReadOnlyAccess</code>. 
                          Dzera performs read-only operations and does not modify your resources.
                        </p>
                        <a 
                          href="https://console.aws.amazon.com/iam" 
                          target="_blank" 
                          className="text-xs font-bold text-[#FF9900] hover:text-[#e68a00] flex items-center gap-1 pt-1 transition-all hover:translate-x-1 active:scale-95"
                        >
                          IAM Configuration Guide <ExternalLink className="w-3 h-3" />
                        </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "scanner.config" && (
                  <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <DLogo size="lg" active />
                        Analysis Configuration
                      </h2>
                      <p className="text-gray-400 text-sm">Infrastructure scanning parameters and service coverage.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <DLogo size="sm" active />
                        </div>
                        <h3 className="font-bold text-white">Multi-Region Analysis</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Default regions: <code className="bg-[#0d1117] px-1 rounded text-orange-300">us-west-2</code> and <code className="bg-[#0d1117] px-1 rounded text-orange-300">us-east-1</code>
                        </p>
                      </div>
                      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <DLogo size="sm" />
                        </div>
                        <h3 className="font-bold text-white">Service Coverage</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          EC2, S3, RDS, CloudFront, NAT Gateways, Elastic IPs, DynamoDB global tables.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <DLogo size="xs" active />
                        Automated Cost Estimation
                      </h3>
                      <div className="space-y-3 text-xs text-gray-400">
                        <p>Dzera employs integrated pricing models that eliminate the requirement for Billing API permissions:</p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li><span className="text-gray-200">Compute:</span> Hourly rates calculated by instance type and region.</li>
                          <li><span className="text-gray-200">Idle Resources:</span> Identifies unattached volumes and IPs incurring charges.</li>
                          <li><span className="text-gray-200">Data Transfer:</span> Baseline cost estimation for NAT Gateway and CDN traffic.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "cost-reports.md" && (
                  <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <DLogo size="lg" active />
                        Analysis Reports
                      </h2>
                      <p className="text-gray-400 text-sm">Understanding finding classifications and priority levels.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-[#161b22] border-l-4 border-red-500 p-6 rounded-r-xl">
                        <h4 className="text-red-400 font-bold mb-1">Critical Priority</h4>
                        <p className="text-xs text-gray-400">Active resources such as EC2 instances or RDS databases that represent primary cost drivers requiring immediate review.</p>
                      </div>
                      <div className="bg-[#161b22] border-l-4 border-yellow-500 p-6 rounded-r-xl">
                        <h4 className="text-yellow-400 font-bold mb-1">Warning Priority</h4>
                        <p className="text-xs text-gray-400">Unused or misconfigured resources including unattached volumes or idle NAT Gateways generating passive charges.</p>
                      </div>
                      <div className="bg-[#161b22] border-l-4 border-blue-500 p-6 rounded-r-xl">
                        <h4 className="text-blue-400 font-bold mb-1">Informational</h4>
                        <p className="text-xs text-gray-400">Optimization recommendations for configurations such as S3 lifecycle policies or CloudFront cache settings.</p>
                      </div>
                    </div>

                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center space-y-4">
                      <div className="w-16 h-16 bg-[#FF9900]/10 rounded-full flex items-center justify-center mx-auto">
                        <DLogo size="lg" active />
                      </div>
                      <h3 className="text-lg font-bold text-white">Ready to Generate Report</h3>
                      <p className="text-sm text-gray-400 max-w-sm mx-auto">
                        Navigate to <code className="bg-[#0d1117] px-1.5 py-0.5 rounded text-[#FF9900]">credentials.aws</code> and 
                        initiate an analysis to generate your infrastructure cost report.
                      </p>
                      <button 
                        onClick={() => handleTabClick("credentials.aws")}
                        className="text-[#FF9900] font-bold hover:underline"
                      >
                        Open credentials.aws
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "aws-services.json" && (
                  <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                          <ThemedIcon variant="grid" size="md" active />
                          AWS Service Directory
                        </h2>
                        <p className="text-gray-400 text-xs">Select a service to view optimization analysis parameters.</p>
                      </div>
                      <div className="relative group">
                        <DLogo size="xs" />
                        <input 
                          type="text" 
                          placeholder="Filter services..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-[#161b22] border border-[#30363d] rounded-lg pl-8 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF9900] w-full md:w-64 transition-all"
                          style={{ paddingLeft: '2rem' }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { cat: "Compute", desc: "Virtual servers and serverless computing", items: [
                          { name: "EC2", desc: "Elastic Compute Cloud - Virtual servers in the cloud. Launch instances with various CPU, memory, and storage configurations. Pay by the hour/second for compute capacity. Ideal for applications needing full OS control." },
                          { name: "Lightsail", desc: "Simplified VPS hosting with pre-configured environments. Fixed monthly pricing includes compute, storage, and data transfer. Best for simple websites, blogs, and small applications." },
                          { name: "Lambda", desc: "Serverless compute that runs code without provisioning servers. Triggered by events (API calls, file uploads, schedules). Pay only for execution time in 1ms increments. Auto-scales from zero to thousands of requests." },
                          { name: "Batch", desc: "Managed batch computing that dynamically provisions compute resources. Runs hundreds of thousands of jobs efficiently. Automatically scales based on job queue depth." },
                          { name: "Elastic Beanstalk", desc: "PaaS that handles infrastructure for web apps. Upload code and it automatically deploys, load balances, and scales. Supports Java, .NET, PHP, Node.js, Python, Ruby, Go, and Docker." },
                          { name: "App Runner", desc: "Fully managed container service for web apps. Build and deploy from source code or container images. Automatic scaling, load balancing, and encryption included." },
                          { name: "Fargate", desc: "Serverless compute engine for containers. Run containers without managing EC2 instances. Pay for vCPU and memory used by containers. Works with ECS and EKS." }
                        ]},
                        { cat: "Containers", desc: "Docker and Kubernetes orchestration", items: [
                          { name: "ECS", desc: "Elastic Container Service - Fully managed container orchestration. Run Docker containers at scale with deep AWS integration. Choose EC2 or Fargate launch types." },
                          { name: "EKS", desc: "Elastic Kubernetes Service - Managed Kubernetes control plane. Run K8s workloads without managing master nodes. Compatible with standard K8s tooling and plugins." },
                          { name: "ECR", desc: "Elastic Container Registry - Secure Docker image repository. Integrated with ECS/EKS for seamless deployments. Supports image scanning for vulnerabilities." },
                          { name: "App Mesh", desc: "Service mesh for microservices communication. Provides traffic management, observability, and security. Works with ECS, EKS, Fargate, and EC2." }
                        ]},
                        { cat: "Storage", desc: "Object, file, and block storage solutions", items: [
                          { name: "S3", desc: "Simple Storage Service - Scalable object storage with 99.999999999% durability. Store unlimited data as objects up to 5TB each. Multiple storage classes for cost optimization (Standard, Intelligent-Tiering, Glacier)." },
                          { name: "EFS", desc: "Elastic File System - Managed NFS file storage for EC2. Automatically grows/shrinks as files are added/removed. Supports thousands of concurrent connections." },
                          { name: "FSx", desc: "Fully managed file systems - Windows File Server (SMB) or Lustre (HPC). Sub-millisecond latencies for demanding workloads. Native Windows AD integration." },
                          { name: "S3 Glacier", desc: "Long-term archive storage at lowest cost. Retrieval times from minutes to hours. Ideal for compliance archives, backup, and disaster recovery." },
                          { name: "Storage Gateway", desc: "Hybrid cloud storage connecting on-premises to S3. File, volume, and tape gateway modes. Caches frequently accessed data locally." },
                          { name: "AWS Backup", desc: "Centralized backup service across AWS services. Policy-based backup scheduling and retention. Cross-region and cross-account backup copies." }
                        ]},
                        { cat: "Database", desc: "Relational, NoSQL, and caching databases", items: [
                          { name: "RDS", desc: "Relational Database Service - Managed MySQL, PostgreSQL, MariaDB, Oracle, SQL Server. Automated backups, patching, and Multi-AZ failover. Read replicas for scaling read-heavy workloads." },
                          { name: "Aurora", desc: "MySQL/PostgreSQL-compatible with 5x better performance. Auto-scales storage up to 128TB. Serverless option scales compute based on demand." },
                          { name: "DynamoDB", desc: "Serverless NoSQL database with single-digit millisecond latency. Automatic scaling handles millions of requests/second. Global tables for multi-region replication." },
                          { name: "ElastiCache", desc: "Managed Redis or Memcached for in-memory caching. Sub-millisecond response times for real-time apps. Cluster mode for horizontal scaling." },
                          { name: "Neptune", desc: "Graph database for highly connected datasets. Supports Apache TinkerPop Gremlin and SPARQL. Ideal for social networks, fraud detection, recommendations." },
                          { name: "DocumentDB", desc: "MongoDB-compatible document database. Scalable, durable, and fully managed. Automatic backups and point-in-time recovery." },
                          { name: "Redshift", desc: "Petabyte-scale data warehouse with columnar storage. Massively parallel processing (MPP) for fast analytics. Integrates with BI tools and data lakes." }
                        ]},
                        { cat: "Networking", desc: "Network infrastructure and content delivery", items: [
                          { name: "VPC", desc: "Virtual Private Cloud - Isolated network environment in AWS. Define IP ranges, subnets, route tables, and gateways. Security groups and NACLs for traffic control." },
                          { name: "CloudFront", desc: "Global CDN with 400+ edge locations. Caches content close to users for low latency. Integrates with S3, EC2, Lambda@Edge for dynamic content." },
                          { name: "API Gateway", desc: "Create, publish, and manage REST/WebSocket APIs. Handles authentication, throttling, and caching. Integrates with Lambda for serverless backends." },
                          { name: "Route 53", desc: "Scalable DNS with health checking and traffic routing. Supports domain registration and DNSSEC. Routing policies: simple, weighted, latency, geolocation, failover." },
                          { name: "Direct Connect", desc: "Dedicated network connection to AWS. Bypass internet for consistent, low-latency performance. 1Gbps to 100Gbps connection speeds." },
                          { name: "Global Accelerator", desc: "Improve availability with AWS global network. Static IP addresses route to nearest healthy endpoint. 60% improvement in internet user performance." },
                          { name: "NAT Gateway", desc: "Enable private subnet instances to access internet. Managed, highly available NAT service. Charged per hour plus data processed - common cost driver." },
                          { name: "Elastic IP", desc: "Static public IPv4 address for dynamic cloud computing. Free when attached to running instance. Charged when idle - watch for orphaned IPs." }
                        ]},
                        { cat: "Developer Tools", desc: "CI/CD and development environments", items: [
                          { name: "CodeCommit", desc: "Managed Git repositories with encryption. Unlimited repos with no storage limits. Integrates with AWS developer tools and third-party tools." },
                          { name: "CodeBuild", desc: "Fully managed build service compiling code and running tests. Pre-configured environments for popular languages. Pay only for build minutes used." },
                          { name: "CodeDeploy", desc: "Automated deployments to EC2, Fargate, Lambda, on-premises. Blue/green and rolling deployment strategies. Automatic rollback on failure." },
                          { name: "CodePipeline", desc: "Continuous delivery service for release automation. Orchestrates build, test, and deploy phases. Visual workflow editor and integrations." },
                          { name: "Cloud9", desc: "Cloud-based IDE accessible from any browser. Pre-configured environments with AWS CLI. Real-time collaborative editing." },
                          { name: "CloudShell", desc: "Browser-based shell with AWS CLI pre-installed. 1GB persistent storage per region. Pre-authenticated with console credentials." },
                          { name: "X-Ray", desc: "Distributed tracing for debugging microservices. Visual service map shows request flows. Identify performance bottlenecks and errors." }
                        ]},
                        { cat: "Management", desc: "Monitoring, automation, and governance", items: [
                          { name: "CloudWatch", desc: "Monitoring service for AWS resources and applications. Collect metrics, logs, and events. Set alarms and automate actions based on thresholds." },
                          { name: "CloudFormation", desc: "Infrastructure as Code using YAML/JSON templates. Provision and manage AWS resources consistently. Stack updates with change sets and rollback." },
                          { name: "Config", desc: "Track resource configurations and changes over time. Evaluate compliance with desired configurations. Rules-based remediation of non-compliant resources." },
                          { name: "Systems Manager", desc: "Unified interface for operational tasks. Patch management, run commands, parameter storage. Session Manager for secure shell access without SSH keys." },
                          { name: "Trusted Advisor", desc: "Best practice recommendations across five categories. Cost optimization, security, fault tolerance, performance, service limits. Real-time guidance to improve AWS environment." },
                          { name: "CloudTrail", desc: "Log and monitor all API activity across AWS. Track who did what, when, and from where. Essential for security analysis and compliance auditing." }
                        ]},
                        { cat: "Machine Learning", desc: "AI/ML services and model training", items: [
                          { name: "SageMaker", desc: "End-to-end ML platform for building, training, and deploying models. Jupyter notebooks, built-in algorithms, and AutoML. Managed infrastructure for any scale." },
                          { name: "Bedrock", desc: "Access foundation models from AI21, Anthropic, Stability AI, and Amazon. Build generative AI apps without managing infrastructure. Fine-tune models with your data." },
                          { name: "Comprehend", desc: "Natural Language Processing service. Extract insights from text: sentiment, entities, key phrases, language. Custom classification and entity recognition." },
                          { name: "Rekognition", desc: "Image and video analysis with deep learning. Detect objects, faces, text, scenes, activities. Content moderation and celebrity recognition." },
                          { name: "Textract", desc: "Extract text, handwriting, and data from documents. Understand forms and tables automatically. Process invoices, receipts, and ID documents." },
                          { name: "Polly", desc: "Text-to-speech service with lifelike voices. 60+ voices in 30+ languages. Neural TTS for natural-sounding speech." },
                          { name: "Lex", desc: "Build conversational interfaces using voice and text. Same technology as Alexa. Create chatbots for web, mobile, and messaging platforms." }
                        ]},
                        { cat: "Analytics", desc: "Data processing and business intelligence", items: [
                          { name: "Athena", desc: "Serverless SQL queries directly on S3 data. Pay only for data scanned. Supports CSV, JSON, Parquet, ORC formats." },
                          { name: "EMR", desc: "Managed Hadoop/Spark clusters for big data processing. Process petabytes of data cost-effectively. Supports Hive, Presto, HBase, Flink." },
                          { name: "Kinesis", desc: "Real-time data streaming at any scale. Ingest and process millions of records per second. Data Streams, Firehose, and Analytics services." },
                          { name: "QuickSight", desc: "Serverless business intelligence at scale. Create interactive dashboards and reports. ML-powered insights and natural language queries." },
                          { name: "Glue", desc: "Serverless ETL service for data preparation. Discover and catalog data automatically. Transform data for analytics and ML." },
                          { name: "OpenSearch", desc: "Search and analytics suite (Elasticsearch fork). Full-text search, log analytics, real-time monitoring. Managed clusters with built-in Kibana." },
                          { name: "MSK", desc: "Managed Streaming for Apache Kafka. Fully managed, highly available Kafka clusters. Compatible with existing Kafka applications." }
                        ]},
                        { cat: "Security", desc: "Identity, encryption, and threat detection", items: [
                          { name: "IAM", desc: "Identity and Access Management - Control who can do what in AWS. Users, groups, roles, and policies. MFA support and fine-grained permissions." },
                          { name: "Cognito", desc: "User authentication for web and mobile apps. User pools for sign-up/sign-in. Identity pools for temporary AWS credentials." },
                          { name: "Secrets Manager", desc: "Securely store and rotate secrets (passwords, API keys). Automatic rotation for RDS, Redshift, DocumentDB. Audit secret access with CloudTrail." },
                          { name: "KMS", desc: "Key Management Service - Create and control encryption keys. Integrated with 100+ AWS services. Hardware security modules (HSM) backed." },
                          { name: "WAF", desc: "Web Application Firewall protecting against web exploits. Block SQL injection, XSS, and other attacks. Managed rules and custom rules." },
                          { name: "Shield", desc: "DDoS protection service. Standard (free) protects against common attacks. Advanced provides 24/7 DDoS response team." },
                          { name: "GuardDuty", desc: "Intelligent threat detection using ML. Analyzes CloudTrail, VPC Flow Logs, DNS logs. Detects account compromise, instance compromise, reconnaissance." },
                          { name: "Inspector", desc: "Automated vulnerability management for EC2 and containers. Continuous scanning and prioritized findings. Integration with Security Hub." }
                        ]},
                        { cat: "Integration", desc: "Messaging and workflow orchestration", items: [
                          { name: "SNS", desc: "Simple Notification Service - Pub/sub messaging for microservices. Push notifications to mobile, email, SMS, HTTP. Fan-out to multiple subscribers." },
                          { name: "SQS", desc: "Simple Queue Service - Fully managed message queuing. Decouple components with reliable delivery. Standard (at-least-once) and FIFO (exactly-once) queues." },
                          { name: "EventBridge", desc: "Serverless event bus for application integration. Route events between AWS services, SaaS apps, and custom apps. Schema registry and event archive." },
                          { name: "Step Functions", desc: "Visual workflow service for distributed applications. Orchestrate Lambda, ECS, API calls, and more. Built-in error handling and retry logic." },
                          { name: "MQ", desc: "Managed message broker for ActiveMQ and RabbitMQ. Migrate existing messaging apps without rewriting. Industry-standard APIs and protocols." },
                          { name: "AppFlow", desc: "Securely transfer data between SaaS and AWS. Connect to Salesforce, ServiceNow, Slack, and more. Transform and validate data during transfer." }
                        ]},
                        { cat: "Cost Management", desc: "Billing optimization and forecasting", items: [
                          { name: "Cost Explorer", desc: "Visualize and analyze AWS spending patterns. Filter by service, region, account, tag. Forecast future costs based on historical usage." },
                          { name: "Budgets", desc: "Set custom budgets and receive alerts. Track costs, usage, and reservations. Automate actions when thresholds are exceeded." },
                          { name: "Savings Plans", desc: "Flexible pricing model with up to 72% savings. Commit to consistent compute usage ($/hour). Applies automatically to eligible usage." },
                          { name: "Reserved Instances", desc: "Significant discounts for 1 or 3-year commitments. Up to 75% savings compared to On-Demand. Standard RIs for predictable workloads, Convertible for flexibility." }
                        ]}
                      ].filter(group => 
                        group.cat.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        group.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).map((group) => (
                        <div key={group.cat} className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex flex-col hover:border-[#FF9900]/30 transition-colors">
                          <div className="bg-[#0d1117] px-4 py-3 border-b border-[#30363d]">
                            <h3 className="text-sm font-bold text-white">{group.cat}</h3>
                            <p className="text-[10px] text-gray-500 mt-0.5">{group.desc}</p>
                          </div>
                          <div className="p-3 flex-1 space-y-2 max-h-[400px] overflow-y-auto">
                            {group.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                              <button 
                                key={item.name} 
                                onClick={() => handleServiceClick(item.name)}
                                className={`w-full text-left bg-[#0d1117] border rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${selectedService === item.name ? "text-[#FF9900] border-[#FF9900] bg-[#FF9900]/5" : "text-gray-300 border-[#30363d] hover:border-[#FF9900]/50"}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <DLogo size="xs" active={selectedService === item.name} />
                                  <span className="text-xs font-bold">{item.name}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{item.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {searchQuery && (
                      <p className="text-center text-xs text-gray-500">
                        Displaying services matching "<span className="text-[#FF9900]">{searchQuery}</span>"
                      </p>
                    )}
                  </div>
                )}

                {activeTab.endsWith('.md') && activeTab !== 'cost-reports.md' && activeTab !== 'scanner.config' && (
                  <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {(() => {
                      const serviceInfo = getServiceInfo(activeTab);
                      const serviceName = activeTab.replace('.md', '').replace(/-/g, ' ');
                      return (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <DLogo size="lg" active />
                              <h2 className="text-3xl font-black text-white tracking-tight capitalize">
                                {serviceName} Analysis
                              </h2>
                            </div>
                            <p className="text-gray-400 text-sm">{serviceInfo.desc}</p>
                          </div>

                          {/* Service Overview - Detailed Description */}
                          <div className="bg-gradient-to-r from-[#161b22] to-[#1c2128] border border-[#30363d] rounded-xl p-6">
                            <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                              <DLogo size="sm" active />
                              Service Overview
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {serviceInfo.details || serviceInfo.desc}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4">
                              <h3 className="font-bold text-white flex items-center gap-2">
                                <DLogo size="xs" active />
                                Analysis Scope
                              </h3>
                              <p className="text-xs text-gray-500 mb-3">Dzera evaluates the following parameters for this service:</p>
                              <ul className="text-xs text-gray-400 space-y-2">
                                {serviceInfo.scans.map((scan, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <DLogo size="xs" />
                                    <span>{scan}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4">
                              <h3 className="font-bold text-white flex items-center gap-2">
                                <DLogo size="xs" />
                                Optimization Actions
                              </h3>
                              <p className="text-xs text-gray-500 mb-3">Recommended actions based on analysis findings:</p>
                              <ul className="text-xs text-gray-400 space-y-2">
                                <li className="flex items-start gap-2">
                                  <DLogo size="xs" />
                                  <span>Review resource utilization metrics</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <DLogo size="xs" />
                                  <span>Evaluate rightsizing opportunities</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <DLogo size="xs" />
                                  <span>Configure automated scaling policies</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <DLogo size="xs" />
                                  <span>Implement cost allocation tagging</span>
                                </li>
                              </ul>
                            </div>
                          </div>

                          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
                            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                              <DLogo size="xs" active />
                              Recommendation
                            </h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Development and staging environments for {serviceName} frequently remain active beyond their required lifecycle. 
                              Dzera&apos;s automated analysis identifies these orphaned resources and calculates potential monthly savings 
                              from their decommissioning.
                            </p>
                          </div>

                          <div className="flex justify-center">
                            <button 
                              onClick={() => handleTabClick("credentials.aws")}
                              className="bg-[#FF9900] text-black font-bold py-2 px-6 rounded-lg hover:bg-[#e68a00] transition-all active:scale-95 flex items-center gap-2"
                            >
                              <DLogo size="sm" active />
                              Analyze My Infrastructure
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Terminal Pane */}
              <div className="h-48 bg-[#0d1117] border-t border-[#30363d] flex flex-col">
                <div className="h-9 bg-[#161b22] flex items-center justify-between px-4 border-b border-[#30363d]">
                  <div className="flex items-center gap-6 h-full">
                    <div className="flex items-center gap-2 border-b-2 border-[#FF9900] h-full px-1 cursor-pointer group">
                      <DLogo size="xs" active />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-200">Terminal</span>
                    </div>
                    <div className="flex items-center gap-2 h-full px-1 cursor-pointer group hover:border-b-2 hover:border-gray-500 transition-all" onClick={() => handleTabClick("cost-reports.md")}>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-gray-300">Output</span>
                    </div>
                    <div className="flex items-center gap-2 h-full px-1 cursor-pointer group hover:border-b-2 hover:border-gray-500 transition-all" onClick={() => handleTabClick("scanner.config")}>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-gray-300">Debug</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setLogs([])}
                      className="text-[10px] text-gray-500 hover:text-gray-300 font-bold uppercase tracking-widest transition-colors flex items-center gap-1 active:scale-95"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-[10px] text-gray-500 font-mono">zsh</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-[#30363d] bg-[#0d1117]">
                  {logs.length === 0 ? (
                    <div className="text-gray-600 italic flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
                      Awaiting analysis initialization...
                    </div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="flex gap-3 group">
                        <span className="text-gray-600 select-none group-hover:text-gray-400">›</span>
                        <span className={`
                          ${log.type === 'error' ? 'text-red-400' : ''}
                          ${log.type === 'warn' ? 'text-yellow-400' : ''}
                          ${log.type === 'success' ? 'text-green-400' : ''}
                          ${log.type === 'info' ? 'text-blue-300' : ''}
                        `}>
                          {log.msg}
                        </span>
                      </div>
                    ))
                  )}
                  {(step as string) === "scanning" && (
                    <div className="flex gap-3 animate-pulse">
                      <span className="text-gray-600">›</span>
                      <span className="text-[#FF9900]">Analyzing infrastructure...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat (Right Sidebar) */}
            <div className="hidden lg:flex w-[400px] bg-[#0d1117] border-l border-[#30363d] flex-col overflow-hidden">
              <div className="h-9 bg-[#161b22] flex items-center border-b border-[#30363d] px-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Assistant</span>
              </div>
              <div className="flex-1 min-h-0">
                <ChatInterface className="h-full border-l-0" />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Command Palette - works on all screen sizes */}
        <button 
          onClick={() => setShowCommandPalette(true)}
          className="hidden sm:flex fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#FF9900] rounded-full shadow-lg items-center justify-center active:scale-95 transition-transform"
          aria-label="Search"
        >
          <ThemedIcon variant="search" size="md" active />
        </button>

        {/* Command Palette Modal */}
        {showCommandPalette && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-4 sm:pt-[15vh] px-3 sm:px-4" onClick={() => setShowCommandPalette(false)}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            
            {/* Modal */}
            <div 
              className="relative w-full max-w-2xl bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Header */}
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-[#30363d]">
                <ThemedIcon variant="search" size="md" active />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-500">
                  <kbd className="px-1.5 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-gray-400">ESC</kbd>
                  <span>to close</span>
                </div>
                <button onClick={() => setShowCommandPalette(false)} className="sm:hidden text-gray-400 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 px-4 py-2 border-b border-[#30363d]/50 bg-[#161b22]/50">
                <button
                  onClick={() => setActiveFilter(null)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    activeFilter === null ? "bg-[#FF9900] text-black" : "text-gray-400 hover:text-white hover:bg-[#30363d]"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter("service")}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    activeFilter === "service" ? "bg-[#FF9900] text-black" : "text-gray-400 hover:text-white hover:bg-[#30363d]"
                  }`}
                >
                  Services
                </button>
                <button
                  onClick={() => setActiveFilter("action")}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    activeFilter === "action" ? "bg-[#FF9900] text-black" : "text-gray-400 hover:text-white hover:bg-[#30363d]"
                  }`}
                >
                  Actions
                </button>
                <button
                  onClick={() => setActiveFilter("command")}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    activeFilter === "command" ? "bg-[#FF9900] text-black" : "text-gray-400 hover:text-white hover:bg-[#30363d]"
                  }`}
                >
                  CLI
                </button>
                <button
                  onClick={() => setActiveFilter("pattern")}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    activeFilter === "pattern" ? "bg-[#FF9900] text-black" : "text-gray-400 hover:text-white hover:bg-[#30363d]"
                  }`}
                >
                  Patterns
                </button>
                <button
                  onClick={() => setActiveFilter("insight")}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    activeFilter === "insight" ? "bg-[#FF9900] text-black" : "text-gray-400 hover:text-white hover:bg-[#30363d]"
                  }`}
                >
                  AI
                </button>
                <button
                  onClick={() => setActiveFilter("doc")}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    activeFilter === "doc" ? "bg-[#FF9900] text-black" : "text-gray-400 hover:text-white hover:bg-[#30363d]"
                  }`}
                >
                  Docs
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {filteredSearchResults.length > 0 ? (
                  <div className="py-2">
                    {filteredSearchResults.map((item, index) => (
                      <div
                        key={item.id}
                        onClick={() => handleSearchSelect(item)}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                          index === selectedIndex ? "bg-[#FF9900]/10 border-l-2 border-[#FF9900]" : "hover:bg-[#161b22]"
                        }`}
                      >
                        {/* Type Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item.type === "service" ? "bg-blue-500/20" :
                          item.type === "action" ? "bg-green-500/20" :
                          item.type === "command" ? "bg-purple-500/20" :
                          item.type === "pattern" ? "bg-orange-500/20" :
                          item.type === "insight" ? "bg-pink-500/20" :
                          "bg-gray-500/20"
                        }`}>
                          {item.type === "service" && <ThemedIcon variant="cloud" size="sm" active />}
                          {item.type === "action" && <ThemedIcon variant="d" size="sm" active />}
                          {item.type === "command" && <ThemedIcon variant="terminal" size="sm" active />}
                          {item.type === "pattern" && <ThemedIcon variant="chart" size="sm" active />}
                          {item.type === "insight" && <ThemedIcon variant="d" size="sm" active />}
                          {item.type === "doc" && <ThemedIcon variant="book" size="sm" active />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${index === selectedIndex ? "text-[#FF9900]" : "text-white"}`}>
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                                item.badge === "Hot" ? "bg-red-500/20 text-red-400" :
                                item.badge === "AI" ? "bg-purple-500/20 text-purple-400" :
                                item.badge === "$$" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-gray-500/20 text-gray-400"
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        </div>

                        {/* Category & Shortcut */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-gray-600 uppercase tracking-wider">{item.category}</span>
                          {index === selectedIndex && (
                            <kbd className="px-1.5 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-[10px] text-gray-400">
                              <CornerDownLeft className="w-3 h-3 inline" />
                            </kbd>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <ThemedIcon variant="search" size="lg" />
                    <p className="mt-3 text-sm text-gray-400">No results found for &quot;{commandSearch}&quot;</p>
                    <p className="text-xs text-gray-600 mt-1">Try searching for EC2, S3, Lambda, or &quot;cost spike&quot;</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#30363d] bg-[#161b22]/50">
                <div className="flex items-center gap-4 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3" /> Select
                  </span>
                  <span className="flex items-center gap-1">
                    <Command className="w-3 h-3" />K Open
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DLogo size="xs" active />
                  <span className="text-[10px] text-gray-500">Powered by Dzera Intelligence</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === "scanning") {
    return (
      <div className="min-h-screen bg-[#0b0f14] text-[#e5e7eb] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#FF9900] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-white">Analyzing infrastructure...</p>
          <p className="text-sm text-gray-400">
            This process typically requires 30-60 seconds
          </p>
          <button
            onClick={() => {
              setStep("setup");
              setError("Analysis cancelled");
            }}
            className="mt-4 px-4 py-2 bg-[#161b22] border border-[#30363d] rounded hover:bg-[#1c2128] text-sm text-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === "results" && result) {
    const criticalFindings = result.findings.filter(
      (f) => f.severity === "critical"
    );
    const warningFindings = result.findings.filter(
      (f) => f.severity === "warning"
    );

    return (
      <div className="min-h-screen bg-[#0b0f14] text-[#e5e7eb] px-4 py-6">
        <div className="max-w-[1600px] mx-auto space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <DLogo size="lg" active />
              <div>
                <h1 className="text-lg font-bold text-white leading-none tracking-tight">AWS Dzera</h1>
                <p className="text-[#FF9900] text-[8px] font-bold uppercase tracking-widest">Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#161b22] px-3 py-1.5 rounded-md border border-[#30363d]">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-400">Analysis Complete</span>
              </div>
              <button
                onClick={() => {
                  setStep("setup");
                  setResult(null);
                  setCredentials({ accessKeyId: "", secretAccessKey: "" });
                }}
                className="bg-[#FF9900] hover:bg-[#e68a00] text-black text-xs font-bold px-4 py-1.5 rounded transition-colors active:scale-95"
              >
                NEW ANALYSIS
              </button>
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden flex h-[800px]">
            {/* Activity Bar */}
            <div className="w-12 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-3 gap-2">
              <div className="group relative">
                <div onClick={() => handleTabClick("credentials.aws")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                  <ThemedIcon variant="files" size="sm" active={activeTab === "credentials.aws"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Explorer</div>
              </div>
              
              <div className="group relative">
                <div onClick={() => handleTabClick("cost-reports.md")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                  <ThemedIcon variant="chart" size="sm" active={activeTab === "cost-reports.md"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Reports</div>
              </div>

              <div className="group relative">
                <div onClick={() => handleTabClick("scanner.config")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                  <ThemedIcon variant="gear" size="sm" active={activeTab === "scanner.config"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Configuration</div>
              </div>

              <div className="group relative">
                <div onClick={() => handleTabClick("aws-services.json")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                  <ThemedIcon variant="grid" size="sm" active={activeTab === "aws-services.json"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Services</div>
              </div>

              <div className="group relative">
                <button 
                  onClick={() => setShowCommandPalette(true)} 
                  className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22] bg-[#FF9900]/10 border border-[#FF9900]/30"
                  aria-label="Search"
                  title="Search (⌘K)"
                >
                  <ThemedIcon variant="search" size="sm" active={showCommandPalette} />
                </button>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Search (⌘K)</div>
              </div>

              <div className="mt-auto flex flex-col gap-2 mb-1">
                <div className="group relative">
                  <div onClick={() => handleTabClick("scanner.config")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                    <ThemedIcon variant="gear" size="sm" />
                  </div>
                  <div className="absolute left-14 bottom-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Settings</div>
                </div>
                <div className="group relative">
                  <div onClick={() => handleTabClick("credentials.aws")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95 p-1.5 rounded hover:bg-[#161b22]">
                    <ThemedIcon variant="user" size="sm" />
                  </div>
                  <div className="absolute left-14 bottom-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Account</div>
                </div>
              </div>
            </div>

            {/* Side Bar (Explorer) */}
            <div className="hidden md:flex w-64 bg-[#0d1117] border-r border-[#30363d] flex-col">
              <div className="px-4 py-3 flex items-center justify-between border-b border-[#30363d]/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Explorer</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-2 py-2 space-y-0.5">
                  <div className="flex items-center gap-1 py-1 px-2 text-gray-400 group cursor-pointer hover:bg-[#161b22] rounded transition-colors">
                    <ChevronRight className="w-3 h-3 rotate-90 text-gray-600 group-hover:text-gray-400" />
                    <span className="text-[11px] font-bold uppercase text-gray-500 group-hover:text-gray-400">AWS-DZERA</span>
                  </div>
                  <div 
                    onClick={() => handleTabClick("credentials.aws")}
                    className={`flex items-center gap-2 py-1.5 px-4 cursor-pointer transition-all duration-200 rounded-md mx-1 ${activeTab === "credentials.aws" ? "text-[#FF9900] bg-[#FF9900]/10 border-l-2 border-[#FF9900]" : "text-gray-400 hover:bg-[#161b22] hover:text-gray-200"}`}
                  >
                    <ThemedIcon variant="key" size="xs" active={activeTab === "credentials.aws"} />
                    <span className="text-xs font-medium">credentials.aws</span>
                  </div>
                  <div 
                    onClick={() => handleTabClick("scanner.config")}
                    className={`flex items-center gap-2 py-1.5 px-4 cursor-pointer transition-all duration-200 rounded-md mx-1 ${activeTab === "scanner.config" ? "text-[#FF9900] bg-[#FF9900]/10 border-l-2 border-[#FF9900]" : "text-gray-400 hover:bg-[#161b22] hover:text-gray-200"}`}
                  >
                    <ThemedIcon variant="gear" size="xs" active={activeTab === "scanner.config"} />
                    <span className="text-xs font-medium">scanner.config</span>
                  </div>
                  <div 
                    onClick={() => handleTabClick("cost-reports.md")}
                    className={`flex items-center gap-2 py-1.5 px-4 cursor-pointer transition-all duration-200 rounded-md mx-1 ${activeTab === "cost-reports.md" ? "text-[#FF9900] bg-[#FF9900]/10 border-l-2 border-[#FF9900]" : "text-gray-400 hover:bg-[#161b22] hover:text-gray-200"}`}
                  >
                    <ThemedIcon variant="chart" size="xs" active={activeTab === "cost-reports.md"} />
                    <span className="text-xs font-medium">cost-reports.md</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Area (Results) */}
            <div className="flex-1 bg-[#0d1117] flex flex-col min-w-0">
              <div className="h-9 bg-[#161b22] flex items-center border-b border-[#30363d]">
                <div className="bg-[#0d1117] border-t-2 border-[#FF9900] px-4 h-full flex items-center gap-2 border-r border-[#30363d]">
                  <DLogo size="xs" active />
                  <span className="text-xs text-gray-200">analysis-results.json</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <header className="space-y-4">
                    <div className="flex items-center gap-3">
                      <DLogo size="lg" active />
                      <h1 className="text-3xl font-black text-white tracking-tight">Analysis Complete</h1>
                    </div>
                    <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6 shadow-xl">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-red-500">
                          ${result.totalEstimatedMonthlyCost.toFixed(2)}
                        </span>
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">/month estimated</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Based on {result.findings.length} cost-driving resources identified in your infrastructure.
                      </p>
                    </div>
                  </header>

                  <section className="space-y-8">
                    {criticalFindings.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                          <DLogo size="xs" active />
                          Critical Priority ({criticalFindings.length})
                        </h2>
                        <div className="space-y-3">
                          {criticalFindings.map((f, idx) => (
                            <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-red-500/50 transition-colors group">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <h3 className="font-bold text-white group-hover:text-red-400 transition-colors">{f.title}</h3>
                                  </div>
                                  <p className="text-sm text-gray-400 mb-4 leading-relaxed">{f.description}</p>
                                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                                    <span className="bg-[#0d1117] px-2 py-1 rounded text-gray-500 border border-[#30363d]">{f.service}</span>
                                    <span className="bg-[#0d1117] px-2 py-1 rounded text-gray-500 border border-[#30363d]">{f.region}</span>
                                    <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">~${f.estimatedMonthlyCost.toFixed(2)}/MO</span>
                                  </div>
                                  <div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                                    <p className="text-xs text-red-200/80">{f.suggestion}</p>
                                  </div>
                                </div>
                                {f.actionUrl && (
                                  <a href={f.actionUrl} target="_blank" rel="noopener noreferrer" className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d] text-gray-500 hover:text-white hover:border-gray-500 transition-all">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {warningFindings.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-500 flex items-center gap-2">
                          <DLogo size="xs" />
                          Warning Priority ({warningFindings.length})
                        </h2>
                        <div className="space-y-3">
                          {warningFindings.map((f, idx) => (
                            <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-yellow-500/50 transition-colors group">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <h3 className="font-bold text-white group-hover:text-yellow-400 transition-colors">{f.title}</h3>
                                  </div>
                                  <p className="text-sm text-gray-400 mb-4 leading-relaxed">{f.description}</p>
                                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                                    <span className="bg-[#0d1117] px-2 py-1 rounded text-gray-500 border border-[#30363d]">{f.service}</span>
                                    <span className="bg-[#0d1117] px-2 py-1 rounded text-gray-500 border border-[#30363d]">{f.region}</span>
                                    <span className="text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">~${f.estimatedMonthlyCost.toFixed(2)}/MO</span>
                                  </div>
                                  <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
                                    <p className="text-xs text-yellow-200/80">{f.suggestion}</p>
                                  </div>
                                </div>
                                {f.actionUrl && (
                                  <a href={f.actionUrl} target="_blank" rel="noopener noreferrer" className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d] text-gray-500 hover:text-white hover:border-gray-500 transition-all">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>

            {/* Chat (Right Sidebar) */}
            <div className="hidden lg:flex w-[400px] bg-[#0d1117] border-l border-[#30363d] flex-col overflow-hidden">
              <div className="h-9 bg-[#161b22] flex items-center border-b border-[#30363d] px-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Assistant</span>
              </div>
              <div className="flex-1 min-h-0">
                <ChatInterface className="h-full border-l-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
