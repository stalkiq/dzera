// src/lib/costScanner.ts
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeAddressesCommand,
  DescribeNatGatewaysCommand,
} from "@aws-sdk/client-ec2";
import {
  CloudFrontClient,
  ListDistributionsCommand,
} from "@aws-sdk/client-cloudfront";
import {
  DynamoDBClient,
  ListTablesCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
  S3Client,
  ListBucketsCommand,
  GetBucketVersioningCommand,
} from "@aws-sdk/client-s3";
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";
import {
  LambdaClient,
  ListFunctionsCommand,
} from "@aws-sdk/client-lambda";

export type CostFinding = {
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

type CostScanResult = {
  findings: CostFinding[];
  totalEstimatedMonthlyCost: number;
  totalEstimatedHourlyCost: number;
  startedAt: string;
  finishedAt: string;
};

// Cost estimation helpers (rough estimates based on AWS pricing)
const EC2_HOURLY_COST: Record<string, number> = {
  "t2.micro": 0.0116,
  "t2.small": 0.023,
  "t2.medium": 0.0464,
  "t3.medium": 0.0416,
  "t3.large": 0.0832,
  "m5.large": 0.096,
  "m5.xlarge": 0.192,
};

const getEc2Cost = (instanceType?: string): number => {
  if (!instanceType) return 0.05; // default estimate
  return EC2_HOURLY_COST[instanceType] || 0.10; // fallback
};

export async function scanAwsCosts(
  accessKeyId: string,
  secretAccessKey: string,
  region: string = "us-west-2"
): Promise<CostScanResult> {
  const startedAt = new Date().toISOString();
  const findings: CostFinding[] = [];
  let totalMonthly = 0;
  let totalHourly = 0;

  const regions = ["us-west-2", "us-east-1"];

  // ---------- EC2 Instances (Running) ----------
  for (const reg of regions) {
    try {
      console.log(`Scanning EC2 in ${reg}...`);
      const ec2 = new EC2Client({
        region: reg,
        credentials: { accessKeyId, secretAccessKey },
      });

      const res = await ec2.send(new DescribeInstancesCommand({}));
      const reservations = res.Reservations || [];

      for (const r of reservations) {
        for (const inst of r.Instances || []) {
          const id = inst.InstanceId || "unknown";
          const state = inst.State?.Name;
          const instanceType = inst.InstanceType;

          if (state === "running") {
            const hourlyCost = getEc2Cost(instanceType);
            const monthlyCost = hourlyCost * 24 * 30;

            findings.push({
              service: "EC2",
              resourceId: id,
              resourceName: inst.Tags?.find((t) => t.Key === "Name")?.Value,
              region: reg,
              severity: "critical",
              title: `Running EC2 Instance: ${id}`,
              description: `Instance type: ${instanceType}. Running 24/7 costs approximately $${hourlyCost.toFixed(4)}/hour.`,
              estimatedMonthlyCost: monthlyCost,
              estimatedHourlyCost: hourlyCost,
              suggestion: "Stop this instance if it's not needed 24/7, or use scheduled scaling.",
              actionUrl: `https://console.aws.amazon.com/ec2/v2/home?region=${reg}#Instances:instanceId=${id}`,
            });

            totalHourly += hourlyCost;
            totalMonthly += monthlyCost;
          }
        }
      }
    } catch (err) {
      console.error(`EC2 scan failed for ${reg}:`, err);
    }
  }

  // ---------- EBS Volumes (Unattached) ----------
  for (const reg of regions) {
    try {
      console.log(`Scanning EBS volumes in ${reg}...`);
      const ec2 = new EC2Client({
        region: reg,
        credentials: { accessKeyId, secretAccessKey },
      });

      const volumes = await ec2.send(new DescribeVolumesCommand({}));
      for (const vol of volumes.Volumes || []) {
        if (vol.State === "available" && vol.Attachments?.length === 0) {
          const sizeGb = vol.Size || 0;
          const monthlyCost = sizeGb * 0.10; // ~$0.10/GB/month for gp3

          findings.push({
            service: "EBS",
            resourceId: vol.VolumeId || "unknown",
            region: reg,
            severity: "warning",
            title: `Unattached EBS Volume: ${vol.VolumeId}`,
            description: `${sizeGb} GB volume not attached to any instance. Still incurring storage costs.`,
            estimatedMonthlyCost: monthlyCost,
            estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: "Delete this volume if you don't need the data, or create a snapshot first.",
            actionUrl: `https://console.aws.amazon.com/ec2/v2/home?region=${reg}#Volumes:volumeId=${vol.VolumeId}`,
          });

          totalMonthly += monthlyCost;
        }
      }
    } catch (err) {
      console.error(`EBS scan failed for ${reg}:`, err);
    }
  }

  // ---------- Elastic IPs (Unattached) ----------
  for (const reg of regions) {
    try {
      const ec2 = new EC2Client({
        region: reg,
        credentials: { accessKeyId, secretAccessKey },
      });

      const addresses = await ec2.send(new DescribeAddressesCommand({}));
      for (const addr of addresses.Addresses || []) {
        if (!addr.InstanceId && !addr.NetworkInterfaceId) {
          const monthlyCost = 3.65; // $3.65/month for unattached Elastic IP

          findings.push({
            service: "Elastic IP",
            resourceId: addr.PublicIp || "unknown",
            region: reg,
            severity: "warning",
            title: `Unattached Elastic IP: ${addr.PublicIp}`,
            description: "Elastic IP not associated with any resource. Costs $3.65/month.",
            estimatedMonthlyCost: monthlyCost,
            estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: "Release this Elastic IP if you don't need it.",
            actionUrl: `https://console.aws.amazon.com/ec2/v2/home?region=${reg}#Addresses:`,
          });

          totalMonthly += monthlyCost;
        }
      }
    } catch (err) {
      console.error(`Elastic IP scan failed for ${reg}:`, err);
    }
  }

  // ---------- NAT Gateways ----------
  for (const reg of regions) {
    try {
      const ec2 = new EC2Client({
        region: reg,
        credentials: { accessKeyId, secretAccessKey },
      });

      const natGateways = await ec2.send(new DescribeNatGatewaysCommand({}));
      for (const nat of natGateways.NatGateways || []) {
        if (nat.State === "available") {
          const hourlyCost = 0.045; // ~$0.045/hour + data transfer
          const monthlyCost = hourlyCost * 24 * 30;

          findings.push({
            service: "NAT Gateway",
            resourceId: nat.NatGatewayId || "unknown",
            region: reg,
            severity: "critical",
            title: `Active NAT Gateway: ${nat.NatGatewayId}`,
            description: "NAT Gateway charges ~$0.045/hour plus data transfer costs. Can add up quickly.",
            estimatedMonthlyCost: monthlyCost,
            estimatedHourlyCost: hourlyCost,
            suggestion: "Review if you need this NAT Gateway. Consider using VPC endpoints or removing unused VPCs.",
            actionUrl: `https://console.aws.amazon.com/vpc/home?region=${reg}#NatGateways:natGatewayId=${nat.NatGatewayId}`,
          });

          totalHourly += hourlyCost;
          totalMonthly += monthlyCost;
        }
      }
    } catch (err) {
      console.error(`NAT Gateway scan failed for ${reg}:`, err);
    }
  }

  // ---------- CloudFront Distributions (Enabled) ----------
  try {
    console.log("Scanning CloudFront distributions...");
    const cf = new CloudFrontClient({
      region: "us-east-1",
      credentials: { accessKeyId, secretAccessKey },
    });

    const res = await cf.send(new ListDistributionsCommand({}));
    const list = res.DistributionList;

    if (list?.Items) {
      for (const d of list.Items) {
        if (d.Enabled) {
          const domain = d.Aliases?.Items?.[0] || d.DomainName || d.Id;
          // CloudFront costs vary, estimate based on traffic
          // For enabled distributions, estimate $10-50/month base
          const monthlyCost = 20; // conservative estimate

          findings.push({
            service: "CloudFront",
            resourceId: d.Id || "unknown",
            resourceName: domain,
            region: "global",
            severity: "warning",
            title: `Enabled CloudFront Distribution: ${d.Id}`,
            description: `Distribution for ${domain} is enabled. Costs depend on traffic but typically $10-50+/month.`,
            estimatedMonthlyCost: monthlyCost,
            estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: "Disable and delete if the domain is no longer used.",
            actionUrl: `https://console.aws.amazon.com/cloudfront/v3/home#/distributions/${d.Id}`,
          });

          totalMonthly += monthlyCost;
        }
      }
    }
  } catch (err) {
    console.error("CloudFront scan failed:", err);
  }

  // ---------- DynamoDB (Replicated Tables) ----------
  try {
    console.log("Scanning DynamoDB tables...");
    const ddb = new DynamoDBClient({
      region: "us-west-2",
      credentials: { accessKeyId, secretAccessKey },
    });

    const list = await ddb.send(new ListTablesCommand({}));
    for (const tableName of list.TableNames || []) {
      try {
        const desc = await ddb.send(
          new DescribeTableCommand({ TableName: tableName })
        );
        const replicaCount = desc.Table?.Replicas?.length ?? 0;

        if (replicaCount > 0) {
          // Cross-region replication roughly doubles costs
          const monthlyCost = 50; // estimate

          findings.push({
            service: "DynamoDB",
            resourceId: tableName,
            region: "us-west-2",
            severity: "warning",
            title: `DynamoDB Table with Replicas: ${tableName}`,
            description: `Table has ${replicaCount} cross-region replica(s). Replication significantly increases write costs and storage.`,
            estimatedMonthlyCost: monthlyCost,
            estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: "Remove replicas if you don't need multi-region redundancy.",
            actionUrl: `https://console.aws.amazon.com/dynamodbv2/home?region=us-west-2#table?name=${tableName}`,
          });

          totalMonthly += monthlyCost;
        }
      } catch (err) {
        // Skip tables we can't describe
      }
    }
  } catch (err) {
    console.error("DynamoDB scan failed:", err);
  }

  // ---------- S3 (Versioned Buckets) ----------
  try {
    console.log("Scanning S3 buckets...");
    const s3 = new S3Client({
      region: "us-west-2",
      credentials: { accessKeyId, secretAccessKey },
    });

    const res = await s3.send(new ListBucketsCommand({}));
    for (const b of res.Buckets || []) {
      const name = b.Name!;
      try {
        const versioning = await s3.send(
          new GetBucketVersioningCommand({ Bucket: name })
        );

        if (versioning.Status === "Enabled") {
          const monthlyCost = 10; // estimate for versioning overhead

          findings.push({
            service: "S3",
            resourceId: name,
            region: "us-west-2",
            severity: "info",
            title: `S3 Bucket with Versioning: ${name}`,
            description: "Versioning enabled. Each object update creates a new version, increasing storage costs.",
            estimatedMonthlyCost: monthlyCost,
            estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: "Disable versioning if you don't need object history, or set lifecycle policies to delete old versions.",
            actionUrl: `https://s3.console.aws.amazon.com/s3/buckets/${name}?region=us-west-2`,
          });

          totalMonthly += monthlyCost;
        }
      } catch (err) {
        // Skip buckets we can't access
      }
    }
  } catch (err) {
    console.error("S3 scan failed:", err);
  }

  // ---------- RDS Instances ----------
  for (const reg of regions) {
    try {
      console.log(`Scanning RDS instances in ${reg}...`);
      const rds = new RDSClient({
        region: reg,
        credentials: { accessKeyId, secretAccessKey },
      });

      const instances = await rds.send(new DescribeDBInstancesCommand({}));
      for (const db of instances.DBInstances || []) {
        if (db.DBInstanceStatus === "available") {
          const instanceClass = db.DBInstanceClass || "db.t3.micro";
          // Rough estimate: db.t3.micro ~$15/month, larger instances much more
          const monthlyCost = instanceClass.includes("micro")
            ? 15
            : instanceClass.includes("small")
            ? 30
            : 100;

          findings.push({
            service: "RDS",
            resourceId: db.DBInstanceIdentifier || "unknown",
            region: reg,
            severity: "critical",
            title: `Running RDS Instance: ${db.DBInstanceIdentifier}`,
            description: `Instance class: ${instanceClass}. Running 24/7.`,
            estimatedMonthlyCost: monthlyCost,
            estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: "Review if this database is needed. Consider stopping or downsizing if it's for dev/test.",
            actionUrl: `https://console.aws.amazon.com/rds/home?region=${reg}#database:id=${db.DBInstanceIdentifier}`,
          });

          totalMonthly += monthlyCost;
        }
      }
    } catch (err) {
      console.error(`RDS scan failed for ${reg}:`, err);
    }
  }

  const finishedAt = new Date().toISOString();
  return {
    findings,
    totalEstimatedMonthlyCost: totalMonthly,
    totalEstimatedHourlyCost: totalHourly,
    startedAt,
    finishedAt,
  };
}

