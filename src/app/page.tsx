// src/app/page.tsx
"use client";

import { useState } from "react";
import { ExternalLink, X, ChevronRight } from "lucide-react";
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
const serviceDescriptions: Record<string, { desc: string; scans: string[] }> = {
  "ec2": {
    desc: "Elastic Compute Cloud provides scalable virtual servers in the AWS cloud.",
    scans: ["Running instances and their hourly costs", "Instance type and sizing efficiency", "Reserved Instance coverage gaps", "Idle or underutilized instances"]
  },
  "lightsail": {
    desc: "Simplified virtual private servers for straightforward workloads.",
    scans: ["Active instances and bundles", "Snapshot storage costs", "Static IP allocations", "Load balancer configurations"]
  },
  "lambda": {
    desc: "Serverless compute service that runs code in response to events.",
    scans: ["Function invocation frequency", "Memory allocation efficiency", "Provisioned concurrency costs", "Duration and timeout optimization"]
  },
  "s3": {
    desc: "Object storage service offering industry-leading scalability and durability.",
    scans: ["Bucket storage classes", "Lifecycle policy effectiveness", "Versioning overhead", "Cross-region replication costs"]
  },
  "rds": {
    desc: "Managed relational database service supporting multiple database engines.",
    scans: ["Instance sizing and utilization", "Multi-AZ deployment costs", "Storage provisioning", "Backup retention periods"]
  },
  "aurora": {
    desc: "MySQL and PostgreSQL-compatible relational database with enhanced performance.",
    scans: ["Cluster configurations", "Read replica counts", "Serverless capacity units", "Storage I/O patterns"]
  },
  "dynamodb": {
    desc: "Fully managed NoSQL database service with single-digit millisecond latency.",
    scans: ["Provisioned capacity utilization", "On-demand pricing efficiency", "Global table replication", "Backup and restore costs"]
  },
  "cloudfront": {
    desc: "Content delivery network for fast, secure delivery of data and applications.",
    scans: ["Distribution traffic patterns", "Cache hit ratios", "Origin request frequency", "Price class configurations"]
  },
  "nat-gateway": {
    desc: "Managed network address translation service for outbound internet connectivity.",
    scans: ["Gateway hourly charges", "Data processing volumes", "Multi-AZ redundancy costs", "Alternative architecture options"]
  },
  "elastic-ip": {
    desc: "Static IPv4 addresses designed for dynamic cloud computing.",
    scans: ["Unassociated IP charges", "IP address inventory", "Association patterns", "Release recommendations"]
  },
  "vpc": {
    desc: "Virtual Private Cloud enables isolated network environments within AWS.",
    scans: ["NAT Gateway deployments", "VPC endpoint configurations", "Transit Gateway attachments", "Data transfer paths"]
  },
  "api-gateway": {
    desc: "Fully managed service for creating, publishing, and maintaining APIs.",
    scans: ["Request volume and pricing tier", "Cache configurations", "WebSocket connection costs", "REST vs HTTP API efficiency"]
  },
  "ecs": {
    desc: "Container orchestration service for Docker containers.",
    scans: ["Task and service configurations", "Fargate vs EC2 launch types", "Container resource allocation", "Auto-scaling policies"]
  },
  "eks": {
    desc: "Managed Kubernetes service for running containerized applications.",
    scans: ["Cluster management fees", "Node group configurations", "Fargate profile costs", "Add-on service charges"]
  },
  "sagemaker": {
    desc: "Machine learning platform for building, training, and deploying models.",
    scans: ["Notebook instance hours", "Training job costs", "Endpoint hosting charges", "Storage and data transfer"]
  },
  "bedrock": {
    desc: "Generative AI service providing foundation models via API.",
    scans: ["Model invocation costs", "Token consumption patterns", "Provisioned throughput", "Custom model training"]
  },
  "cloudwatch": {
    desc: "Monitoring and observability service for AWS resources and applications.",
    scans: ["Custom metric charges", "Log ingestion and storage", "Dashboard widget costs", "Alarm configuration fees"]
  },
  "iam": {
    desc: "Identity and Access Management controls access to AWS services securely.",
    scans: ["Policy complexity analysis", "Role trust relationships", "Access key rotation status", "Permission boundaries"]
  },
  "kms": {
    desc: "Key Management Service for creating and managing encryption keys.",
    scans: ["Customer managed key costs", "API request charges", "Key rotation configurations", "Cross-account usage"]
  },
  "sns": {
    desc: "Simple Notification Service for pub/sub messaging and mobile notifications.",
    scans: ["Message delivery costs", "SMS pricing tiers", "Topic subscription counts", "Delivery retry configurations"]
  },
  "sqs": {
    desc: "Simple Queue Service for decoupling and scaling microservices.",
    scans: ["Request pricing analysis", "FIFO queue costs", "Message retention periods", "Dead-letter queue usage"]
  },
  "elasticache": {
    desc: "In-memory caching service supporting Redis and Memcached.",
    scans: ["Node type efficiency", "Cluster mode configurations", "Reserved node coverage", "Data tiering options"]
  },
  "redshift": {
    desc: "Cloud data warehouse for analytics at scale.",
    scans: ["Cluster node hours", "Concurrency scaling costs", "Spectrum query charges", "Reserved instance gaps"]
  },
  "athena": {
    desc: "Interactive query service for analyzing data in S3 using SQL.",
    scans: ["Data scanned per query", "Workgroup configurations", "Query result caching", "Partition optimization"]
  },
  "glue": {
    desc: "Serverless data integration service for ETL workloads.",
    scans: ["DPU hour consumption", "Crawler run frequency", "Job bookmark efficiency", "Development endpoint costs"]
  },
  "kinesis": {
    desc: "Real-time data streaming service for analytics and application integration.",
    scans: ["Shard hour charges", "Enhanced fan-out costs", "Data retention periods", "Consumer application efficiency"]
  },
  "cost-explorer": {
    desc: "AWS cost visualization and analysis tool.",
    scans: ["API request charges", "Savings Plans recommendations", "Reserved Instance analysis", "Anomaly detection"]
  },
  "budgets": {
    desc: "Custom budgets for tracking AWS costs and usage.",
    scans: ["Budget action configurations", "Alert threshold settings", "Forecasting accuracy", "Cost allocation tags"]
  },
  "savings-plans": {
    desc: "Flexible pricing model offering lower prices in exchange for commitment.",
    scans: ["Commitment utilization rates", "Coverage recommendations", "Compute vs EC2 plans", "Expiration tracking"]
  },
  "reserved-instances": {
    desc: "Capacity reservations with significant discounts for committed usage.",
    scans: ["Utilization percentages", "Modification opportunities", "Marketplace listings", "Convertible exchange options"]
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

  const addLog = (msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }]);
  };

  const handleTabClick = (tabId: string) => {
    if (!openTabs.includes(tabId)) {
      setOpenTabs([...openTabs, tabId]);
    }
    setActiveTab(tabId);
  };

  const closeTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (openTabs.length === 1) return;
    const newTabs = openTabs.filter(t => t !== tabId);
    setOpenTabs(newTabs);
    if (activeTab === tabId) {
      setActiveTab(newTabs[newTabs.length - 1]);
    }
  };

  const handleServiceClick = (service: string) => {
    setSelectedService(service);
    addLog(`Analyzing ${service} configuration...`, "info");
    addLog(`Retrieving optimization recommendations for ${service}...`, "success");
    
    const tabId = `${service.toLowerCase().replace(/\s+/g, '-')}.md`;
    if (!openTabs.includes(tabId)) {
      setOpenTabs([...openTabs, tabId]);
    }
    setActiveTab(tabId);

    setTimeout(() => {
      addLog(`${service} analysis complete.`, "info");
    }, 800);
  };

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
      scans: ["Resource utilization analysis", "Cost allocation review", "Configuration optimization", "Pricing model recommendations"]
    };
  };

  if (step === "setup") {
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
            <div className="flex items-center gap-2 bg-[#161b22] px-3 py-1.5 rounded-md border border-[#30363d]">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-400">Connected</span>
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden flex h-[800px]">
            {/* Activity Bar */}
            <div className="w-12 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-4 gap-4">
              <div className="group relative">
                <div onClick={() => handleTabClick("credentials.aws")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                  <ThemedIcon variant="files" size="md" active={activeTab === "credentials.aws"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Explorer</div>
              </div>
              
              <div className="group relative">
                <div onClick={() => handleTabClick("cost-reports.md")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                  <ThemedIcon variant="chart" size="md" active={activeTab === "cost-reports.md"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Reports</div>
              </div>

              <div className="group relative">
                <div onClick={() => handleTabClick("scanner.config")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                  <ThemedIcon variant="gear" size="md" active={activeTab === "scanner.config"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Configuration</div>
              </div>

              <div className="group relative">
                <div onClick={() => handleTabClick("aws-services.json")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                  <ThemedIcon variant="grid" size="md" active={activeTab === "aws-services.json"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Service Directory</div>
              </div>

              <div className="group relative">
                <div onClick={() => handleTabClick("search")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                  <ThemedIcon variant="search" size="md" active={activeTab === "search"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Search</div>
              </div>

              <div className="mt-auto flex flex-col gap-4 mb-2">
                <div className="group relative">
                  <div onClick={() => handleTabClick("scanner.config")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                    <ThemedIcon variant="gear" size="md" active={false} />
                  </div>
                  <div className="absolute left-14 bottom-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Settings</div>
                </div>
                <div className="group relative">
                  <div onClick={() => handleTabClick("credentials.aws")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                    <ThemedIcon variant="user" size="md" active={false} />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { cat: "Compute", items: ["EC2", "Lightsail", "Lambda", "Batch", "Elastic Beanstalk", "App Runner", "Fargate"] },
                        { cat: "Containers", items: ["ECS", "EKS", "ECR", "App Mesh"] },
                        { cat: "Storage", items: ["S3", "EFS", "FSx", "S3 Glacier", "Storage Gateway", "AWS Backup"] },
                        { cat: "Database", items: ["RDS", "Aurora", "DynamoDB", "ElastiCache", "Neptune", "DocumentDB", "Redshift"] },
                        { cat: "Networking", items: ["VPC", "CloudFront", "API Gateway", "Route 53", "Direct Connect", "Global Accelerator", "NAT Gateway", "Elastic IP"] },
                        { cat: "Developer Tools", items: ["CodeCommit", "CodeBuild", "CodeDeploy", "CodePipeline", "Cloud9", "CloudShell", "X-Ray"] },
                        { cat: "Management", items: ["CloudWatch", "CloudFormation", "Config", "Systems Manager", "Trusted Advisor", "CloudTrail"] },
                        { cat: "Machine Learning", items: ["SageMaker", "Bedrock", "Comprehend", "Rekognition", "Textract", "Polly", "Lex"] },
                        { cat: "Analytics", items: ["Athena", "EMR", "Kinesis", "QuickSight", "Glue", "OpenSearch", "MSK"] },
                        { cat: "Security", items: ["IAM", "Cognito", "Secrets Manager", "KMS", "WAF", "Shield", "GuardDuty", "Inspector"] },
                        { cat: "Integration", items: ["SNS", "SQS", "EventBridge", "Step Functions", "MQ", "AppFlow"] },
                        { cat: "Cost Management", items: ["Cost Explorer", "Budgets", "Savings Plans", "Reserved Instances"] }
                      ].filter(group => 
                        group.cat.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        group.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).map((group) => (
                        <div key={group.cat} className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex flex-col hover:border-[#FF9900]/30 transition-colors">
                          <div className="bg-[#0d1117] px-4 py-2 border-b border-[#30363d]">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{group.cat}</h3>
                          </div>
                          <div className="p-4 flex-1">
                            <div className="flex flex-wrap gap-2">
                              {group.items.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                                <button 
                                  key={item} 
                                  onClick={() => handleServiceClick(item)}
                                  className={`bg-[#0d1117] border text-[10px] px-2 py-1 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 ${selectedService === item ? "text-[#FF9900] border-[#FF9900] bg-[#FF9900]/10" : "text-gray-300 border-[#30363d] hover:text-[#FF9900] hover:border-[#FF9900]/50"}`}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
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
            <div className="w-12 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-4 gap-4">
              <div className="group relative">
                <div onClick={() => handleTabClick("credentials.aws")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                  <ThemedIcon variant="files" size="md" active={activeTab === "credentials.aws"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Explorer</div>
              </div>
              
              <div className="group relative">
                <div onClick={() => handleTabClick("cost-reports.md")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                  <ThemedIcon variant="chart" size="md" active={activeTab === "cost-reports.md"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Reports</div>
              </div>

              <div className="group relative">
                <div onClick={() => handleTabClick("scanner.config")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                  <ThemedIcon variant="gear" size="md" active={activeTab === "scanner.config"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Configuration</div>
              </div>

              <div className="group relative">
                <div onClick={() => handleTabClick("aws-services.json")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                  <ThemedIcon variant="grid" size="md" active={activeTab === "aws-services.json"} />
                </div>
                <div className="absolute left-14 top-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Services</div>
              </div>

              <div className="mt-auto flex flex-col gap-4 mb-2">
                <div className="group relative">
                  <div onClick={() => handleTabClick("scanner.config")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                    <ThemedIcon variant="gear" size="md" />
                  </div>
                  <div className="absolute left-14 bottom-0 bg-[#161b22] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#30363d] shadow-xl">Settings</div>
                </div>
                <div className="group relative">
                  <div onClick={() => handleTabClick("credentials.aws")} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                    <ThemedIcon variant="gear" size="md" />
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
