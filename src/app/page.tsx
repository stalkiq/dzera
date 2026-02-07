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
    desc: "Amazon Elastic Compute Cloud (EC2) — Virtual servers in the cloud.",
    details: "EC2 lets you rent virtual machines (called instances) on AWS hardware. You choose the operating system (Linux, Windows, macOS), CPU count, memory, storage, and network speed. Instances come in families optimized for different workloads: general-purpose (t3, m6i), compute-optimized (c6i), memory-optimized (r6i), storage-optimized (i3), and GPU/accelerated (p4d, g5). You pay per second (Linux) or per hour (Windows) while the instance is running. EC2 also includes features like Auto Scaling Groups to handle traffic spikes, Placement Groups for low-latency clusters, and Spot Instances for up to 90% savings on interruptible workloads. Costs are driven by instance type, running hours, attached EBS storage, data transfer out to the internet, Elastic IPs, and load balancers.",
    scans: ["Running instances and their hourly costs", "Instance type and sizing efficiency", "Reserved Instance coverage gaps", "Idle or underutilized instances", "Stopped instances with attached EBS volumes"]
  },
  "lightsail": {
    desc: "Amazon Lightsail — Simple virtual private servers with bundled pricing.",
    details: "Lightsail is AWS's simplest way to launch a virtual server. Each plan bundles a fixed amount of CPU, RAM, SSD storage, and data transfer into a single predictable monthly price starting at $3.50/month. It comes with pre-configured images for WordPress, LAMP, Node.js, Joomla, Magento, and plain OS installs. Lightsail includes a built-in firewall, static IPs, DNS management, and one-click snapshots for backups. It's designed for developers, students, and small businesses who need a straightforward VPS without the complexity of EC2's hundreds of options. You can also create managed databases (MySQL, PostgreSQL) and container services. The main cost drivers are running instances 24/7, snapshot storage beyond the free tier, and load balancers ($18/month each).",
    scans: ["Active instances and bundles", "Snapshot storage costs", "Static IP allocations", "Load balancer configurations", "Unused or idle instances"]
  },
  "lambda": {
    desc: "AWS Lambda — Run code without provisioning or managing servers.",
    details: "Lambda is AWS's serverless compute service. You upload your code (Python, Node.js, Java, Go, .NET, Ruby, or custom runtimes), and Lambda runs it in response to triggers like HTTP requests via API Gateway, S3 file uploads, DynamoDB stream changes, SQS messages, or scheduled cron events. Lambda automatically provisions the exact amount of compute needed, scales from zero to thousands of concurrent executions in seconds, and shuts down when idle — you pay nothing when your code isn't running. Billing is based on the number of requests ($0.20 per million) and compute duration in 1ms increments, determined by the memory you allocate (128MB to 10GB, which also proportionally scales CPU). Functions can run for up to 15 minutes per invocation. Key cost optimization areas include right-sizing memory allocation (which affects CPU and speed), minimizing cold starts with Provisioned Concurrency, and reducing execution duration through efficient code.",
    scans: ["Function invocation frequency and costs", "Memory allocation vs actual usage", "Provisioned concurrency charges", "Duration and timeout optimization", "Cold start patterns"]
  },
  "s3": {
    desc: "Amazon Simple Storage Service (S3) — Infinitely scalable object storage.",
    details: "S3 stores any amount of data as objects (files) inside buckets (containers). Each object can be up to 5TB in size, and there's no limit on total storage. S3 offers multiple storage classes: S3 Standard for frequently accessed data, S3 Intelligent-Tiering for data with unknown access patterns (automatically moves objects between tiers), S3 Standard-IA and One Zone-IA for infrequent access, S3 Glacier Instant Retrieval, Glacier Flexible Retrieval, and Glacier Deep Archive for long-term archival at the lowest cost. You pay for storage per GB/month, PUT/GET/LIST requests, and data transfer out to the internet. S3 provides 99.999999999% (11 nines) durability by automatically replicating data across multiple facilities. Key features include versioning, lifecycle policies to transition data between classes, server-side encryption, access control via bucket policies and IAM, event notifications, and Cross-Region Replication for disaster recovery.",
    scans: ["Bucket storage classes and volumes", "Lifecycle policy effectiveness", "Versioning overhead analysis", "Cross-region replication costs", "Incomplete multipart uploads"]
  },
  "ebs": {
    desc: "Amazon Elastic Block Store (EBS) — Persistent block storage volumes for EC2.",
    details: "EBS provides network-attached block storage volumes that you attach to EC2 instances, functioning like a physical hard drive or SSD. Volumes persist independently from the instance lifecycle — data remains even after the instance is stopped or terminated (if configured). EBS offers several volume types: gp3/gp2 (General Purpose SSD, balanced price/performance), io2/io1 (Provisioned IOPS SSD, for databases needing consistent low-latency I/O), st1 (Throughput Optimized HDD, for large sequential workloads like data warehouses), and sc1 (Cold HDD, lowest cost for infrequently accessed data). Costs depend on volume type, provisioned size (per GB/month), provisioned IOPS (for io2/io1), throughput, and snapshot storage in S3. Common cost waste comes from unattached volumes left behind after instance termination, oversized volumes with low utilization, and old snapshots that accumulate over time.",
    scans: ["Unattached volume identification", "Volume type optimization (gp2 to gp3 migration)", "Snapshot age and cost analysis", "Provisioned IOPS utilization", "Volume size vs actual usage"]
  },
  "efs": {
    desc: "Amazon Elastic File System (EFS) — Managed NFS file storage for EC2 and containers.",
    details: "EFS is a fully managed, elastic Network File System (NFS) that can be mounted simultaneously by thousands of EC2 instances, ECS containers, EKS pods, and Lambda functions across multiple Availability Zones. Unlike EBS (which attaches to one instance), EFS provides shared file storage that grows and shrinks automatically as you add and remove files — no provisioning required. It supports NFSv4 protocol and POSIX-compliant file access with strong consistency. EFS offers two storage classes: Standard (frequently accessed) and Infrequent Access (IA), with lifecycle management to automatically move files between them. Performance modes include General Purpose (low-latency) and Max I/O (higher throughput for highly parallel workloads). Throughput modes are Bursting (scales with storage size) and Provisioned (set explicit throughput). Costs are $0.30/GB-month for Standard and $0.025/GB-month for IA, making lifecycle policies critical for cost optimization.",
    scans: ["Storage class distribution", "Lifecycle policy effectiveness", "Throughput mode efficiency", "Mount target configurations", "Infrequent Access transition rates"]
  },
  "glacier": {
    desc: "Amazon S3 Glacier — Ultra-low-cost archival storage for long-term data retention.",
    details: "S3 Glacier is a storage class within S3 designed for data archival and long-term backup at extremely low cost. There are three Glacier tiers: Glacier Instant Retrieval ($0.004/GB-month, millisecond retrieval for data accessed once per quarter), Glacier Flexible Retrieval ($0.0036/GB-month, retrieval in 1-5 minutes to 5-12 hours), and Glacier Deep Archive ($0.00099/GB-month, retrieval in 12-48 hours — the cheapest storage in the cloud). Data is stored with 99.999999999% durability across multiple AZs. Glacier is ideal for compliance archives, healthcare records, media assets, financial data, and disaster recovery backups that must be retained for years but rarely accessed. You pay for storage, retrieval requests, data retrieved per GB, and early deletion fees if objects are deleted before the minimum storage duration (90 days for Flexible, 180 days for Deep Archive). Use S3 Lifecycle policies to automatically transition old data to Glacier.",
    scans: ["Archive storage volumes and tiers", "Retrieval request frequency and costs", "Early deletion penalty exposure", "Lifecycle policy transition rates", "Vault lock and compliance settings"]
  },
  "fargate": {
    desc: "AWS Fargate — Serverless compute engine for containers (ECS & EKS).",
    details: "Fargate lets you run Docker containers without provisioning, configuring, or managing the underlying EC2 instances. You define your container's CPU and memory requirements in a task definition, and Fargate handles all the infrastructure: server provisioning, patching, scaling, and security. It works with both ECS (Elastic Container Service) and EKS (Elastic Kubernetes Service). Each task gets its own isolated compute environment with a dedicated ENI (Elastic Network Interface) for VPC networking. Billing is per-second based on vCPU and memory allocated from the time you pull your container image until the task terminates. Pricing is approximately $0.04048/vCPU-hour and $0.004445/GB-hour. Fargate Spot offers up to 70% savings for fault-tolerant workloads that can handle interruptions. Fargate is simpler to operate than EC2-backed containers but typically 13-33% more expensive than well-utilized EC2 clusters.",
    scans: ["Task vCPU and memory allocation", "Spot vs On-Demand usage", "Container resource utilization", "Task run duration analysis", "ECS vs EKS Fargate cost comparison"]
  },
  "rds": {
    desc: "Amazon Relational Database Service (RDS) — Managed SQL databases.",
    details: "RDS runs and manages relational databases in the cloud, supporting six engines: MySQL, PostgreSQL, MariaDB, Oracle, Microsoft SQL Server, and Amazon Aurora. RDS handles time-consuming administration tasks like hardware provisioning, database setup, patching, backups, and monitoring. Multi-AZ deployments provide high availability with synchronous standby replicas and automatic failover (typically under 60 seconds). Read Replicas allow you to scale read-heavy workloads by creating up to 15 asynchronous copies. Storage options include General Purpose SSD (gp3), Provisioned IOPS SSD (io1), and Magnetic. You pay for instance hours (based on instance class like db.t3.medium, db.r6g.xlarge), storage (per GB/month), I/O requests (for some storage types), backup storage beyond the free allocation, and data transfer. Reserved Instances offer up to 69% savings over On-Demand for 1 or 3-year commitments.",
    scans: ["Instance sizing vs actual utilization", "Multi-AZ deployment necessity", "Storage provisioning efficiency", "Backup retention and snapshot costs", "Read replica optimization"]
  },
  "aurora": {
    desc: "Amazon Aurora — High-performance MySQL/PostgreSQL-compatible relational database.",
    details: "Aurora is AWS's cloud-native relational database engine, compatible with MySQL (5x throughput) and PostgreSQL (3x throughput) while being fully managed. Storage automatically grows from 10GB up to 128TB in 10GB increments without downtime. Data is automatically replicated six ways across three Availability Zones for high durability. Aurora supports up to 15 low-latency read replicas with sub-10ms replica lag, automatic failover in under 30 seconds, and continuous incremental backups to S3. Aurora Serverless v2 automatically scales compute capacity up and down based on application demand, from 0.5 to 128 ACUs (Aurora Capacity Units), making it ideal for variable workloads. Costs include instance hours (or ACU-hours for Serverless), storage at $0.10/GB-month, I/O requests at $0.20/million, and backup storage beyond the cluster volume size. Aurora Global Database extends to up to 5 secondary regions with under 1-second replication lag.",
    scans: ["Cluster configurations and costs", "Read replica count optimization", "Serverless capacity unit usage", "Storage I/O patterns", "Backup storage beyond free tier"]
  },
  "dynamodb": {
    desc: "Amazon DynamoDB — Fully managed serverless NoSQL key-value and document database.",
    details: "DynamoDB is a fully managed NoSQL database that delivers single-digit millisecond response times at any scale. It stores data in tables as items (rows) with attributes (columns), accessed via primary keys. DynamoDB handles all infrastructure provisioning, patching, replication, and scaling automatically. Two capacity modes: Provisioned (you specify Read/Write Capacity Units, predictable costs, supports auto-scaling) and On-Demand (pay per request, zero capacity planning, 6-7x more expensive per request but ideal for spiky/unpredictable workloads). DynamoDB Streams captures item-level changes for event-driven architectures. Global Tables provide fully managed multi-region, multi-active replication with sub-second latency. Additional features include Time-to-Live (TTL) for automatic item expiration, Point-in-Time Recovery (PITR), on-demand backups, DynamoDB Accelerator (DAX) for microsecond caching, and PartiQL for SQL-compatible queries. Cost drivers are capacity units/requests, storage ($0.25/GB-month), streams, backups, and global table replication.",
    scans: ["Provisioned vs on-demand efficiency", "Read/write capacity utilization", "Global table replication costs", "Backup and PITR charges", "TTL optimization opportunities"]
  },
  "cloudfront": {
    desc: "Amazon CloudFront — Global content delivery network (CDN) with 400+ edge locations.",
    details: "CloudFront is AWS's CDN that caches and delivers content (web pages, APIs, videos, static assets) from 400+ edge locations worldwide, reducing latency for end users by serving content from the nearest location. When a user requests content, CloudFront routes the request to the closest edge location. If the content is cached there (cache hit), it's served immediately. If not (cache miss), CloudFront fetches it from your origin (S3 bucket, EC2 instance, ALB, or any HTTP server), caches it, and serves it. CloudFront supports HTTPS with free SSL certificates, real-time logs, field-level encryption, geo-restriction, signed URLs/cookies for private content, and Lambda@Edge/CloudFront Functions for running code at the edge. Price Classes let you limit which edge locations are used to reduce costs. You pay for data transfer out ($0.085/GB for first 10TB), HTTP/HTTPS requests, and optional features. Optimizing cache hit ratios is the most impactful cost lever.",
    scans: ["Distribution traffic and costs", "Cache hit ratio analysis", "Origin request frequency", "Price class optimization", "Lambda@Edge invocation costs"]
  },
  "nat-gateway": {
    desc: "AWS NAT Gateway — Managed Network Address Translation for private subnets.",
    details: "NAT Gateway enables instances in private subnets (no public IP) to initiate outbound connections to the internet (e.g., downloading software updates, calling external APIs) while preventing unsolicited inbound connections from the internet. It translates the private IP address to the NAT Gateway's public Elastic IP. NAT Gateway is one of the most common hidden cost drivers on AWS: it charges $0.045/hour (~$32/month) just to exist, plus $0.045/GB for all data processed through it. If you deploy one NAT Gateway per AZ for high availability (best practice), costs multiply: 3 AZs = ~$97/month before any data charges. Alternatives: NAT Instances (cheaper but self-managed, no auto-scaling), VPC Gateway Endpoints (free for S3 and DynamoDB traffic), VPC Interface Endpoints ($0.01/hour but eliminates NAT for specific AWS services), or IPv6 (instances can reach the internet directly via Egress-Only Internet Gateway, no NAT needed).",
    scans: ["Gateway hourly charges", "Data processing volumes", "Multi-AZ redundancy costs", "VPC endpoint alternatives", "Traffic pattern analysis"]
  },
  "elastic-ip": {
    desc: "AWS Elastic IP — Static public IPv4 addresses for dynamic cloud resources.",
    details: "An Elastic IP (EIP) is a static, public IPv4 address that you allocate to your AWS account and can associate with EC2 instances, NAT Gateways, or Network Load Balancers. Unlike regular public IPs (which change when you stop/start an instance), Elastic IPs remain constant, making them essential for DNS records, allowlists, and services requiring a fixed address. EIPs are free when associated with a running EC2 instance, but AWS charges $0.005/hour (~$3.60/month) when an EIP is not associated with any resource or is associated with a stopped instance. Since February 2024, AWS also charges $0.005/hour for all public IPv4 addresses (including those auto-assigned to EC2) due to IPv4 address exhaustion. Common cost waste comes from orphaned EIPs left behind after instance termination and EIPs attached to stopped instances. Regular audits should identify and release unused EIPs.",
    scans: ["Unassociated IP charges", "IP address inventory", "Association with stopped instances", "IPv6 migration opportunities", "Release recommendations"]
  },
  "vpc": {
    desc: "Amazon Virtual Private Cloud (VPC) — Your isolated network in the AWS cloud.",
    details: "VPC lets you create a logically isolated virtual network in AWS where you define IP address ranges (CIDR blocks), subnets (public and private), route tables, internet gateways, and security rules. Think of it as your own private data center network in the cloud. VPC itself is free, but many associated resources have significant costs: NAT Gateways ($0.045/hour + $0.045/GB), Interface VPC Endpoints ($0.01/hour each + $0.01/GB), Transit Gateway attachments ($0.05/hour), VPN connections ($0.05/hour), and inter-AZ data transfer ($0.01/GB each way). Security is controlled at two levels: Security Groups (stateful, instance-level firewall) and Network ACLs (stateless, subnet-level). VPC Peering connects two VPCs with no single point of failure and no bandwidth bottleneck, but data transfer charges apply. Key cost optimization: use Gateway Endpoints (free) for S3/DynamoDB, consolidate NAT Gateways, and architect services within the same AZ to minimize cross-AZ transfer.",
    scans: ["NAT Gateway deployments", "VPC endpoint configurations", "Transit Gateway attachments", "Cross-AZ data transfer", "Peering connection patterns"]
  },
  "api-gateway": {
    desc: "Amazon API Gateway — Create, publish, and manage APIs at any scale.",
    details: "API Gateway is a fully managed service for creating and managing REST APIs, HTTP APIs, and WebSocket APIs. It handles authentication (IAM, Cognito, Lambda authorizers), request throttling, caching, request/response transformation, and API versioning. REST APIs offer the most features (request validation, WAF integration, API keys, usage plans) but cost $3.50/million requests. HTTP APIs are designed for simple proxy use cases and are 71% cheaper at $1.00/million requests with lower latency. WebSocket APIs enable real-time two-way communication (chat, gaming, dashboards) and charge $1.00/million messages plus $0.25/million connection minutes. API Gateway caching ($0.02-$3.80/hour based on cache size) can dramatically reduce backend calls and improve response times. For internal service-to-service communication, consider Lambda Function URLs (free, no API Gateway needed) or Application Load Balancer as cheaper alternatives.",
    scans: ["Request volume and pricing tier", "REST vs HTTP API efficiency", "Cache utilization analysis", "WebSocket connection costs", "Authorization overhead"]
  },
  "ecs": {
    desc: "Amazon Elastic Container Service (ECS) — Fully managed Docker container orchestration.",
    details: "ECS runs and manages Docker containers at scale with deep AWS integration. You define your application as a Task Definition (container image, CPU, memory, networking, volumes) and run it as Tasks (one-off) or Services (long-running with desired count and auto-scaling). ECS supports two launch types: EC2 (you manage the underlying instances, more control, potentially cheaper at scale) and Fargate (serverless, AWS manages infrastructure, simpler but ~13-33% more expensive). ECS itself is completely free — you only pay for the compute (EC2 instances or Fargate vCPU/memory), load balancers, and data transfer. Key features include service discovery, capacity providers, deployment circuit breakers, and integration with CloudWatch, X-Ray, and Secrets Manager. ECS is generally simpler and cheaper than EKS for teams that don't need Kubernetes compatibility, since it has no control plane fee.",
    scans: ["Task and service configurations", "Fargate vs EC2 cost comparison", "Container resource allocation", "Auto-scaling efficiency", "Spot capacity utilization"]
  },
  "eks": {
    desc: "Amazon Elastic Kubernetes Service (EKS) — Managed Kubernetes control plane.",
    details: "EKS runs the Kubernetes control plane across multiple Availability Zones, handling etcd clustering, API server availability, upgrades, and patching. You deploy your containerized applications as Kubernetes pods, managed by deployments, services, and other standard K8s objects. EKS charges $0.10/hour per cluster (~$72/month) regardless of how many pods you run — this is a fixed cost unlike ECS which has no control plane fee. Compute costs come from EC2 instances (managed node groups or self-managed) or Fargate profiles. EKS supports Karpenter for intelligent, just-in-time node provisioning that can significantly reduce compute costs. Additional charges apply for EKS add-ons (CoreDNS, kube-proxy, VPC CNI), load balancers, and data transfer. EKS is best for teams with existing Kubernetes expertise, multi-cloud strategies, or complex microservice architectures that benefit from the K8s ecosystem.",
    scans: ["Cluster management fees", "Node group configurations", "Fargate profile costs", "Add-on service charges", "Cluster consolidation opportunities"]
  },
  "ecr": {
    desc: "Amazon Elastic Container Registry (ECR) — Secure Docker image repository.",
    details: "ECR is a fully managed Docker container image registry that stores, manages, and deploys container images. It integrates natively with ECS, EKS, and Lambda for seamless deployments. ECR encrypts images at rest using KMS, scans images for known software vulnerabilities using Amazon Inspector, supports image signing for supply chain security, and provides lifecycle policies to automatically clean up old images. Public ECR (gallery.ecr.aws) is free for open-source images. Private ECR charges $0.10/GB-month for storage and $0.09/GB for data transfer (free within the same region to ECS/EKS). The biggest cost issue is accumulated old images — without lifecycle policies, your registry grows indefinitely as every CI/CD build pushes new images. Set lifecycle rules to keep only the last N tagged images or delete images older than X days.",
    scans: ["Image storage volumes", "Lifecycle policy configurations", "Vulnerability scan findings", "Cross-region replication costs", "Untagged image cleanup"]
  },
  "sagemaker": {
    desc: "Amazon SageMaker — End-to-end machine learning platform.",
    details: "SageMaker provides every tool needed for machine learning: Jupyter notebook instances for exploration, built-in algorithms and frameworks (TensorFlow, PyTorch, XGBoost) for model building, managed training infrastructure that scales to hundreds of GPUs, and real-time or batch inference endpoints for deployment. SageMaker Studio offers a web-based IDE with experiment tracking, model registry, and MLOps pipelines. Costs accumulate from multiple sources: notebook instances (billed per hour even when idle — stop them!), training jobs (instance hours × instance count), real-time endpoints (always-on, billed per second), and storage (EBS and S3). SageMaker Serverless Inference scales to zero and is ideal for infrequent predictions. Multi-model endpoints host multiple models on a single instance. Spot training can reduce training costs by up to 90%. The most common cost mistake is leaving notebook instances running 24/7 ($50-200+/month each).",
    scans: ["Notebook instance hours", "Training job optimization", "Endpoint hosting efficiency", "Storage and data transfer", "Serverless vs provisioned inference"]
  },
  "bedrock": {
    desc: "Amazon Bedrock — Access leading foundation models for generative AI applications.",
    details: "Bedrock is a fully managed service providing API access to foundation models (FMs) from Anthropic (Claude), Meta (Llama), AI21 Labs, Cohere, Stability AI, Mistral, and Amazon (Titan) — without managing any infrastructure. You send prompts via API and receive model responses. On-Demand pricing charges per token: input tokens (the prompt you send) and output tokens (the model's response). For example, Claude 3 Sonnet costs ~$3/million input tokens and ~$15/million output tokens. Provisioned Throughput provides reserved capacity at a fixed hourly rate for predictable, high-volume workloads. Bedrock also supports fine-tuning (customize models with your data), Knowledge Bases (RAG with your documents), Agents (multi-step task automation), and Guardrails (content filtering). Cost optimization focuses on choosing the right model size for each task (don't use Opus for simple classification), prompt engineering to reduce token count, caching frequent responses, and batching requests.",
    scans: ["Model invocation costs", "Token consumption patterns", "Provisioned Throughput utilization", "Model selection optimization", "Prompt efficiency analysis"]
  },
  "cloudwatch": {
    desc: "Amazon CloudWatch — Monitoring, logging, and observability for AWS resources.",
    details: "CloudWatch is AWS's primary monitoring service that collects metrics, logs, and events from virtually every AWS service. It provides dashboards for visualization, alarms for automated notifications (via SNS) or actions (like EC2 auto-scaling), and Logs Insights for querying log data with a SQL-like syntax. Basic monitoring (5-minute intervals) is free for most services; detailed monitoring (1-minute intervals) costs $0.30/metric/month. Custom metrics cost $0.30/metric/month for the first 10K. Log ingestion is $0.50/GB, and log storage is $0.03/GB-month — this adds up fast with verbose application logging. Dashboards cost $3/month each, and each alarm costs $0.10/standard or $0.30/high-resolution per month. Cost optimization: set log retention periods (default is forever!), use metric filters instead of high-cardinality custom metrics, consolidate dashboards, and use Contributor Insights judiciously ($0.02 per rule-match per log event).",
    scans: ["Custom metric charges", "Log ingestion and storage", "Dashboard widget costs", "Alarm configuration fees", "Log retention optimization"]
  },
  "iam": {
    desc: "AWS Identity and Access Management (IAM) — Control who can access what in your AWS account.",
    details: "IAM is AWS's free service for managing authentication (who are you?) and authorization (what can you do?). It consists of Users (individual people or applications), Groups (collections of users sharing permissions), Roles (temporary credentials assumed by services, applications, or federated users), and Policies (JSON documents defining permissions). IAM supports multi-factor authentication (MFA), password policies, access key rotation, and federation with external identity providers (SAML, OIDC). While IAM itself costs nothing, it's critical for cost governance — overly permissive policies can lead to unauthorized resource creation and surprise bills. Best practices include: principle of least privilege, using IAM Roles instead of long-term access keys, enabling MFA for all human users, regularly auditing unused credentials with IAM Access Analyzer, and implementing Service Control Policies (SCPs) in AWS Organizations for account-wide guardrails.",
    scans: ["Policy complexity analysis", "Role trust relationships", "Access key rotation status", "Unused credentials", "Cross-account access patterns"]
  },
  "kms": {
    desc: "AWS Key Management Service (KMS) — Create and manage cryptographic keys.",
    details: "KMS lets you create, manage, and control encryption keys used to encrypt data across 100+ AWS services (S3, EBS, RDS, DynamoDB, Lambda, etc.) and your own applications. Keys are protected by FIPS 140-2 validated hardware security modules (HSMs). Three key types: AWS Owned Keys (free, AWS manages everything), AWS Managed Keys (free, per-service keys like aws/s3), and Customer Managed Keys ($1/month each plus $0.03 per 10,000 API calls). KMS supports automatic annual key rotation for customer managed keys. For high-throughput encryption, KMS uses envelope encryption: KMS generates a data key, you use that data key to encrypt your data locally, avoiding repeated KMS API calls. Cost optimization includes caching data keys, avoiding unnecessary re-encryption, auditing unused customer managed keys, and using AWS-owned keys where customer control isn't required.",
    scans: ["Customer managed key costs", "API request charges", "Key rotation configurations", "Cross-account key usage", "Key policy audit"]
  },
  "sns": {
    desc: "Amazon Simple Notification Service (SNS) — Pub/sub messaging and mobile notifications.",
    details: "SNS is a fully managed publish/subscribe messaging service that delivers messages from publishers to multiple subscribers simultaneously. When a message is published to an SNS Topic, it's automatically pushed to all subscribed endpoints: SQS queues (for decoupling), Lambda functions (for processing), HTTP/HTTPS webhooks, email addresses, SMS text messages, and mobile push notifications (APNs, FCM). This fan-out pattern is fundamental to event-driven architectures. Publishing costs $0.50/million requests. Delivery to Lambda and SQS is free. HTTP delivery costs $0.60/million. SMS pricing varies dramatically by country ($0.00645/message in the US, much more internationally) and is the primary cost risk. Mobile push is $0.50/million. SNS also supports FIFO topics for strict ordering with exactly-once delivery to SQS FIFO queues. Message filtering lets subscribers receive only messages matching specific attribute patterns.",
    scans: ["Message delivery costs", "SMS pricing by destination", "Topic subscription optimization", "Delivery retry configuration", "Alternative service evaluation"]
  },
  "sqs": {
    desc: "Amazon Simple Queue Service (SQS) — Fully managed message queuing.",
    details: "SQS provides reliable, scalable message queuing for decoupling application components. Producers send messages to a queue, and consumers poll and process them asynchronously. This prevents component failures from cascading and handles traffic bursts by buffering messages. Two queue types: Standard Queues offer nearly unlimited throughput with at-least-once delivery (occasional duplicates) and best-effort ordering ($0.40/million requests, first 1M free/month). FIFO Queues guarantee exactly-once processing and strict ordering at $0.50/million requests (300 messages/second, 3000 with batching). Messages can be up to 256KB and retained for 1-14 days (default 4). Long Polling reduces empty receives and costs by waiting up to 20 seconds for messages. Batch operations (up to 10 messages per API call) reduce costs by 10x. Dead-Letter Queues capture messages that fail processing after a configurable number of attempts. SQS pairs naturally with Lambda (event source mapping) and SNS (fan-out pattern).",
    scans: ["Request pricing analysis", "FIFO vs Standard efficiency", "Message retention periods", "Dead-letter queue usage", "Batch operation optimization"]
  },
  "elasticache": {
    desc: "Amazon ElastiCache — Managed in-memory caching with Redis or Memcached.",
    details: "ElastiCache deploys, operates, and scales in-memory data stores (Redis or Memcached) for microsecond-latency data access. Common use cases include database query caching (reduce load on RDS/Aurora), session storage (stateless web servers), real-time leaderboards, rate limiting, and pub/sub messaging. Redis (recommended for most use cases) supports data persistence, replication, automatic failover, Cluster Mode for horizontal scaling across multiple shards, and rich data types (strings, hashes, lists, sets, sorted sets, streams). Memcached is simpler and offers multi-threaded performance for basic key-value caching. You pay for node-hours based on instance type (e.g., cache.r6g.large). Reserved Nodes offer up to 55% savings for 1-3 year commitments. Data Tiering (Redis) moves less-frequently-accessed data to SSD, reducing costs for large datasets. ElastiCache Serverless provides instant scaling with pay-per-use pricing, eliminating capacity planning.",
    scans: ["Node type efficiency", "Cluster mode configurations", "Reserved node coverage", "Data tiering opportunities", "Memory utilization analysis"]
  },
  "redshift": {
    desc: "Amazon Redshift — Petabyte-scale cloud data warehouse.",
    details: "Redshift is a fully managed data warehouse that runs complex analytical SQL queries across petabytes of structured data using massively parallel processing (MPP). It uses columnar storage, which dramatically improves query performance and compression for analytics workloads compared to row-based databases. Redshift RA3 nodes separate compute from storage: compute scales independently via adding/removing nodes, while data is stored in Redshift Managed Storage (backed by S3) at $0.024/GB-month. Redshift Serverless automatically provisions and scales capacity, charging per Redshift Processing Unit (RPU)-hour. Redshift Spectrum queries data directly in S3 without loading it ($5/TB scanned), extending your warehouse to your data lake. Concurrency Scaling adds temporary cluster capacity during peak demand (1 hour free/day per cluster). Reserved Instances provide up to 75% savings. Common optimizations include sort keys, distribution keys, VACUUM/ANALYZE operations, and workload management (WLM) queues.",
    scans: ["Cluster node utilization", "Concurrency scaling costs", "Spectrum query optimization", "Reserved instance coverage", "Workload management analysis"]
  },
  "athena": {
    desc: "Amazon Athena — Serverless interactive SQL queries on data in S3.",
    details: "Athena lets you query data stored in S3 using standard ANSI SQL without setting up any servers or databases. Point Athena at your S3 data, define a schema (via AWS Glue Data Catalog or DDL), and start querying. You pay $5 per TB of data scanned — no infrastructure, no upfront costs, no idle charges. This makes cost optimization critical: using columnar formats like Apache Parquet or ORC (vs CSV/JSON) reduces data scanned by 30-90% and dramatically improves performance. Partitioning data by common query filters (date, region, etc.) lets Athena skip irrelevant files entirely. Compressing data (Snappy, GZIP, ZSTD) further reduces scan size. Workgroups let you set per-query data scan limits to prevent runaway costs. Query Result Reuse caches results for identical queries. Athena also supports federated queries to databases (RDS, DynamoDB, Redshift) via Lambda connectors, ACID transactions via Apache Iceberg tables, and machine learning integration via SageMaker.",
    scans: ["Data scanned per query", "Columnar format adoption", "Partition strategy effectiveness", "Workgroup configurations", "Query result caching"]
  },
  "glue": {
    desc: "AWS Glue — Serverless ETL (Extract, Transform, Load) and data cataloging.",
    details: "Glue is a fully managed service for preparing and loading data for analytics. It has three main components: (1) Glue Data Catalog — a central metadata repository that stores table definitions, schemas, and partition information for data in S3, RDS, Redshift, and more, serving as the schema layer for Athena, Redshift Spectrum, and EMR. (2) Glue ETL Jobs — serverless Apache Spark jobs that extract data from sources, transform it (clean, deduplicate, convert formats), and load it into targets. Jobs are measured in Data Processing Units (DPUs) at $0.44/DPU-hour. (3) Glue Crawlers — automatically scan data sources to infer schemas and populate the Data Catalog, billed per DPU-second. Additional features include Glue Studio (visual ETL designer), Glue DataBrew (no-code data preparation), and Glue Streaming ETL for real-time data. Cost optimization: use auto-scaling, choose appropriate worker types, enable job bookmarks to process only new data, limit crawler scope, and schedule crawlers less frequently.",
    scans: ["DPU hour consumption", "Crawler run frequency", "Job bookmark efficiency", "Worker type optimization", "Development endpoint costs"]
  },
  "kinesis": {
    desc: "Amazon Kinesis — Real-time streaming data ingestion and processing.",
    details: "Kinesis enables you to collect, process, and analyze real-time data streams — clickstreams, IoT telemetry, application logs, social media feeds — as they arrive, not hours later in batch. Three main services: (1) Kinesis Data Streams — you manage capacity via shards. Each shard handles 1MB/sec input, 2MB/sec output. Costs $0.015/shard-hour plus $0.014/million PUT payload units. Enhanced Fan-Out ($0.015/consumer-shard-hour) gives each consumer dedicated 2MB/sec throughput. (2) Kinesis Data Firehose — fully managed delivery to S3, Redshift, OpenSearch, or HTTP endpoints with no shard management. Charges per GB ingested ($0.029/GB first 500TB). (3) Kinesis Data Analytics — runs SQL or Apache Flink on streams in real-time at $0.11/KPU-hour. Cost optimization: right-size shards to actual throughput, use Firehose when you just need delivery without custom processing, batch producer records, and set appropriate data retention (default 24h, up to 365 days at additional cost).",
    scans: ["Shard hour charges", "Enhanced fan-out costs", "Data retention periods", "Consumer application efficiency", "Producer batching optimization"]
  },
  "cost-explorer": {
    desc: "AWS Cost Explorer — Visualize, analyze, and forecast your AWS spending.",
    details: "Cost Explorer is AWS's built-in cost analysis tool that provides interactive charts and reports to understand where your money goes. You can filter and group costs by service, account, region, tag, instance type, usage type, and more. It shows trends over time, enabling you to spot anomalies and growth patterns. The Cost Explorer console (UI) is free. API access costs $0.01/paginated request, which can add up with automated cost reporting scripts. Cost Explorer includes several powerful features: (1) Rightsizing Recommendations — analyzes EC2 CloudWatch metrics to suggest downsizing or termination of underutilized instances. (2) Savings Plans Recommendations — models your historical usage to recommend optimal Savings Plan commitments. (3) Reserved Instance Recommendations — suggests RI purchases based on usage patterns. (4) Cost Anomaly Detection — uses ML to identify unusual spending. Hourly granularity provides detailed cost breakdowns but consumes more API calls.",
    scans: ["API request charges", "Savings Plans recommendations", "Reserved Instance analysis", "Anomaly detection alerts", "Rightsizing recommendations"]
  },
  "budgets": {
    desc: "AWS Budgets — Set custom cost and usage budgets with automated alerts.",
    details: "AWS Budgets lets you set custom budgets for costs, usage, reservations, and Savings Plans, then receive alerts when actual or forecasted spending crosses your thresholds. You can track at the account, service, tag, or linked-account level. The first two budgets are free; additional budgets cost $0.02/day (~$0.62/month). Budget Actions can automatically enforce controls when thresholds are exceeded — for example, applying an IAM policy that denies EC2 launches, stopping specific instances, or applying Service Control Policies. Configure multiple alert thresholds (e.g., 50%, 80%, 100%, 120%) for early warning of cost trajectories. Budgets integrates with SNS for notifications and AWS Chatbot for Slack/Teams alerts. Combine with Cost Allocation Tags for granular department, project, or team budgets. Budget Reports can be emailed daily, weekly, or monthly to stakeholders.",
    scans: ["Budget action configurations", "Alert threshold settings", "Forecasting accuracy", "Cost allocation tags", "Action automation setup"]
  },
  "savings-plans": {
    desc: "AWS Savings Plans — Commit to consistent compute usage for up to 72% savings.",
    details: "Savings Plans are a flexible pricing model offering lower prices in exchange for committing to a consistent amount of compute usage (measured in $/hour) for 1 or 3 years. Two types: (1) Compute Savings Plans — apply to any EC2 instance (regardless of family, size, OS, tenancy, or region), Fargate tasks, and Lambda functions. Maximum flexibility, up to 66% savings. (2) EC2 Instance Savings Plans — locked to a specific instance family in a specific region (e.g., m5 in us-east-1) but offer slightly deeper discounts, up to 72%. Plans apply automatically to matching usage, with any usage above your commitment billed at On-Demand rates. Unlike Reserved Instances, Savings Plans don't provide capacity reservation. SageMaker Savings Plans are also available for ML workloads. Key: monitor your commitment utilization — any unused commitment is lost (you still pay for it). AWS Cost Explorer's Savings Plans recommendations analyze your historical usage to suggest optimal commitment levels.",
    scans: ["Commitment utilization rates", "Coverage recommendations", "Compute vs EC2 plan comparison", "Expiration tracking", "Underutilization analysis"]
  },
  "reserved-instances": {
    desc: "AWS Reserved Instances — Reserve capacity for 1-3 years at significant discounts.",
    details: "Reserved Instances (RIs) provide a billing discount (up to 75% vs On-Demand) and optional capacity reservation for specific instance types. RIs are available for EC2, RDS, ElastiCache, OpenSearch, Redshift, and DynamoDB (reserved capacity). Two RI types: (1) Standard RIs — largest discount but locked to specific instance type, platform, and tenancy. Can be sold on the RI Marketplace if no longer needed. (2) Convertible RIs — smaller discount but can be exchanged for different instance types, OS, or tenancy within the same family. Payment options: All Upfront (biggest discount), Partial Upfront (balance of savings and cash flow), and No Upfront (smallest discount, pay monthly). RIs apply automatically to matching running instances in the same account (or across linked accounts with RI sharing enabled). Important: RIs represent a commitment — unused RIs still cost money. For new workloads, Savings Plans often provide better flexibility. Use Cost Explorer's RI utilization reports to ensure you're getting value from your reservations.",
    scans: ["Utilization percentages", "Modification opportunities", "Marketplace listing potential", "Convertible exchange options", "Expiration planning"]
  },
  "batch": {
    desc: "AWS Batch — Managed batch computing that dynamically provisions optimal compute.",
    details: "AWS Batch enables you to run hundreds of thousands of batch computing jobs (data processing, analytics, ML training, video encoding) without installing or managing batch computing software or server clusters. You submit jobs to queues, define compute requirements (vCPU, memory, GPU), and Batch dynamically provisions the optimal quantity and type of EC2 instances (including Spot Instances for up to 90% savings) based on the volume and requirements of the jobs submitted. Batch handles job scheduling, retry logic, and dependency management. You pay only for the underlying EC2 or Fargate resources used, with no additional charge for the Batch service itself. Cost optimization involves using Spot Instances for fault-tolerant workloads, right-sizing compute environments, and using multi-node parallel jobs for tightly coupled HPC workloads.",
    scans: ["Compute environment utilization", "Spot vs On-Demand job costs", "Job queue efficiency", "Resource allocation optimization", "Failed job retry costs"]
  },
  "elastic-beanstalk": {
    desc: "AWS Elastic Beanstalk — Deploy and manage web applications without infrastructure hassle.",
    details: "Elastic Beanstalk is a Platform-as-a-Service (PaaS) that deploys, scales, and manages web applications and services. You upload your code (Java, .NET, PHP, Node.js, Python, Ruby, Go, Docker), and Beanstalk automatically handles capacity provisioning, load balancing, auto-scaling, health monitoring, and application deployment. Under the hood, it creates and manages EC2 instances, Elastic Load Balancers, Auto Scaling Groups, and optionally RDS databases. Beanstalk itself is free — you only pay for the underlying AWS resources it provisions. It supports multiple environments (dev, staging, production) and deployment strategies (rolling, immutable, blue/green). Cost risk comes from over-provisioned environments: Beanstalk may create larger instances or more resources than needed if not configured carefully.",
    scans: ["Environment resource allocation", "Instance type and count", "Load balancer costs", "Auto-scaling configurations", "Idle environment detection"]
  },
  "app-runner": {
    desc: "AWS App Runner — Fully managed container application service.",
    details: "App Runner is the simplest way to deploy containerized web applications and APIs on AWS. Point it at your source code repository or container image, and App Runner automatically builds, deploys, scales, and load-balances your application with built-in HTTPS encryption. No infrastructure to manage, no Dockerfiles required (for source-based deployments). It auto-scales from a minimum number of instances to handle traffic spikes and can scale to zero (paused state at $0.007/GB-memory/hour). Active instances cost $0.064/vCPU-hour and $0.007/GB-memory/hour. App Runner is ideal for web APIs, microservices, and front-end applications that don't need the complexity of ECS/EKS. Costs are driven by minimum instance count (even when idle), active compute, and automatic scaling configuration.",
    scans: ["Service instance configurations", "Auto-scaling utilization", "Pause/resume patterns", "Build and deploy frequency", "Minimum instance costs"]
  },
  "app-mesh": {
    desc: "AWS App Mesh — Service mesh for microservices observability and traffic management.",
    details: "App Mesh is a service mesh that provides application-level networking so your microservices can communicate with each other reliably. It uses Envoy proxy sidecars deployed alongside each service to manage traffic routing, load balancing, circuit breaking, retries, and observability (metrics, traces, logs) without changing application code. App Mesh works with ECS, EKS, Fargate, EC2, and Kubernetes on-premises. The service itself is free — you pay only for the compute resources running the Envoy proxy sidecars (CPU/memory overhead per container). App Mesh integrates with CloudWatch, X-Ray, and third-party tools for observability. Cost considerations include the additional CPU/memory consumed by the Envoy sidecar in every task/pod.",
    scans: ["Envoy proxy resource overhead", "Virtual service configurations", "Traffic routing efficiency", "Retry and timeout settings", "Observability integration costs"]
  },
  "fsx": {
    desc: "Amazon FSx — Fully managed high-performance file systems.",
    details: "FSx provides fully managed file systems optimized for specific workloads: (1) FSx for Windows File Server — native Windows SMB file shares with Active Directory integration, ideal for Windows-based applications, home directories, and content management. (2) FSx for Lustre — high-performance parallel file system for compute-intensive workloads like machine learning training, HPC simulations, and media processing, delivering sub-millisecond latencies and hundreds of GB/s throughput. (3) FSx for NetApp ONTAP — multi-protocol (NFS, SMB, iSCSI) with advanced data management. (4) FSx for OpenZFS — high-performance NFS with snapshots and cloning. Costs depend on storage capacity, throughput, IOPS, and backup storage. FSx for Lustre can link directly to S3 for transparent data access, making it ideal for temporary compute clusters that process S3 data.",
    scans: ["File system capacity utilization", "Throughput and IOPS provisioning", "Backup storage costs", "Data deduplication savings", "Idle file system identification"]
  },
  "s3-glacier": {
    desc: "Amazon S3 Glacier — Ultra-low-cost archival storage for rarely accessed data.",
    details: "S3 Glacier is the archive-tier storage within S3, designed for data that is accessed infrequently but must be retained for months, years, or decades. Three sub-tiers: (1) Glacier Instant Retrieval — $0.004/GB-month with millisecond retrieval, ideal for data accessed once per quarter. (2) Glacier Flexible Retrieval — $0.0036/GB-month with retrieval in 1-5 minutes (Expedited), 3-5 hours (Standard), or 5-12 hours (Bulk/free). (3) Glacier Deep Archive — $0.00099/GB-month (cheapest storage in all of AWS), retrieval in 12 hours (Standard) or 48 hours (Bulk). All tiers provide 99.999999999% durability. Objects have minimum storage durations (90 days for Instant/Flexible, 180 days for Deep Archive) — deleting earlier incurs pro-rated charges. Use S3 Lifecycle policies to automatically transition objects from Standard to Glacier based on age. Vault Lock provides write-once-read-many (WORM) compliance.",
    scans: ["Archive storage tier distribution", "Retrieval frequency and costs", "Early deletion penalty exposure", "Lifecycle transition effectiveness", "Vault Lock compliance settings"]
  },
  "storage-gateway": {
    desc: "AWS Storage Gateway — Hybrid cloud storage bridging on-premises and AWS.",
    details: "Storage Gateway connects your on-premises data center to AWS cloud storage, providing seamless integration with S3, S3 Glacier, and EBS. Three gateway types: (1) S3 File Gateway — presents an NFS/SMB file interface that stores files as S3 objects, with a local cache for low-latency access to recently used data. (2) Volume Gateway — presents iSCSI block storage volumes backed by S3, available as cached volumes (primary data in S3, hot data cached locally) or stored volumes (primary data local, async backup to S3). (3) Tape Gateway — presents a virtual tape library (VTL) interface for backup applications like Veeam, Veritas, NetBackup. Costs include gateway VM/hardware appliance, S3/Glacier storage, and data transfer. Storage Gateway is ideal for cloud backup, disaster recovery, and tiering on-premises data to AWS.",
    scans: ["Gateway type configurations", "Cache hit ratio analysis", "Storage volume utilization", "Data transfer patterns", "Backup and archival costs"]
  },
  "aws-backup": {
    desc: "AWS Backup — Centralized backup management across AWS services.",
    details: "AWS Backup provides a single, centralized console to manage and automate backups across EC2, EBS, RDS, Aurora, DynamoDB, EFS, FSx, Storage Gateway, and more. You create Backup Plans (schedules, retention rules, lifecycle transitions) and assign resources via tags or resource IDs. Features include cross-region backup copies for disaster recovery, cross-account backup for organizational resilience, Backup Vault Lock for immutable backups (WORM compliance), and point-in-time recovery. Costs depend on backup storage per GB/month (varies by service), data restored, and cross-region data transfer. The service itself is free — you pay only for the backup storage consumed. Common cost waste includes excessive retention periods, backing up non-critical resources, and not transitioning old backups to cold storage.",
    scans: ["Backup storage volumes by service", "Retention policy optimization", "Cross-region copy costs", "Vault Lock configurations", "Restore test frequency"]
  },
  "neptune": {
    desc: "Amazon Neptune — Managed graph database for highly connected datasets.",
    details: "Neptune is a fully managed graph database service optimized for storing and querying billions of relationships with millisecond latency. It supports two graph models: (1) Property Graph with Apache TinkerPop Gremlin traversal language, and (2) RDF (Resource Description Framework) with SPARQL query language. Common use cases include social networks (friend-of-friend queries), fraud detection (finding suspicious transaction patterns), recommendation engines, knowledge graphs, network management, and identity resolution. Neptune stores data across 3 AZs with 6-way replication, supports up to 15 read replicas, and provides continuous backup to S3. Neptune Serverless automatically scales based on workload. Costs include instance hours (or NCUs for Serverless), storage ($0.10/GB-month), I/O requests ($0.20/million), and backup storage beyond cluster volume.",
    scans: ["Instance sizing vs query patterns", "Serverless capacity utilization", "Storage and I/O costs", "Read replica optimization", "Backup retention analysis"]
  },
  "documentdb": {
    desc: "Amazon DocumentDB — Managed MongoDB-compatible document database.",
    details: "DocumentDB is a fully managed document database service that is compatible with MongoDB 3.6, 4.0, and 5.0 workloads. It stores data as JSON-like documents with flexible schemas, making it ideal for content management, catalogs, user profiles, and mobile backends. Under the hood, DocumentDB uses a purpose-built distributed storage engine similar to Aurora, with 6-way replication across 3 AZs and automatic storage scaling up to 128TB. It supports up to 15 read replicas with millisecond replication lag, automatic failover, continuous backup to S3, and point-in-time recovery. Costs include instance hours, I/O requests ($0.20/million), storage ($0.10/GB-month), and backup storage beyond cluster volume. DocumentDB Elastic Clusters provide serverless horizontal scaling. Note: DocumentDB is not a direct MongoDB replacement — some MongoDB features (e.g., certain aggregation stages) may differ.",
    scans: ["Instance utilization analysis", "Elastic Cluster scaling patterns", "Storage and I/O optimization", "Read replica efficiency", "Backup retention costs"]
  },
  "route-53": {
    desc: "Amazon Route 53 — Scalable DNS, domain registration, and health checking.",
    details: "Route 53 is AWS's Domain Name System (DNS) service that translates human-readable domain names (example.com) into IP addresses. It provides three functions: (1) Domain Registration — purchase and manage domain names directly through AWS. (2) DNS Hosting — host DNS records (A, AAAA, CNAME, MX, TXT, etc.) in Hosted Zones. Public hosted zones cost $0.50/month plus $0.40/million standard queries. (3) Health Checks — monitor endpoint availability and route traffic away from unhealthy resources ($0.50-$0.75/month per check, plus optional string matching). Route 53 supports advanced routing: Weighted (A/B testing), Latency-based (nearest region), Geolocation, Geoproximity, Failover (active-passive DR), and Multi-Value Answer. Route 53 Resolver enables DNS resolution between VPCs and on-premises networks. DNSSEC signing provides authentication for DNS responses.",
    scans: ["Hosted zone charges", "Query volume and costs", "Health check configurations", "Routing policy optimization", "Domain registration renewals"]
  },
  "direct-connect": {
    desc: "AWS Direct Connect — Dedicated private network connection to AWS.",
    details: "Direct Connect establishes a dedicated, private network connection between your data center (or office) and AWS, bypassing the public internet. This provides consistent network performance with lower latency, higher bandwidth, and reduced data transfer costs compared to internet-based VPN connections. Connections are available at 1Gbps, 10Gbps, and 100Gbps at AWS Direct Connect locations (colocation facilities) worldwide. Hosted connections offer sub-1Gbps ports (50Mbps to 500Mbps). Data transfer over Direct Connect costs significantly less than internet transfer: ~$0.02/GB vs $0.09/GB for most regions. Costs include port-hours ($0.30/hour for 1Gbps), data transfer out, and partner/colocation fees. Direct Connect Gateway enables connecting to VPCs in multiple regions through a single connection. SiteLink enables direct site-to-site communication through AWS backbone.",
    scans: ["Port utilization percentages", "Data transfer volume and savings", "Connection redundancy setup", "Virtual interface configurations", "Partner and colocation fees"]
  },
  "global-accelerator": {
    desc: "AWS Global Accelerator — Improve availability and performance using AWS global network.",
    details: "Global Accelerator provides two static anycast IP addresses that serve as a fixed entry point to your application, routing user traffic through AWS's global network (instead of the congested public internet) to the optimal healthy endpoint in the nearest AWS Region. This improves performance by up to 60% for TCP/UDP traffic by avoiding internet congestion, packet loss, and variable routing. It supports automatic failover between endpoints (ALBs, NLBs, EC2 instances, Elastic IPs) across multiple AWS Regions with health checking. You pay $0.025/hour per accelerator (~$18/month) plus a premium on data transfer ($0.015-$0.035/GB depending on source region). Global Accelerator is ideal for global applications requiring low latency, gaming, IoT, VoIP, and any workload where consistent network performance matters more than raw cost.",
    scans: ["Accelerator hourly charges", "Data transfer premiums", "Endpoint health and routing", "Traffic dial configurations", "Regional distribution patterns"]
  },
  "codecommit": {
    desc: "AWS CodeCommit — Managed private Git repositories.",
    details: "CodeCommit hosts secure, scalable, private Git repositories in the AWS cloud. It's a fully managed source control service that eliminates the need to run your own Git server. CodeCommit stores your code, binaries, and metadata with encryption at rest (KMS) and in transit (HTTPS/SSH). It supports all standard Git commands, pull requests with approval rules, branch policies, and notifications via SNS. The free tier includes 5 active users, 50GB storage, and 10,000 Git requests/month. Beyond that, each additional user costs $1/month. CodeCommit integrates natively with CodePipeline, CodeBuild, and CodeDeploy for CI/CD. However, note that AWS announced CodeCommit is no longer accepting new customers as of July 2024 — existing users can continue, but new projects should consider GitHub, GitLab, or Bitbucket.",
    scans: ["Repository storage volumes", "Active user counts", "Git request volumes", "Branch and PR activity", "Migration assessment"]
  },
  "codebuild": {
    desc: "AWS CodeBuild — Fully managed continuous integration build service.",
    details: "CodeBuild compiles source code, runs tests, and produces deployable artifacts — all without managing build servers. It provides pre-configured build environments for popular languages (Java, Python, Node.js, Go, Ruby, .NET, PHP) and supports custom Docker images for any toolchain. CodeBuild scales automatically, running multiple builds concurrently so builds are never queued. Pricing is per build-minute based on compute type: general1.small ($0.005/min), general1.medium ($0.01/min), general1.large ($0.02/min), and GPU instances for ML builds. The free tier includes 100 build-minutes/month of general1.small. CodeBuild supports build caching (S3 or local) to speed up subsequent builds, build badges for status indicators, and report groups for test results. It integrates with CodePipeline, GitHub, Bitbucket, and CodeCommit as source providers.",
    scans: ["Build minute consumption", "Compute type optimization", "Cache hit effectiveness", "Concurrent build patterns", "Failed build analysis"]
  },
  "codedeploy": {
    desc: "AWS CodeDeploy — Automated application deployment to EC2, Fargate, Lambda, and on-premises.",
    details: "CodeDeploy automates software deployments to Amazon EC2, AWS Fargate, AWS Lambda, and on-premises servers, eliminating error-prone manual deployments. It supports multiple deployment strategies: In-place (update instances sequentially), Blue/Green (provision new environment, shift traffic, terminate old), Canary (route small percentage first), and Linear (shift in equal increments). CodeDeploy provides automatic rollback if deployment fails health checks, deployment hooks for custom validation scripts, and integration with Auto Scaling Groups to deploy to new instances automatically. The service is free for EC2 and Lambda deployments. On-premises deployments cost $0.02 per on-premises instance update. CodeDeploy works with CodePipeline for end-to-end CI/CD and supports deployment configuration with minimum healthy hosts and traffic routing controls.",
    scans: ["Deployment frequency and patterns", "Rollback occurrence rates", "Instance update costs", "Deployment strategy efficiency", "On-premises deployment charges"]
  },
  "codepipeline": {
    desc: "AWS CodePipeline — Continuous delivery service for automated release pipelines.",
    details: "CodePipeline orchestrates the steps required to release software changes continuously. A pipeline consists of stages (Source, Build, Test, Deploy, Approval) with actions in each stage that integrate with CodeCommit/GitHub/Bitbucket (source), CodeBuild/Jenkins (build), CodeDeploy/ECS/CloudFormation/S3 (deploy), and manual approval gates. Each pipeline costs $1/month for the first active pipeline (free tier), then $1/month per additional active pipeline. A pipeline is 'active' if it has at least one code change run through it during the month. Pipelines that exist but don't execute are free. CodePipeline supports cross-account and cross-region deployments, parallel actions within stages, and automatic triggering on source code changes. It pairs naturally with the full AWS developer tools suite but also integrates with third-party tools.",
    scans: ["Active pipeline count", "Execution frequency", "Stage duration analysis", "Failed pipeline rates", "Cross-region action costs"]
  },
  "cloud9": {
    desc: "AWS Cloud9 — Cloud-based integrated development environment (IDE).",
    details: "Cloud9 is a browser-based IDE that lets you write, run, and debug code from any machine with a web browser. It includes a code editor with syntax highlighting, an integrated terminal with AWS CLI pre-configured, and built-in debugging for Node.js, Python, and PHP. Cloud9 environments run on EC2 instances that you control — you choose the instance type and can auto-hibernate the instance after a period of inactivity (30 minutes by default) to save costs. The Cloud9 service itself is free; you pay only for the underlying EC2 instance and EBS storage. It supports real-time collaborative editing where multiple developers can code together simultaneously. Cloud9 is useful for Lambda function development with local testing, pair programming, and consistent development environments across teams. The main cost risk is forgetting to set auto-hibernate and leaving instances running 24/7.",
    scans: ["EC2 instance utilization", "Auto-hibernate configuration", "EBS storage costs", "Environment activity patterns", "Idle environment detection"]
  },
  "cloudshell": {
    desc: "AWS CloudShell — Browser-based shell with pre-authenticated AWS CLI.",
    details: "CloudShell provides a browser-based Linux shell environment directly in the AWS Management Console, pre-installed with AWS CLI v2, Python, Node.js, and common tools (git, make, pip, npm). It automatically authenticates with your console session credentials — no need to configure access keys. Each user gets 1GB of persistent home directory storage per region that survives session restarts. CloudShell is completely free — there are no additional charges beyond your standard AWS account. Sessions time out after 20 minutes of inactivity. CloudShell supports file upload/download (up to 1GB), safe paste for multi-line commands, and multiple concurrent tabs. It's ideal for quick AWS CLI operations, running scripts, and administrative tasks without setting up a local development environment.",
    scans: ["Usage patterns and regions", "Persistent storage utilization", "Session duration analysis", "Script execution frequency", "No direct cost — free service"]
  },
  "x-ray": {
    desc: "AWS X-Ray — Distributed tracing for debugging and analyzing microservices.",
    details: "X-Ray helps you understand how your application and its underlying services are performing by tracing requests as they travel through distributed systems. When a request enters your application (e.g., via API Gateway), X-Ray assigns a trace ID and tracks the request through each service it touches (Lambda, ECS, EC2, DynamoDB, SQS, SNS, etc.), recording timing, errors, and metadata at each hop. The X-Ray console displays a Service Map showing your application's architecture and a timeline view of individual traces. This makes it easy to identify performance bottlenecks, find the root cause of errors, and understand service dependencies. X-Ray charges $5/million traces recorded and $0.50/million traces retrieved. The free tier includes 100,000 traces recorded and 1,000,000 traces retrieved per month. X-Ray integrates with CloudWatch for unified observability.",
    scans: ["Trace recording volumes", "Sampling rate configurations", "Service map complexity", "Error and fault rates", "Trace storage costs"]
  },
  "cloudformation": {
    desc: "AWS CloudFormation — Infrastructure as Code using declarative templates.",
    details: "CloudFormation lets you model and provision AWS resources using YAML or JSON templates. You describe the desired state of your infrastructure (EC2 instances, VPCs, databases, IAM roles, etc.) in a template, and CloudFormation creates and configures those resources as a 'stack.' When you update a template, CloudFormation determines what changes are needed and applies them safely using change sets, with automatic rollback if anything fails. CloudFormation itself is free — you pay only for the AWS resources it creates. It supports nested stacks for modular templates, stack sets for deploying across multiple accounts/regions, drift detection to identify manual changes, and custom resources via Lambda for extending template capabilities. StackSets enable organization-wide deployments. The registry supports third-party resource types.",
    scans: ["Stack resource inventory", "Drift detection results", "Nested stack complexity", "Failed stack operations", "Template resource optimization"]
  },
  "config": {
    desc: "AWS Config — Track and evaluate AWS resource configurations over time.",
    details: "AWS Config continuously records the configuration of your AWS resources and evaluates them against desired settings using Config Rules. Every time a resource is created, modified, or deleted, Config captures a configuration item showing the full state. This provides a complete configuration history — you can see what a resource looked like at any point in time, who changed it, and what changed. Config Rules (managed or custom via Lambda) automatically evaluate whether configurations comply with policies (e.g., 'all EBS volumes must be encrypted,' 'security groups must not allow 0.0.0.0/0 on port 22'). Non-compliant resources are flagged and can trigger automatic remediation via Systems Manager. Costs: $0.003/configuration item recorded, $0.001/Config Rule evaluation per region. At scale, these charges add up — optimize by recording only relevant resource types and limiting rule evaluation frequency.",
    scans: ["Configuration recording costs", "Rule evaluation frequency", "Non-compliant resource count", "Remediation action effectiveness", "Resource type recording scope"]
  },
  "systems-manager": {
    desc: "AWS Systems Manager — Unified operational management for AWS resources.",
    details: "Systems Manager (SSM) is a suite of tools for managing your EC2 instances and on-premises servers at scale. Key capabilities: (1) Session Manager — secure shell access to instances without SSH keys, bastion hosts, or open inbound ports. (2) Run Command — execute commands across fleets of instances. (3) Patch Manager — automate OS and application patching. (4) Parameter Store — centralized, versioned configuration storage (free for standard parameters, $0.05/10K advanced parameter API calls). (5) State Manager — define and enforce desired instance configurations. (6) Automation — create runbooks for common operational tasks. (7) Inventory — collect metadata about instances. Most SSM features are free — you pay only for advanced Parameter Store parameters, Automation steps beyond the free tier, and on-premises instance management ($5/instance/month). SSM Agent is pre-installed on most Amazon AMIs.",
    scans: ["Parameter Store usage and tier", "Automation step charges", "On-premises management fees", "Patch compliance status", "Session Manager adoption"]
  },
  "trusted-advisor": {
    desc: "AWS Trusted Advisor — Best practice recommendations across five categories.",
    details: "Trusted Advisor inspects your AWS environment and provides real-time recommendations across five categories: (1) Cost Optimization — idle resources, underutilized instances, unassociated Elastic IPs, idle load balancers. (2) Security — open security groups, MFA not enabled on root, exposed access keys. (3) Fault Tolerance — insufficient AZ redundancy, missing backups, unhealthy instances. (4) Performance — over-provisioned resources, CloudFront optimization, high-utilization instances. (5) Service Limits — usage approaching AWS account limits. Basic and Developer support plans get 7 core checks for free (S3 bucket permissions, security groups, IAM use, MFA on root, EBS snapshots, RDS snapshots, service limits). Business and Enterprise support plans unlock all 100+ checks, AWS Support API access, and CloudWatch integration for automated monitoring of Trusted Advisor recommendations.",
    scans: ["Cost optimization findings", "Security recommendation status", "Fault tolerance assessment", "Performance improvement suggestions", "Service limit utilization"]
  },
  "cloudtrail": {
    desc: "AWS CloudTrail — Log all API activity across your AWS account.",
    details: "CloudTrail records every API call made in your AWS account — who made the call, which service, what action, when, and from what IP address. This creates an audit trail essential for security analysis, compliance, operational troubleshooting, and governance. By default, CloudTrail logs the last 90 days of management events (free, viewable in the console). Creating a Trail delivers events continuously to an S3 bucket and optionally to CloudWatch Logs for real-time monitoring and alerting. One trail per region delivering management events is free; additional trails and data event logging (S3 object-level operations, Lambda invocations) cost $0.10 per 100,000 events for the first copy, $0.025 for additional copies. CloudTrail Lake provides SQL-based querying of audit events ($2.50/GB ingested, retained for up to 7 years). CloudTrail Insights detects unusual API activity patterns.",
    scans: ["Trail configurations and costs", "Data event logging volume", "CloudTrail Lake ingestion", "Insight event charges", "Log storage optimization"]
  },
  "comprehend": {
    desc: "Amazon Comprehend — Natural Language Processing (NLP) for extracting insights from text.",
    details: "Comprehend uses machine learning to analyze text and extract insights without requiring any ML expertise. Built-in capabilities include: sentiment analysis (positive, negative, neutral, mixed), entity recognition (people, places, organizations, dates, quantities), key phrase extraction, language detection (100+ languages), syntax analysis (parts of speech), and topic modeling. Custom classification lets you train models to categorize documents into your own categories, and custom entity recognition identifies domain-specific entities. Comprehend Medical extracts health information from clinical text. Pricing is per unit (100 characters): $0.0001/unit for real-time, less for async batch. Minimum 3 units per request. Comprehend is ideal for analyzing customer reviews, support tickets, social media, legal documents, and medical records.",
    scans: ["API request volumes", "Custom model training costs", "Real-time vs batch usage", "Endpoint provisioning", "Medical comprehend charges"]
  },
  "rekognition": {
    desc: "Amazon Rekognition — Image and video analysis using deep learning.",
    details: "Rekognition provides pre-trained and customizable computer vision APIs. For images: detect objects and scenes, recognize faces (comparison and search), identify celebrities, extract text (OCR), detect inappropriate content, and analyze facial attributes (age range, emotions, glasses, beard). For video: track people, detect activities, recognize celebrities, and moderate content in stored or streaming video. Custom Labels lets you train models to detect objects specific to your domain (e.g., product defects, brand logos) using a few labeled images. Pricing is per image ($0.001 for first 1M images/month), per minute of video ($0.10 for stored video analysis), and per face metadata stored ($0.00001/face/month). Rekognition is used in security/surveillance, media analysis, user verification, and retail analytics.",
    scans: ["Image analysis request volumes", "Video processing minutes", "Custom Labels model costs", "Face collection storage", "Streaming video analysis"]
  },
  "textract": {
    desc: "Amazon Textract — Extract text, forms, and tables from documents using ML.",
    details: "Textract goes beyond simple OCR by using machine learning to automatically extract text, handwriting, tables, and form data from scanned documents, PDFs, and images — understanding the structure and relationships in the content. Three pricing tiers: (1) Detect Document Text — basic text extraction at $0.0015/page. (2) Analyze Document — extracts forms (key-value pairs) and tables at $0.015/page. (3) Analyze Expense — specialized for invoices and receipts at $0.01/page. (4) Analyze ID — extracts data from identity documents at $0.01/page. Textract supports synchronous (single page, real-time) and asynchronous (multi-page PDF, S3) APIs. It's used for automating data entry from invoices, processing loan applications, digitizing healthcare records, and extracting data from government forms. The biggest cost factor is page volume — process only the pages and features you need.",
    scans: ["Page processing volumes", "Feature tier utilization", "Async vs sync API usage", "Document type distribution", "Accuracy and retry rates"]
  },
  "polly": {
    desc: "Amazon Polly — Turn text into lifelike speech using deep learning.",
    details: "Polly converts text into natural-sounding speech in 60+ voices across 30+ languages. Two voice types: Standard voices (concatenative synthesis, $4/million characters) and Neural voices (deep learning-based, more natural, $16/million characters). Neural voices support news narrator, conversational, and long-form reading styles. Polly also supports SSML (Speech Synthesis Markup Language) for fine-tuning pronunciation, emphasis, pauses, and speaking rate. Speech Marks provide word-level timing for lip-syncing animations. Polly is used for accessibility features, IVR systems, e-learning content, news readers, and IoT devices. The free tier includes 5 million Standard characters and 1 million Neural characters per month for the first 12 months. Costs scale linearly with character count — optimize by caching frequently used audio and batching requests.",
    scans: ["Character processing volumes", "Standard vs Neural voice usage", "Speech Marks utilization", "Caching effectiveness", "Language and voice distribution"]
  },
  "lex": {
    desc: "Amazon Lex — Build conversational chatbots using the same technology as Alexa.",
    details: "Lex provides the building blocks for conversational interfaces (chatbots and voice bots) in applications. It uses automatic speech recognition (ASR) to convert speech to text and natural language understanding (NLU) to recognize the intent of the text. You define intents (what the user wants to do), utterances (phrases that trigger intents), and slots (parameters to collect from the user). Lex manages the dialogue flow, prompting for required information and handling validation. It integrates with Lambda for fulfillment logic, Connect for contact centers, and messaging platforms (Facebook, Slack, Twilio). Lex V2 pricing: $0.004/speech request, $0.00075/text request. The free tier includes 10,000 text and 5,000 speech requests/month for the first year. Lex is used for customer service automation, IT helpdesks, order management, and information retrieval.",
    scans: ["Request volume and type", "Intent resolution accuracy", "Lambda fulfillment costs", "Conversation flow analysis", "Channel integration usage"]
  },
  "emr": {
    desc: "Amazon EMR — Managed Hadoop/Spark clusters for big data processing.",
    details: "EMR (Elastic MapReduce) provisions and manages clusters running open-source big data frameworks: Apache Spark, Hadoop, Hive, HBase, Presto, Flink, and more. You specify the cluster size and instance types, and EMR handles provisioning, configuration, and tuning. EMR can process petabytes of data for ETL, log analysis, machine learning, real-time streaming, and genomics. Three deployment options: EMR on EC2 (full control), EMR on EKS (run Spark on Kubernetes), and EMR Serverless (no cluster management, pay per vCPU-hour and GB-hour). Costs include EC2 instance-hours plus EMR surcharge (varies by instance type, typically 15-25% of EC2 price). Spot Instances can reduce costs by up to 90% for fault-tolerant tasks. EMR Managed Scaling automatically adjusts cluster size based on workload. Key optimization: transient clusters (launch, process, terminate) vs long-running clusters.",
    scans: ["Cluster utilization rates", "Spot vs On-Demand usage", "EMR Serverless efficiency", "Job completion times", "Idle cluster detection"]
  },
  "quicksight": {
    desc: "Amazon QuickSight — Serverless business intelligence and data visualization.",
    details: "QuickSight is a cloud-native, serverless BI service for creating interactive dashboards, reports, and embedded analytics. It connects to data in S3, RDS, Redshift, Athena, Aurora, DynamoDB, and on-premises databases. QuickSight uses SPICE (Super-fast, Parallel, In-memory Calculation Engine) to cache data for fast query performance. Key features: ML-powered anomaly detection, forecasting, natural language queries (QuickSight Q), pixel-perfect paginated reports, and embedded analytics for SaaS applications. Two editions: Standard ($9/user/month for authors) and Enterprise ($18/user/month for authors, adds encryption, AD integration, row-level security). Reader pricing is pay-per-session ($0.30/session, max $5/month). SPICE capacity is $0.25/GB-month. Cost optimization: use Reader pricing for dashboard consumers, right-size SPICE capacity, and schedule data refreshes appropriately.",
    scans: ["User license utilization", "SPICE capacity usage", "Reader session costs", "Dashboard access patterns", "Data refresh frequency"]
  },
  "opensearch": {
    desc: "Amazon OpenSearch Service — Managed search and analytics (Elasticsearch fork).",
    details: "OpenSearch Service deploys, operates, and scales OpenSearch clusters for full-text search, log analytics, application monitoring, and clickstream analysis. It includes OpenSearch Dashboards (Kibana fork) for visualization. You choose instance types, instance count, storage (EBS or instance store), and optional features like dedicated master nodes, UltraWarm (warm storage tier for less-accessed data at ~90% lower cost), and cold storage (S3-backed, cheapest tier). Costs include instance-hours, EBS storage, data transfer, and optional UltraWarm/cold storage. Serverless OpenSearch eliminates capacity planning. Common use cases: application search, log aggregation (replacing ELK stack), SIEM solutions, and real-time analytics. Cost optimization: use UltraWarm for older log data, right-size instances to actual load, use reserved instances for stable workloads, and implement index lifecycle policies.",
    scans: ["Instance utilization patterns", "UltraWarm tier effectiveness", "Reserved instance coverage", "Index storage optimization", "Serverless capacity usage"]
  },
  "msk": {
    desc: "Amazon MSK — Fully managed Apache Kafka for event streaming.",
    details: "MSK (Managed Streaming for Apache Kafka) runs, manages, and scales Apache Kafka clusters without operational overhead. Kafka is the industry standard for building real-time streaming data pipelines and event-driven applications. MSK handles broker provisioning, patching, cluster scaling, and ZooKeeper management. You choose broker instance types, number of brokers, and storage per broker. MSK supports both Provisioned (you select instance types) and Serverless (automatic scaling, pay per cluster-hour, partition-hour, storage, and data) modes. Costs for Provisioned: instance-hours plus storage per GB-month. MSK Connect deploys Kafka Connect connectors as managed resources. MSK integrates natively with Lambda, Kinesis Data Firehose, and S3 for data processing. Cost optimization: right-size brokers, use tiered storage for older data, and consider MSK Serverless for variable workloads.",
    scans: ["Broker instance utilization", "Storage volume per broker", "Serverless throughput costs", "Connector configurations", "Tiered storage effectiveness"]
  },
  "cognito": {
    desc: "Amazon Cognito — User authentication and authorization for web and mobile apps.",
    details: "Cognito provides two main components: (1) User Pools — a managed user directory for sign-up/sign-in with built-in UI, email/SMS verification, MFA, password policies, and federation with social identity providers (Google, Facebook, Apple) and SAML/OIDC enterprise providers. (2) Identity Pools — exchange User Pool tokens (or federated identities) for temporary, limited-privilege AWS credentials, enabling mobile/web apps to access AWS services directly. The first 50,000 monthly active users (MAUs) in User Pools are free; beyond that, pricing starts at $0.0055/MAU (decreasing at scale). Advanced Security features (adaptive authentication, compromised credential detection) add $0.050/MAU. SMS charges for MFA are additional. Cognito is the most cost-effective way to add authentication to applications without building auth infrastructure.",
    scans: ["Monthly active user counts", "Advanced Security feature usage", "SMS MFA delivery costs", "User Pool federation patterns", "Identity Pool credential usage"]
  },
  "secrets-manager": {
    desc: "AWS Secrets Manager — Securely store, manage, and rotate secrets.",
    details: "Secrets Manager stores and manages secrets like database credentials, API keys, OAuth tokens, and SSH keys with automatic encryption using KMS. Its killer feature is automatic rotation: Secrets Manager can automatically rotate credentials for RDS, Redshift, DocumentDB, and custom services on a schedule (e.g., every 30 days) using Lambda functions — without any application downtime. Applications retrieve secrets via API calls instead of hardcoding credentials. Each secret costs $0.40/month plus $0.05 per 10,000 API calls. Secrets are versioned and support staging labels (AWSCURRENT, AWSPREVIOUS, AWSPENDING) for safe rotation. Cross-region replication enables secrets to be available in multiple regions. Alternative: SSM Parameter Store SecureString ($0 for standard, $0.05/10K advanced API calls) — cheaper but lacks native rotation.",
    scans: ["Secret count and storage costs", "API call volumes", "Rotation configuration status", "Cross-region replication", "Unused secret identification"]
  },
  "waf": {
    desc: "AWS WAF — Web Application Firewall protecting against common web exploits.",
    details: "WAF protects web applications from common attacks by letting you define rules that filter HTTP/HTTPS requests based on conditions like IP addresses, HTTP headers, URI strings, SQL injection patterns, and cross-site scripting (XSS). WAF attaches to CloudFront, API Gateway, ALB, AppSync, or Cognito. You create a Web ACL (Access Control List) containing rules that inspect and either allow, block, count, or CAPTCHA requests. AWS Managed Rules provide pre-built protection against OWASP Top 10, known bad IPs, and bot traffic. Pricing: $5/month per Web ACL, $1/month per rule, $0.60/million requests inspected. Bot Control ($10/month + $1/million requests) provides sophisticated bot management. Fraud Control for account takeover and creation adds additional per-login charges. Cost optimization: consolidate Web ACLs, use rate-based rules efficiently, and monitor request volumes.",
    scans: ["Web ACL configurations", "Rule count per ACL", "Request inspection volume", "Managed rule group costs", "Bot Control charges"]
  },
  "shield": {
    desc: "AWS Shield — DDoS (Distributed Denial of Service) protection.",
    details: "Shield protects AWS applications against DDoS attacks at two tiers: (1) Shield Standard — automatically included for all AWS customers at no extra cost. It protects against common Layer 3/4 attacks (SYN/UDP floods, reflection attacks) targeting CloudFront, Route 53, Global Accelerator, and ELBs. (2) Shield Advanced — $3,000/month (1-year commitment) plus data transfer fees. It provides enhanced detection and mitigation for larger, more sophisticated attacks, 24/7 access to the AWS DDoS Response Team (DRT), real-time attack visibility and diagnostics, cost protection (credits for scaling charges during attacks), and integration with WAF (WAF charges included). Shield Advanced covers EC2, ELB, CloudFront, Global Accelerator, and Route 53. For most users, Shield Standard is sufficient. Shield Advanced is for organizations with high DDoS risk or regulatory requirements.",
    scans: ["Shield Advanced subscription", "Protected resource inventory", "Attack event history", "DRT engagement frequency", "Cost protection claim eligibility"]
  },
  "guardduty": {
    desc: "Amazon GuardDuty — Intelligent threat detection using machine learning.",
    details: "GuardDuty is a managed threat detection service that continuously monitors your AWS accounts and workloads for malicious activity and unauthorized behavior. It analyzes multiple data sources: CloudTrail management and data events, VPC Flow Logs, DNS query logs, EKS audit logs, RDS login activity, Lambda network activity, S3 data events, and EBS volume data (for malware). GuardDuty uses machine learning, anomaly detection, and integrated threat intelligence to identify threats like cryptocurrency mining, credential compromise, unauthorized deployments, and data exfiltration. Pricing is based on data volume analyzed: $4/million CloudTrail events, $1/GB for VPC Flow Logs and DNS Logs (with volume discounts). The first 30 days are a free trial. GuardDuty findings integrate with Security Hub, EventBridge (for automated remediation), and Detective (for investigation).",
    scans: ["Data source analysis volume", "Finding severity distribution", "Automated remediation setup", "Suppression rule effectiveness", "Multi-account organization coverage"]
  },
  "inspector": {
    desc: "Amazon Inspector — Automated vulnerability management for EC2 and containers.",
    details: "Inspector automatically discovers and scans EC2 instances, container images in ECR, and Lambda functions for software vulnerabilities (CVEs) and unintended network exposure. Unlike the original Inspector (agent-based, manual assessments), the current Inspector v2 uses Systems Manager (SSM) Agent for agentless scanning, runs continuously (not just on-demand), and provides a risk score for prioritizing remediation. It checks against the National Vulnerability Database (NVD) and vendor advisories. Pricing: EC2 scanning at $0.016/instance/month, ECR image scanning at $0.09 per initial scan + $0.01 per rescan, Lambda function scanning at $0.15/function/month. The first 15 days are a free trial. Inspector findings integrate with Security Hub for centralized security view and EventBridge for automated remediation workflows.",
    scans: ["Instance scan coverage", "Critical vulnerability count", "ECR image scan frequency", "Lambda function coverage", "Remediation SLA tracking"]
  },
  "eventbridge": {
    desc: "Amazon EventBridge — Serverless event bus for application integration.",
    details: "EventBridge is a serverless event bus that routes events between AWS services, SaaS applications (Salesforce, Zendesk, Datadog, PagerDuty, etc.), and your own applications. Events are JSON objects describing state changes (e.g., 'EC2 instance terminated,' 'S3 object created,' 'order placed'). You create rules with event patterns that match events and route them to targets (Lambda, SQS, SNS, Step Functions, API Gateway, Kinesis, and 20+ others). EventBridge supports content filtering, input transformation, dead-letter queues for failed deliveries, and event archive/replay for debugging. The default event bus receives AWS service events for free. Custom events cost $1/million events. Schema Registry automatically discovers and stores event schemas. Pipes provides point-to-point integrations with filtering and enrichment. Scheduler triggers events on schedules at $0 for the first 14M invocations.",
    scans: ["Custom event volumes", "Rule and target configurations", "Archive storage costs", "Pipe configurations", "Scheduler invocation patterns"]
  },
  "step-functions": {
    desc: "AWS Step Functions — Visual workflow orchestration for distributed applications.",
    details: "Step Functions lets you coordinate multiple AWS services into serverless workflows using visual state machines defined in Amazon States Language (JSON). Workflows consist of states (Task, Choice, Parallel, Map, Wait, Pass, Succeed, Fail) that chain together service calls to Lambda, ECS, Fargate, DynamoDB, SNS, SQS, Glue, SageMaker, and more. Two workflow types: Standard (exactly-once execution, up to 1 year duration, $0.025 per 1,000 state transitions) and Express (at-least-once, up to 5 minutes, $0.00001/request + $0.00001667/GB-second of memory). Step Functions handles retries, error catching, timeouts, and parallel execution automatically. Use cases: order processing, ETL pipelines, ML model training orchestration, and microservice coordination. The Map state enables parallel processing of arrays. Distributed Map processes millions of items from S3.",
    scans: ["State transition volumes", "Standard vs Express efficiency", "Execution duration patterns", "Error and retry rates", "Parallel processing utilization"]
  },
  "mq": {
    desc: "Amazon MQ — Managed message broker for ActiveMQ and RabbitMQ.",
    details: "Amazon MQ provides managed message brokers compatible with industry-standard protocols: Apache ActiveMQ (JMS, AMQP, STOMP, MQTT, OpenWire) and RabbitMQ (AMQP 0-9-1). This enables migrating existing messaging applications to AWS without rewriting code — just update the broker endpoint. MQ handles provisioning, patching, and failure detection. For ActiveMQ: single-instance ($0.045-$1.572/hour based on instance size) or active/standby ($0.090-$3.144/hour) deployment. For RabbitMQ: single-instance or cluster (3 nodes). Storage costs additional. MQ is more expensive than SQS/SNS but essential when applications require these specific protocols. For new applications without protocol requirements, SQS/SNS offer better scalability and lower costs. MQ supports network of brokers for scaling ActiveMQ.",
    scans: ["Broker instance utilization", "Storage volume costs", "Active/standby necessity", "Message throughput patterns", "Protocol requirement assessment"]
  },
  "appflow": {
    desc: "Amazon AppFlow — Secure data integration between SaaS apps and AWS.",
    details: "AppFlow enables you to securely transfer data between SaaS applications (Salesforce, ServiceNow, Slack, SAP, Google Analytics, Zendesk, and 50+ connectors) and AWS services (S3, Redshift, EventBridge) without writing custom integration code. You create flows that define: source, destination, field mapping, data transformations (masking, truncating, validating), and trigger (on-demand, event-driven, or scheduled). AppFlow encrypts data in transit and at rest, supports PrivateLink for private data transfers, and can handle millions of records. Pricing: $0.001 per flow run plus $0.02/GB of data processed. There are no connector licensing fees. AppFlow is ideal for analytics pipelines (Salesforce data to Redshift), event-driven architectures (ServiceNow events to EventBridge), and data lake ingestion. Cost optimization: schedule flows efficiently and filter to transfer only needed fields.",
    scans: ["Flow run frequency", "Data transfer volumes", "Connector utilization", "Field mapping efficiency", "Schedule optimization"]
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
  const [outputLogs, setOutputLogs] = useState<{msg: string, type: 'info' | 'warn' | 'error' | 'success'}[]>([]);
  const [debugLogs, setDebugLogs] = useState<{msg: string, type: 'info' | 'warn' | 'error' | 'success'}[]>([]);
  const [terminalPane, setTerminalPane] = useState<"terminal" | "output" | "debug">("terminal");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    accessKeyId: "",
    secretAccessKey: "",
  });
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Smart Onboarding Assistant State
  const [onboardingStep, setOnboardingStep] = useState<"welcome" | "experience" | "guide" | "credentials" | "ready" | "skipped">("welcome");
  const [onboardingMessages, setOnboardingMessages] = useState<{role: "assistant" | "user"; content: string; options?: string[]}[]>([
    { role: "assistant", content: "Welcome to AWS Dzera! 👋 I'll help you connect your AWS account safely and run your first cost analysis. How familiar are you with AWS?", options: ["I'm new to AWS", "I know the basics", "I'm an AWS expert"] }
  ]);
  const [onboardingTyping, setOnboardingTyping] = useState(false);
  const [onboardingNovaLoading, setOnboardingNovaLoading] = useState(false);
  const onboardingEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll onboarding messages
  useEffect(() => {
    onboardingEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [onboardingMessages, onboardingTyping]);

  // Core utility functions
  const addLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }]);
  }, []);

  const addOutputLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setOutputLogs(prev => [...prev, { msg, type }]);
  }, []);

  const addDebugLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setDebugLogs(prev => [...prev, { msg: `[${new Date().toISOString()}] ${msg}`, type }]);
  }, []);

  // Smart Onboarding handler
  const handleOnboardingChoice = useCallback(async (choice: string) => {
    // Add user's choice as a message
    setOnboardingMessages(prev => [...prev, { role: "user", content: choice }]);
    setOnboardingTyping(true);

    // Simulate brief typing delay for natural feel
    await new Promise(r => setTimeout(r, 800));

    if (onboardingStep === "welcome") {
      // Respond based on experience level
      if (choice === "I'm new to AWS") {
        setOnboardingMessages(prev => [...prev, {
          role: "assistant",
          content: "No worries — I'll walk you through everything! To scan your AWS account, you need an **Access Key ID** and **Secret Access Key**. These are like a username and password that let Dzera read (but never modify) your AWS resources.\n\nHere's how to create them:",
        }]);
        setOnboardingTyping(false);
        await new Promise(r => setTimeout(r, 600));
        setOnboardingTyping(true);
        await new Promise(r => setTimeout(r, 1000));
        setOnboardingMessages(prev => [...prev, {
          role: "assistant",
          content: "**Step 1:** Go to [AWS IAM Console](https://console.aws.amazon.com/iam)\n**Step 2:** Click **Users** → **Create user** → name it `dzera-readonly`\n**Step 3:** Attach the **ReadOnlyAccess** policy\n**Step 4:** Go to **Security credentials** tab → **Create access key**\n**Step 5:** Copy both keys and paste them below 👇",
        }]);
        setOnboardingStep("guide");
      } else if (choice === "I know the basics") {
        setOnboardingMessages(prev => [...prev, {
          role: "assistant",
          content: "Great! You'll need an **IAM user** with **ReadOnlyAccess** policy. If you haven't created one yet:\n\n→ **IAM Console** → **Users** → **Create user** → Attach `ReadOnlyAccess` → **Security credentials** → **Create access key**\n\nPaste your credentials below when ready 👇",
        }]);
        setOnboardingStep("guide");
      } else {
        setOnboardingMessages(prev => [...prev, {
          role: "assistant",
          content: "Excellent! You know the drill — paste your IAM credentials below. Dzera uses **read-only** API calls (DescribeInstances, ListBuckets, etc.) and never modifies your resources. 🔒",
        }]);
        setOnboardingStep("guide");
      }
      setOnboardingTyping(false);
      await new Promise(r => setTimeout(r, 400));
      setOnboardingTyping(true);
      await new Promise(r => setTimeout(r, 700));
      setOnboardingMessages(prev => [...prev, {
        role: "assistant",
        content: "Paste your **Access Key ID** and **Secret Access Key** in the fields below:",
      }]);
      setOnboardingTyping(false);
      setOnboardingStep("credentials");
      return;
    }

    if (onboardingStep === "credentials" && choice === "ask_nova") {
      // User wants to ask Nova a question about the process
      setOnboardingNovaLoading(true);
      setOnboardingTyping(true);
      try {
        const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
        const apiUrl = isProduction 
          ? 'https://8phpxwcke6.execute-api.us-west-2.amazonaws.com/prod/chat' 
          : '/api/chat';
        addDebugLog(`NOVA_ONBOARDING: POST ${apiUrl}`, "info");
        addDebugLog(`NOVA_ONBOARDING: User query: "${choice.substring(0, 80)}..."`, "info");
        const novaStart = Date.now();
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: "user", content: choice }] }),
        });
        addDebugLog(`NOVA_ONBOARDING: Response ${response.status} (${Date.now() - novaStart}ms)`, response.ok ? "success" : "error");
        if (response.ok) {
          const data = await response.json();
          setOnboardingMessages(prev => [...prev, {
            role: "assistant",
            content: data.message || "I can help with that! Please make sure you have an IAM user with ReadOnlyAccess.",
          }]);
        } else {
          addDebugLog(`NOVA_ONBOARDING: Non-OK response, using fallback`, "warn");
          setOnboardingMessages(prev => [...prev, {
            role: "assistant",
            content: "To create credentials: Go to **IAM Console** → **Users** → **Create user** → attach `ReadOnlyAccess` → **Security credentials** → **Create access key**. Copy both keys and paste them in the fields below.",
          }]);
        }
      } catch (err: any) {
        addDebugLog(`NOVA_ONBOARDING: Error: ${err?.message || 'Unknown error'}`, "error");
        setOnboardingMessages(prev => [...prev, {
          role: "assistant",
          content: "To create credentials: Go to **IAM Console** → **Users** → **Create user** → attach `ReadOnlyAccess` → **Security credentials** → **Create access key**. Copy both keys and paste them in the fields below.",
        }]);
      }
      setOnboardingNovaLoading(false);
      setOnboardingTyping(false);
      return;
    }

    setOnboardingTyping(false);
  }, [onboardingStep, addDebugLog]);

  // Handle credential validation in onboarding
  const handleOnboardingValidate = useCallback(() => {
    const keyId = credentials.accessKeyId.trim();
    const secret = credentials.secretAccessKey.trim();
    
    if (!keyId || !secret) {
      setOnboardingMessages(prev => [...prev, {
        role: "assistant",
        content: "Please fill in both fields — I need your **Access Key ID** (starts with AKIA...) and your **Secret Access Key** to proceed.",
      }]);
      return;
    }

    if (!keyId.startsWith("AKIA") && !keyId.startsWith("ASIA")) {
      setOnboardingMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ That Access Key ID doesn't look right — it should start with **AKIA** (long-term) or **ASIA** (temporary session). Double-check you copied the right value from the IAM Console.",
      }]);
      return;
    }

    if (secret.length < 20) {
      setOnboardingMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ The Secret Access Key looks too short. AWS secret keys are typically 40 characters long. Make sure you copied the full key.",
      }]);
      return;
    }

    setOnboardingMessages(prev => [...prev, 
      { role: "user", content: "Credentials entered ✓" },
      { role: "assistant", content: "Credentials look good! ✅ Here's what the scan will do:\n\n• **EC2** — Find idle/oversized instances\n• **S3** — Check storage class optimization\n• **RDS** — Identify overprovisioned databases\n• **EBS** — Detect unattached volumes\n• **Elastic IPs** — Find unused IPs ($3.65/mo each)\n• **NAT Gateways** — Review data processing costs\n\nThe scan is **100% read-only** and takes about 30-60 seconds.", options: ["🚀 Start Analysis", "Cancel"] }
    ]);
    setOnboardingStep("ready");
  }, [credentials]);

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
    setOutputLogs([]);
    setDebugLogs([]);
    setTerminalPane("terminal");
    addLog("Initializing infrastructure analysis...", "info");
    addLog("Validating credentials...", "info");
    addDebugLog("SCAN_START: Initializing scan pipeline", "info");
    addDebugLog(`ENV: ${typeof window !== 'undefined' ? window.location.hostname : 'unknown'}`, "info");
    addDebugLog(`CREDENTIALS: AccessKeyId=${credentials.accessKeyId.substring(0, 8)}...${credentials.accessKeyId.slice(-4)} (${credentials.accessKeyId.length} chars)`, "info");
    addDebugLog(`CREDENTIALS: SecretAccessKey=****...${credentials.secretAccessKey.slice(-4)} (${credentials.secretAccessKey.length} chars)`, "info");

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
      addDebugLog("TIMEOUT: AbortController set to 120000ms", "info");

      // Use API Gateway directly in production, local API route in development
      const isProduction = typeof window !== 'undefined' && 
        !window.location.hostname.includes('localhost');
      const scanUrl = isProduction 
        ? 'https://8phpxwcke6.execute-api.us-west-2.amazonaws.com/prod/scan' 
        : '/api/scan';

      addDebugLog(`HTTP_REQUEST: POST ${scanUrl}`, "info");
      addDebugLog(`HEADERS: Content-Type: application/json`, "info");
      const fetchStart = Date.now();

      const res = await fetch(scanUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const fetchDuration = Date.now() - fetchStart;
      addDebugLog(`HTTP_RESPONSE: ${res.status} ${res.statusText} (${fetchDuration}ms)`, res.ok ? "success" : "error");
      addDebugLog(`RESPONSE_HEADERS: content-type=${res.headers.get('content-type')}`, "info");

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        addDebugLog(`ERROR_BODY: ${JSON.stringify(body)}`, "error");
        throw new Error(body.error || body.message || `Analysis failed with status ${res.status}`);
      }

      const data = (await res.json()) as ScanResult;
      addDebugLog(`PARSE: Response parsed successfully`, "success");
      addDebugLog(`FINDINGS: ${data.findings.length} items, total cost: $${data.totalEstimatedMonthlyCost?.toFixed(2)}/mo`, "success");
      addLog(`Analysis complete. Identified ${data.findings.length} optimization opportunities.`, "success");
      
      // Populate Output pane with structured results
      addOutputLog("╔══════════════════════════════════════════════╗", "info");
      addOutputLog("║        AWS DZERA — SCAN RESULTS SUMMARY        ║", "info");
      addOutputLog("╚══════════════════════════════════════════════╝", "info");
      addOutputLog("", "info");
      addOutputLog(`Scan started:  ${data.startedAt}`, "info");
      addOutputLog(`Scan finished: ${data.finishedAt}`, "info");
      addOutputLog(`Total findings: ${data.findings.length}`, "info");
      addOutputLog(`Estimated monthly cost: $${data.totalEstimatedMonthlyCost?.toFixed(2)}`, "warn");
      addOutputLog(`Estimated hourly cost:  $${data.totalEstimatedHourlyCost?.toFixed(2)}`, "info");
      addOutputLog("", "info");

      const critical = data.findings.filter((f: CostFinding) => f.severity === "critical");
      const warnings = data.findings.filter((f: CostFinding) => f.severity === "warning");
      const infos = data.findings.filter((f: CostFinding) => f.severity === "info");

      if (critical.length > 0) {
        addOutputLog(`── CRITICAL (${critical.length}) ────────────────────────`, "error");
        critical.forEach((f: CostFinding) => {
          addOutputLog(`  ✗ ${f.title}`, "error");
          addOutputLog(`    ${f.service} | ${f.resourceId} | ${f.region} | ~$${f.estimatedMonthlyCost?.toFixed(2)}/mo`, "error");
          addOutputLog(`    → ${f.suggestion}`, "info");
        });
        addOutputLog("", "info");
      }
      if (warnings.length > 0) {
        addOutputLog(`── WARNING (${warnings.length}) ─────────────────────────`, "warn");
        warnings.forEach((f: CostFinding) => {
          addOutputLog(`  ⚠ ${f.title}`, "warn");
          addOutputLog(`    ${f.service} | ${f.resourceId} | ${f.region} | ~$${f.estimatedMonthlyCost?.toFixed(2)}/mo`, "warn");
          addOutputLog(`    → ${f.suggestion}`, "info");
        });
        addOutputLog("", "info");
      }
      if (infos.length > 0) {
        addOutputLog(`── INFO (${infos.length}) ────────────────────────────`, "info");
        infos.forEach((f: CostFinding) => {
          addOutputLog(`  ℹ ${f.title}`, "info");
          addOutputLog(`    ${f.service} | ${f.resourceId} | ${f.region} | ~$${f.estimatedMonthlyCost?.toFixed(2)}/mo`, "info");
          addOutputLog(`    → ${f.suggestion}`, "info");
        });
      }
      addOutputLog("", "info");
      addOutputLog("════════════════════════════════════════════════", "info");
      addOutputLog("End of scan output. Switch to Terminal for activity logs.", "info");

      setTimeout(() => {
        setResult(data);
        setStep("results");
      }, 1000);

    } catch (e: any) {
      addLog(`Error: ${e.message}`, "error");
      addDebugLog(`SCAN_ERROR: ${e.name}: ${e.message}`, "error");
      addDebugLog(`STACK: ${e.stack?.split('\n').slice(0, 3).join(' | ')}`, "error");
      addOutputLog("╔══════════════════════════════════════════════╗", "error");
      addOutputLog("║            SCAN FAILED                         ║", "error");
      addOutputLog("╚══════════════════════════════════════════════╝", "error");
      addOutputLog(`Error: ${e.message}`, "error");
      addOutputLog("Check the Debug tab for detailed error information.", "info");
      if (e.name === "AbortError") {
        setError("Analysis timed out. Please verify your credentials and retry.");
        addDebugLog("ABORT: Request aborted after 120000ms timeout", "error");
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
    // Try exact match first, then try common variations
    const exactMatch = serviceDescriptions[serviceKey];
    if (exactMatch) return exactMatch;
    
    // Try without hyphens or with common aliases
    const normalized = serviceKey.replace(/-/g, '');
    const aliasMap: Record<string, string> = {
      "s3glacier": "s3-glacier", "storagegateway": "storage-gateway", "awsbackup": "aws-backup",
      "natgateway": "nat-gateway", "elasticip": "elastic-ip", "apigateway": "api-gateway",
      "appmesh": "app-mesh", "apprunner": "app-runner", "elasticbeanstalk": "elastic-beanstalk",
      "directconnect": "direct-connect", "globalaccelerator": "global-accelerator",
      "route53": "route-53", "systemsmanager": "systems-manager", "trustedadvisor": "trusted-advisor",
      "secretsmanager": "secrets-manager", "stepfunctions": "step-functions",
      "costexplorer": "cost-explorer", "savingsplans": "savings-plans", "reservedinstances": "reserved-instances"
    };
    const aliased = aliasMap[normalized];
    if (aliased && serviceDescriptions[aliased]) return serviceDescriptions[aliased];
    
    return {
      desc: `${serviceKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — AWS cloud service.`,
      details: `${serviceKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} is an AWS service. Detailed analysis information for this specific service will be available after running a full infrastructure scan. Connect your AWS credentials and run Dzera to get a comprehensive cost breakdown and optimization recommendations tailored to your usage patterns.`,
      scans: ["Resource inventory and utilization", "Cost allocation and attribution", "Configuration best practices", "Pricing model optimization"]
    };
  };

  if (step === "setup") {
    return (
      <div className="min-h-[100dvh] bg-[#0b0f14] text-[#e5e7eb] px-2 sm:px-4 py-2 sm:py-6 pb-24 sm:pb-6">
        <div className="max-w-[1600px] mx-auto space-y-3 sm:space-y-4">
          {/* Header - Mobile only (desktop uses Explorer panel instead) */}
          <div className="sm:hidden flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <DLogo size="md" active />
              <div>
                <h1 className="text-base font-bold text-white leading-none tracking-tight">AWS Dzera</h1>
                <p className="text-[#FF9900] text-[7px] font-bold uppercase tracking-widest">Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-[#161b22] px-2 py-1 rounded border border-[#30363d]">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-gray-400">Ready</span>
            </div>
          </div>

          {/* Mobile Bottom Navigation — safe area for notched phones */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0d1117]/95 backdrop-blur-lg border-t border-[#30363d] px-2 pt-1.5 z-50" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
            <div className="flex justify-around items-center max-w-md mx-auto">
              <button 
                onClick={() => setMobileView("scan")}
                className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1.5 rounded-xl transition-all active:scale-95 ${mobileView === "scan" ? "bg-[#FF9900]/15 text-[#FF9900]" : "text-gray-500"}`}
              >
                <ThemedIcon variant="key" size="sm" active={mobileView === "scan"} />
                <span className="text-[9px] font-semibold">Scan</span>
              </button>
              <button 
                onClick={() => { setMobileView("services"); handleTabClick("aws-services.json"); }}
                className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1.5 rounded-xl transition-all active:scale-95 ${mobileView === "services" || mobileView === "details" ? "bg-[#FF9900]/15 text-[#FF9900]" : "text-gray-500"}`}
              >
                <ThemedIcon variant="grid" size="sm" active={mobileView === "services" || mobileView === "details"} />
                <span className="text-[9px] font-semibold">Services</span>
              </button>
              <button 
                onClick={() => setMobileView("chat")}
                className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1.5 rounded-xl transition-all active:scale-95 relative ${mobileView === "chat" ? "bg-[#FF9900]/15 text-[#FF9900]" : "text-gray-500"}`}
              >
                <div className="relative">
                  <ThemedIcon variant="d" size="sm" active={mobileView === "chat"} />
                  <div className="absolute -top-0.5 -right-1 w-2 h-2 bg-green-500 rounded-full border border-[#0d1117]"></div>
                </div>
                <span className="text-[9px] font-semibold">Nova AI</span>
              </button>
              <button 
                onClick={() => setMobileView("terminal")}
                className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1.5 rounded-xl transition-all active:scale-95 relative ${mobileView === "terminal" ? "bg-[#FF9900]/15 text-[#FF9900]" : "text-gray-500"}`}
              >
                <div className="relative">
                  <ThemedIcon variant="terminal" size="sm" active={mobileView === "terminal"} />
                  {(logs.length > 0 || outputLogs.length > 0 || debugLogs.length > 0) && (
                    <div className="absolute -top-0.5 -right-1 w-2 h-2 bg-blue-400 rounded-full border border-[#0d1117]"></div>
                  )}
                </div>
                <span className="text-[9px] font-semibold">Logs</span>
              </button>
            </div>
          </div>

          {/* Mobile Content Area */}
          <div className="sm:hidden">
            {/* Scan View */}
            {mobileView === "scan" && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden" style={{ height: 'calc(100dvh - 170px)' }}>
                {/* Onboarding Header */}
                <div className="h-10 bg-[#161b22] flex items-center justify-between border-b border-[#30363d] px-3">
                  <div className="flex items-center gap-2">
                    <DLogo size="sm" active />
                    <span className="text-xs font-bold text-white">Smart Setup Assistant</span>
                    <span className="text-[9px] bg-[#FF9900]/20 text-[#FF9900] px-1.5 py-0.5 rounded font-bold">Nova AI</span>
                  </div>
                  {onboardingStep !== "skipped" && (
                    <button
                      onClick={() => setOnboardingStep("skipped")}
                      className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Skip →
                    </button>
                  )}
                  {onboardingStep === "skipped" && (
                    <button
                      onClick={() => { setOnboardingStep("welcome"); setOnboardingMessages([{ role: "assistant", content: "Welcome to AWS Dzera! 👋 I'll help you connect your AWS account safely and run your first cost analysis. How familiar are you with AWS?", options: ["I'm new to AWS", "I know the basics", "I'm an AWS expert"] }]); }}
                      className="text-[10px] text-[#FF9900] hover:text-[#e68a00] transition-colors"
                    >
                      ← Assistant
                    </button>
                  )}
                </div>

                {onboardingStep === "skipped" ? (
                  /* Classic Form (Skip Mode) */
                  <div className="p-4 space-y-4 overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-black text-white">Connect AWS Account</h2>
                      <p className="text-gray-400 text-xs">Enter your credentials to analyze infrastructure costs.</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Access Key ID</label>
                        <input type="text" placeholder="AKIA..." value={credentials.accessKeyId} onChange={(e) => setCredentials(prev => ({ ...prev, accessKeyId: e.target.value }))} className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-3 text-sm text-white focus:ring-1 focus:ring-[#FF9900] focus:border-[#FF9900] outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Secret Access Key</label>
                        <input type="password" placeholder="••••••••••••••••" value={credentials.secretAccessKey} onChange={(e) => setCredentials(prev => ({ ...prev, secretAccessKey: e.target.value }))} className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-3 text-sm text-white focus:ring-1 focus:ring-[#FF9900] focus:border-[#FF9900] outline-none" />
                      </div>
                    </div>
                    <button onClick={handleVerify} disabled={!credentials.accessKeyId || !credentials.secretAccessKey} className="w-full bg-[#FF9900] hover:bg-[#e68a00] disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold py-3.5 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      <DLogo size="xs" /><span>ANALYZE INFRASTRUCTURE</span>
                    </button>
                    {error && <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3"><span className="text-xs text-red-200">{error}</span></div>}
                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 leading-relaxed">🔒 Use an IAM user with ReadOnlyAccess. Dzera never modifies your account.</p>
                    </div>
                  </div>
                ) : (
                  /* Smart Onboarding Chat */
                  <div className="flex flex-col" style={{ height: 'calc(100% - 40px)' }}>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {onboardingMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          {msg.role === "assistant" && (
                            <div className="w-6 h-6 bg-[#FF9900] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[10px] font-black text-black">D</span>
                            </div>
                          )}
                          <div className={`max-w-[85%] ${msg.role === "user" ? "bg-[#FF9900] text-black rounded-2xl rounded-br-sm px-3 py-2" : "bg-[#161b22] border border-[#30363d] text-gray-200 rounded-2xl rounded-bl-sm px-3 py-2"}`}>
                            <p className="text-xs leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" class="text-[#FF9900] underline">$1</a>').replace(/\n/g, '<br/>') }} />
                            {msg.options && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {msg.options.map((opt, i) => (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      if (opt === "🚀 Start Analysis") {
                                        handleVerify();
                                      } else if (opt === "Cancel") {
                                        setOnboardingStep("credentials");
                                        setOnboardingMessages(prev => [...prev, { role: "user", content: "Cancel" }, { role: "assistant", content: "No problem! Your credentials are still saved in the fields below. Click **Start Analysis** whenever you're ready, or ask me any questions.", options: ["🚀 Start Analysis"] }]);
                                      } else {
                                        handleOnboardingChoice(opt);
                                      }
                                    }}
                                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${opt.includes("🚀") ? "bg-[#FF9900] text-black hover:bg-[#e68a00]" : opt === "Cancel" ? "bg-[#21262d] text-gray-400 hover:text-white border border-[#30363d]" : "bg-[#21262d] text-[#FF9900] hover:bg-[#FF9900]/20 border border-[#FF9900]/30"}`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {onboardingTyping && (
                        <div className="flex gap-2 justify-start">
                          <div className="w-6 h-6 bg-[#FF9900] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-black text-black">D</span>
                          </div>
                          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl rounded-bl-sm px-3 py-2">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={onboardingEndRef} />
                    </div>

                    {/* Credential Fields (shown after guide step) */}
                    {(onboardingStep === "credentials" || onboardingStep === "ready") && (
                      <div className="border-t border-[#30363d] p-3 space-y-2 bg-[#0d1117]">
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="text"
                            placeholder="Access Key ID (AKIA...)"
                            value={credentials.accessKeyId}
                            onChange={(e) => setCredentials(prev => ({ ...prev, accessKeyId: e.target.value }))}
                            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-[#FF9900] focus:border-[#FF9900] outline-none placeholder-gray-600"
                          />
                          <input
                            type="password"
                            placeholder="Secret Access Key"
                            value={credentials.secretAccessKey}
                            onChange={(e) => setCredentials(prev => ({ ...prev, secretAccessKey: e.target.value }))}
                            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-[#FF9900] focus:border-[#FF9900] outline-none placeholder-gray-600"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={onboardingStep === "ready" ? handleVerify : handleOnboardingValidate}
                            className="flex-1 bg-[#FF9900] hover:bg-[#e68a00] text-black font-bold py-2.5 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-xs"
                          >
                            <DLogo size="xs" />
                            {onboardingStep === "ready" ? "🚀 Start Analysis" : "Validate & Continue"}
                          </button>
                        </div>
                        {error && <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-2"><span className="text-[10px] text-red-200">{error}</span></div>}
                      </div>
                    )}

                    {/* Ask Nova input (when in credentials step) */}
                    {onboardingStep === "credentials" && (
                      <div className="border-t border-[#30363d] px-3 py-2 bg-[#0b0f14]">
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Ask Dzera anything about AWS..."
                            className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-[#FF9900] outline-none placeholder-gray-600"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                const q = (e.target as HTMLInputElement).value.trim();
                                setOnboardingMessages(prev => [...prev, { role: "user", content: q }]);
                                (e.target as HTMLInputElement).value = '';
                                handleOnboardingChoice("ask_nova");
                                // Actually pass the real question
                                setTimeout(async () => {
                                  setOnboardingTyping(true);
                                  try {
                                    const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
                                    const apiUrl = isProduction ? 'https://8phpxwcke6.execute-api.us-west-2.amazonaws.com/prod/chat' : '/api/chat';
                                    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: "user", content: q }] }) });
                                    if (response.ok) {
                                      const data = await response.json();
                                      setOnboardingMessages(prev => [...prev, { role: "assistant", content: data.message || "Let me help with that!" }]);
                                    }
                                  } catch { /* silent */ }
                                  setOnboardingTyping(false);
                                }, 100);
                              }
                            }}
                          />
                          <span className="text-[9px] text-gray-600 flex-shrink-0">Nova AI</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Services View */}
            {mobileView === "services" && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden" style={{ height: 'calc(100dvh - 170px)' }}>
                <div className="h-10 bg-[#161b22] flex items-center justify-between border-b border-[#30363d] px-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <ThemedIcon variant="grid" size="xs" active />
                    <span className="text-xs font-bold text-white">AWS Services</span>
                    <span className="text-[9px] bg-[#161b22] text-gray-500 px-1.5 py-0.5 rounded border border-[#30363d]">{Object.keys(serviceDescriptions).length}</span>
                  </div>
                  <button onClick={() => setShowCommandPalette(true)} className="text-gray-400 hover:text-[#FF9900] p-1 active:scale-95">
                    <ThemedIcon variant="search" size="sm" />
                  </button>
                </div>

                <div className="p-3 h-[calc(100%-40px)] overflow-y-auto space-y-3">
                  <input 
                    type="text"
                    placeholder="Filter services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-[#FF9900] focus:border-[#FF9900] outline-none"
                  />

                  {[
                    { cat: "Compute", items: ["EC2", "Lambda", "Lightsail", "Fargate", "ECS", "EKS"] },
                    { cat: "Storage", items: ["S3", "EBS", "EFS", "Glacier", "ECR"] },
                    { cat: "Database", items: ["RDS", "DynamoDB", "Aurora", "ElastiCache", "Redshift"] },
                    { cat: "Network", items: ["VPC", "CloudFront", "NAT Gateway", "API Gateway", "Elastic IP"] },
                    { cat: "AI & ML", items: ["SageMaker", "Bedrock", "Comprehend", "Rekognition"] },
                    { cat: "Management", items: ["CloudWatch", "CloudTrail", "Config", "Trusted Advisor"] },
                  ].filter(g => g.items.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))).map(group => (
                    <div key={group.cat} className="bg-[#161b22] rounded-lg p-3 border border-[#30363d]">
                      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{group.cat}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.filter(i => i.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                          <button
                            key={item}
                            onClick={() => handleServiceClick(item)}
                            className="bg-[#0d1117] text-gray-300 text-xs px-3 py-2 rounded-lg border border-[#30363d] hover:border-[#FF9900]/50 hover:text-[#FF9900] transition-colors active:scale-95 active:bg-[#FF9900]/10"
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

            {/* Chat View — Nova AI */}
            {mobileView === "chat" && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden flex flex-col" style={{ height: 'calc(100dvh - 170px)' }}>
                <div className="h-10 bg-[#161b22] flex items-center justify-between border-b border-[#30363d] px-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-[#FF9900] rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-black text-black">D</span>
                    </div>
                    <span className="text-xs font-bold text-white">Dzera Assistant</span>
                    <span className="text-[9px] bg-[#FF9900]/20 text-[#FF9900] px-1.5 py-0.5 rounded font-bold">Nova AI</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-[9px] text-gray-500">Online</span>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ChatInterface className="h-full border-l-0" />
                </div>
              </div>
            )}

            {/* Terminal View — with Output/Debug tabs */}
            {mobileView === "terminal" && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden" style={{ height: 'calc(100dvh - 170px)' }}>
                {/* Tab bar */}
                <div className="h-10 bg-[#161b22] flex items-center justify-between border-b border-[#30363d] px-2">
                  <div className="flex items-center gap-1 h-full overflow-x-auto no-scrollbar">
                    <button 
                      onClick={() => setTerminalPane("terminal")}
                      className={`flex items-center gap-1.5 h-full px-2.5 transition-all shrink-0 ${terminalPane === "terminal" ? "border-b-2 border-[#FF9900] text-gray-200" : "text-gray-500"}`}
                    >
                      <ThemedIcon variant="terminal" size="xs" active={terminalPane === "terminal"} />
                      <span className="text-[11px] font-bold">Terminal</span>
                    </button>
                    <button 
                      onClick={() => setTerminalPane("output")}
                      className={`flex items-center gap-1.5 h-full px-2.5 transition-all shrink-0 ${terminalPane === "output" ? "border-b-2 border-[#FF9900] text-gray-200" : "text-gray-500"}`}
                    >
                      <DLogo size="xs" active={terminalPane === "output"} />
                      <span className="text-[11px] font-bold">Output</span>
                      {outputLogs.length > 0 && <span className="w-1.5 h-1.5 bg-[#FF9900] rounded-full"></span>}
                    </button>
                    <button 
                      onClick={() => setTerminalPane("debug")}
                      className={`flex items-center gap-1.5 h-full px-2.5 transition-all shrink-0 ${terminalPane === "debug" ? "border-b-2 border-[#FF9900] text-gray-200" : "text-gray-500"}`}
                    >
                      <DLogo size="xs" active={terminalPane === "debug"} />
                      <span className="text-[11px] font-bold">Debug</span>
                      {debugLogs.length > 0 && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>}
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      if (terminalPane === "terminal") setLogs([]);
                      if (terminalPane === "output") setOutputLogs([]);
                      if (terminalPane === "debug") setDebugLogs([]);
                    }}
                    className="text-[10px] text-gray-500 hover:text-white shrink-0 ml-2"
                  >
                    Clear
                  </button>
                </div>
                {/* Terminal content */}
                <div className="p-3 h-[calc(100%-40px)] overflow-y-auto font-mono text-xs space-y-1">
                  {terminalPane === "terminal" && (
                    <>
                      {logs.length === 0 ? (
                        <p className="text-gray-500 italic">Awaiting analysis initialization...</p>
                      ) : (
                        logs.map((log, idx) => (
                          <div key={idx} className={`flex items-start gap-2 ${
                            log.type === 'error' ? 'text-red-400' : 
                            log.type === 'warn' ? 'text-yellow-400' : 
                            log.type === 'success' ? 'text-green-400' : 'text-gray-300'
                          }`}>
                            <span className="text-gray-600 shrink-0">›</span>
                            <span className="break-all">{log.msg}</span>
                          </div>
                        ))
                      )}
                      {(step as string) === "scanning" && (
                        <div className="flex items-start gap-2 animate-pulse">
                          <span className="text-gray-600 shrink-0">›</span>
                          <span className="text-[#FF9900]">Analyzing infrastructure...</span>
                        </div>
                      )}
                    </>
                  )}
                  {terminalPane === "output" && (
                    <>
                      {outputLogs.length === 0 ? (
                        <div className="text-gray-600 italic space-y-2">
                          <p>No scan output yet.</p>
                          <p className="text-gray-700 text-[10px]">Run an infrastructure analysis to see structured results here.</p>
                        </div>
                      ) : (
                        outputLogs.map((log, idx) => (
                          <div key={idx} className={`${
                            log.type === 'error' ? 'text-red-400' : 
                            log.type === 'warn' ? 'text-yellow-400' : 
                            log.type === 'success' ? 'text-green-400' : 'text-gray-300'
                          }`} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {log.msg}
                          </div>
                        ))
                      )}
                    </>
                  )}
                  {terminalPane === "debug" && (
                    <>
                      {debugLogs.length === 0 ? (
                        <div className="text-gray-600 italic space-y-2">
                          <p>Debug console ready.</p>
                          <p className="text-gray-700 text-[10px]">API calls, timing, and error traces will appear here during scan and chat operations.</p>
                        </div>
                      ) : (
                        debugLogs.map((log, idx) => (
                          <div key={idx} className={`${
                            log.type === 'error' ? 'text-red-400' : 
                            log.type === 'warn' ? 'text-yellow-400' : 
                            log.type === 'success' ? 'text-green-400' : 'text-purple-300'
                          }`} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {log.msg}
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Service Details View */}
            {mobileView === "details" && activeTab.endsWith('.md') && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden" style={{ height: 'calc(100dvh - 170px)' }}>
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

                        {/* Service Description */}
                        <div className="bg-gradient-to-r from-[#FF9900]/10 to-transparent border-l-2 border-[#FF9900] p-3 rounded-r-lg">
                          <h3 className="text-xs font-bold text-[#FF9900] uppercase tracking-wider mb-2">What is {serviceName.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}?</h3>
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

                        {/* Quick Actions */}
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Actions</h3>
                          <div className="grid grid-cols-3 gap-2">
                            <a 
                              href={`https://console.aws.amazon.com/${serviceName.toLowerCase().replace(/\s+/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center hover:border-[#FF9900]/50 transition-colors active:scale-95"
                            >
                              <ThemedIcon variant="d" size="sm" active />
                              <p className="text-[10px] text-gray-400 mt-1">Console</p>
                            </a>
                            <button 
                              onClick={() => {
                                addLog(`Deep scan initiated for ${serviceName}...`, "info");
                                setMobileView("terminal");
                              }}
                              className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center hover:border-[#FF9900]/50 transition-colors active:scale-95"
                            >
                              <ThemedIcon variant="terminal" size="sm" active />
                              <p className="text-[10px] text-gray-400 mt-1">Scan</p>
                            </button>
                            <button 
                              onClick={() => {
                                setMobileView("chat");
                              }}
                              className="bg-[#FF9900]/10 border border-[#FF9900]/30 rounded-lg p-3 text-center hover:bg-[#FF9900]/20 transition-colors active:scale-95"
                            >
                              <div className="flex justify-center">
                                <div className="w-5 h-5 bg-[#FF9900] rounded-full flex items-center justify-center">
                                  <span className="text-[8px] font-black text-black">D</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-[#FF9900] mt-1 font-semibold">Ask Nova</p>
                            </button>
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div className="bg-gradient-to-r from-[#161b22] to-[#0d1117] border border-[#30363d] rounded-lg p-3">
                          <h3 className="text-xs font-bold text-[#FF9900] mb-2 flex items-center gap-2">
                            <DLogo size="xs" active />
                            Recommendation
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            For comprehensive {serviceName} cost optimization, run a full infrastructure analysis using your AWS credentials. 
                            This will identify specific resources, their costs, and actionable savings opportunities.
                          </p>
                          <button 
                            onClick={() => setMobileView("scan")}
                            className="mt-2 w-full bg-[#FF9900]/10 border border-[#FF9900]/30 text-[#FF9900] text-xs font-bold py-2 rounded-lg hover:bg-[#FF9900]/20 transition-colors active:scale-[0.98]"
                          >
                            → Start Infrastructure Analysis
                          </button>
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
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#30363d]/50">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Explorer</span>
                  <div className="flex items-center gap-1.5 bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-medium text-gray-400">Connected</span>
                  </div>
                </div>
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
                  <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Smart Onboarding Header */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <DLogo size="lg" active />
                          <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Connect AWS Account</h2>
                            <p className="text-gray-400 text-xs flex items-center gap-2">
                              Smart Setup Assistant
                              <span className="text-[9px] bg-[#FF9900]/20 text-[#FF9900] px-1.5 py-0.5 rounded font-bold">Nova AI</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      {onboardingStep !== "skipped" ? (
                        <button onClick={() => setOnboardingStep("skipped")} className="text-xs text-gray-500 hover:text-gray-300 transition-colors border border-[#30363d] px-3 py-1.5 rounded-lg hover:bg-[#161b22]">
                          Skip to form →
                        </button>
                      ) : (
                        <button onClick={() => { setOnboardingStep("welcome"); setOnboardingMessages([{ role: "assistant", content: "Welcome to AWS Dzera! 👋 I'll help you connect your AWS account safely and run your first cost analysis. How familiar are you with AWS?", options: ["I'm new to AWS", "I know the basics", "I'm an AWS expert"] }]); }} className="text-xs text-[#FF9900] hover:text-[#e68a00] transition-colors border border-[#FF9900]/30 px-3 py-1.5 rounded-lg hover:bg-[#FF9900]/10">
                          ← Back to Assistant
                        </button>
                      )}
                    </div>

                    {onboardingStep === "skipped" ? (
                      /* Classic Form */
                      <>
                        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-6 shadow-xl">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Access Key ID</label>
                              <input type="text" placeholder="AKIA..." value={credentials.accessKeyId} onChange={(e) => setCredentials({ ...credentials, accessKeyId: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Secret Access Key</label>
                              <input type="password" placeholder="••••••••••••••••" value={credentials.secretAccessKey} onChange={(e) => setCredentials({ ...credentials, secretAccessKey: e.target.value })} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all" />
                            </div>
                          </div>
                          {error && (
                            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
                              <DLogo size="sm" />
                              <span className="text-sm text-red-200">{error}</span>
                            </div>
                          )}
                          <button onClick={handleVerify} className="w-full bg-[#FF9900] hover:bg-[#e68a00] text-black font-black py-3.5 rounded-lg shadow-lg shadow-orange-500/10 hover:shadow-orange-500/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2">
                            <DLogo size="sm" active />
                            ANALYZE INFRASTRUCTURE
                          </button>
                        </div>
                        <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-5">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0"><DLogo size="sm" /></div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-blue-300">Security Notice</h4>
                              <p className="text-xs text-blue-200/70 leading-relaxed">For optimal security, utilize an IAM user configured with <code className="bg-blue-500/20 px-1 rounded">ReadOnlyAccess</code>. Dzera performs read-only operations and does not modify your resources.</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Smart Onboarding Chat - Desktop */
                      <>
                        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-xl">
                          {/* Chat Messages */}
                          <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
                            {onboardingMessages.map((msg, idx) => (
                              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                {msg.role === "assistant" && (
                                  <div className="w-8 h-8 bg-[#FF9900] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-black text-black">D</span>
                                  </div>
                                )}
                                <div className={`max-w-[80%] ${msg.role === "user" ? "bg-[#FF9900] text-black rounded-2xl rounded-br-sm px-4 py-2.5" : "bg-[#0d1117] border border-[#30363d] text-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5"}`}>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" class="text-[#FF9900] underline hover:text-[#e68a00]">$1</a>').replace(/\n/g, '<br/>') }} />
                                  {msg.options && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {msg.options.map((opt, i) => (
                                        <button
                                          key={i}
                                          onClick={() => {
                                            if (opt === "🚀 Start Analysis") handleVerify();
                                            else if (opt === "Cancel") {
                                              setOnboardingStep("credentials");
                                              setOnboardingMessages(prev => [...prev, { role: "user", content: "Cancel" }, { role: "assistant", content: "No problem! Your credentials are still saved. Click **Start Analysis** whenever you're ready.", options: ["🚀 Start Analysis"] }]);
                                            } else handleOnboardingChoice(opt);
                                          }}
                                          className={`text-xs font-semibold px-4 py-2 rounded-full transition-all active:scale-95 ${opt.includes("🚀") ? "bg-[#FF9900] text-black hover:bg-[#e68a00] shadow-lg shadow-orange-500/20" : opt === "Cancel" ? "bg-[#21262d] text-gray-400 hover:text-white border border-[#30363d]" : "bg-[#21262d] text-[#FF9900] hover:bg-[#FF9900]/20 border border-[#FF9900]/30 hover:border-[#FF9900]"}`}
                                        >
                                          {opt}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {onboardingTyping && (
                              <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 bg-[#FF9900] rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-black text-black">D</span>
                                </div>
                                <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl rounded-bl-sm px-4 py-3">
                                  <div className="flex space-x-1.5">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div ref={onboardingEndRef} />
                          </div>

                          {/* Credential Fields - Desktop */}
                          {(onboardingStep === "credentials" || onboardingStep === "ready") && (
                            <div className="border-t border-[#30363d] p-5 bg-[#0d1117] space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Access Key ID</label>
                                  <input type="text" placeholder="AKIA..." value={credentials.accessKeyId} onChange={(e) => setCredentials(prev => ({ ...prev, accessKeyId: e.target.value }))} className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#FF9900] focus:border-transparent outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Secret Access Key</label>
                                  <input type="password" placeholder="••••••••••••••••" value={credentials.secretAccessKey} onChange={(e) => setCredentials(prev => ({ ...prev, secretAccessKey: e.target.value }))} className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#FF9900] focus:border-transparent outline-none" />
                                </div>
                              </div>
                              {error && (
                                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                                  <DLogo size="sm" />
                                  <span className="text-sm text-red-200">{error}</span>
                                </div>
                              )}
                              <button
                                onClick={onboardingStep === "ready" ? handleVerify : handleOnboardingValidate}
                                className="w-full bg-[#FF9900] hover:bg-[#e68a00] text-black font-black py-3 rounded-lg shadow-lg shadow-orange-500/10 hover:shadow-orange-500/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                              >
                                <DLogo size="sm" active />
                                {onboardingStep === "ready" ? "🚀 Start Analysis" : "Validate & Continue"}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Ask Nova - Desktop */}
                        {onboardingStep === "credentials" && (
                          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                            <div className="flex gap-3 items-center">
                              <DLogo size="sm" active />
                              <input
                                type="text"
                                placeholder="Ask Dzera anything about AWS credentials, IAM, security..."
                                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#FF9900] outline-none placeholder-gray-600"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                    const q = (e.target as HTMLInputElement).value.trim();
                                    (e.target as HTMLInputElement).value = '';
                                    setOnboardingMessages(prev => [...prev, { role: "user", content: q }]);
                                    setTimeout(async () => {
                                      setOnboardingTyping(true);
                                      try {
                                        const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
                                        const apiUrl = isProduction ? 'https://8phpxwcke6.execute-api.us-west-2.amazonaws.com/prod/chat' : '/api/chat';
                                        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: "user", content: q }] }) });
                                        if (response.ok) {
                                          const data = await response.json();
                                          setOnboardingMessages(prev => [...prev, { role: "assistant", content: data.message || "Let me help with that!" }]);
                                        }
                                      } catch { /* silent */ }
                                      setOnboardingTyping(false);
                                    }, 100);
                                  }
                                }}
                              />
                              <span className="text-[10px] text-gray-600 flex-shrink-0 font-bold">Nova AI</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Keep the IAM link for reference */}
                    {onboardingStep !== "skipped" && (
                      <div className="text-center">
                        <a href="https://console.aws.amazon.com/iam" target="_blank" className="text-xs text-gray-500 hover:text-[#FF9900] transition-colors">
                          Open AWS IAM Console →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* End of credentials.aws tab content */}

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

                          {/* Service Description */}
                          <div className="bg-gradient-to-r from-[#161b22] to-[#1c2128] border border-[#30363d] rounded-xl p-6">
                            <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                              <DLogo size="sm" active />
                              What is {serviceName.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}?
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
                    <div 
                      onClick={() => setTerminalPane("terminal")}
                      className={`flex items-center gap-2 h-full px-1 cursor-pointer group transition-all ${terminalPane === "terminal" ? "border-b-2 border-[#FF9900]" : "hover:border-b-2 hover:border-gray-500"}`}
                    >
                      <DLogo size="xs" active={terminalPane === "terminal"} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${terminalPane === "terminal" ? "text-gray-200" : "text-gray-500 group-hover:text-gray-300"}`}>Terminal</span>
                    </div>
                    <div 
                      onClick={() => setTerminalPane("output")}
                      className={`flex items-center gap-2 h-full px-1 cursor-pointer group transition-all ${terminalPane === "output" ? "border-b-2 border-[#FF9900]" : "hover:border-b-2 hover:border-gray-500"}`}
                    >
                      <DLogo size="xs" active={terminalPane === "output"} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${terminalPane === "output" ? "text-gray-200" : "text-gray-500 group-hover:text-gray-300"}`}>Output</span>
                      {outputLogs.length > 0 && <span className="w-1.5 h-1.5 bg-[#FF9900] rounded-full"></span>}
                    </div>
                    <div 
                      onClick={() => setTerminalPane("debug")}
                      className={`flex items-center gap-2 h-full px-1 cursor-pointer group transition-all ${terminalPane === "debug" ? "border-b-2 border-[#FF9900]" : "hover:border-b-2 hover:border-gray-500"}`}
                    >
                      <DLogo size="xs" active={terminalPane === "debug"} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${terminalPane === "debug" ? "text-gray-200" : "text-gray-500 group-hover:text-gray-300"}`}>Debug</span>
                      {debugLogs.length > 0 && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        if (terminalPane === "terminal") setLogs([]);
                        if (terminalPane === "output") setOutputLogs([]);
                        if (terminalPane === "debug") setDebugLogs([]);
                      }}
                      className="text-[10px] text-gray-500 hover:text-gray-300 font-bold uppercase tracking-widest transition-colors flex items-center gap-1 active:scale-95"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${terminalPane === "debug" ? "bg-blue-400" : "bg-green-500"}`}></div>
                      <span className="text-[10px] text-gray-500 font-mono">{terminalPane === "terminal" ? "zsh" : terminalPane === "output" ? "output" : "debug"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-[#30363d] bg-[#0d1117]">
                  {/* Terminal View */}
                  {terminalPane === "terminal" && (
                    <>
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
                    </>
                  )}
                  {/* Output View */}
                  {terminalPane === "output" && (
                    <>
                      {outputLogs.length === 0 ? (
                        <div className="text-gray-600 italic space-y-2">
                          <div className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /> No scan output yet.</div>
                          <div className="text-gray-700 text-[10px]">Run an infrastructure analysis to see structured results here. Output includes findings by severity, estimated costs, and optimization suggestions.</div>
                        </div>
                      ) : (
                        outputLogs.map((log, i) => (
                          <div key={i} className="flex gap-3 group">
                            <span className={`
                              ${log.type === 'error' ? 'text-red-400' : ''}
                              ${log.type === 'warn' ? 'text-yellow-400' : ''}
                              ${log.type === 'success' ? 'text-green-400' : ''}
                              ${log.type === 'info' ? 'text-gray-300' : ''}
                            `} style={{ whiteSpace: 'pre' }}>
                              {log.msg}
                            </span>
                          </div>
                        ))
                      )}
                    </>
                  )}
                  {/* Debug View */}
                  {terminalPane === "debug" && (
                    <>
                      {debugLogs.length === 0 ? (
                        <div className="text-gray-600 italic space-y-2">
                          <div className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Debug console ready.</div>
                          <div className="text-gray-700 text-[10px]">API calls, request/response details, timing, and error traces will appear here during scan and chat operations.</div>
                        </div>
                      ) : (
                        debugLogs.map((log, i) => (
                          <div key={i} className="flex gap-3 group">
                            <span className={`
                              ${log.type === 'error' ? 'text-red-400' : ''}
                              ${log.type === 'warn' ? 'text-yellow-400' : ''}
                              ${log.type === 'success' ? 'text-green-400' : ''}
                              ${log.type === 'info' ? 'text-purple-300' : ''}
                            `} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                              {log.msg}
                            </span>
                          </div>
                        ))
                      )}
                    </>
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
