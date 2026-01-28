import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeAddressesCommand,
} from "@aws-sdk/client-ec2";
import { CloudFrontClient, ListDistributionsCommand } from "@aws-sdk/client-cloudfront";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

export type Ec2Finding = {
  id: string;
  type: string;
  state: string;
  region: string;
  reason: string;
};

export type CloudFrontFinding = {
  id: string;
  domainName: string;
  aliases: string[];
  priceClass: string;
  comment?: string;
  reason: string;
};

export type DynamoFinding = {
  name: string;
  regions: string[];
  reason: string;
};

export type S3Finding = {
  name: string;
  reason: string;
};

export type ScanResult = {
  ec2: Ec2Finding[];
  cloudfront: CloudFrontFinding[];
  dynamodb: DynamoFinding[];
  s3: S3Finding[];
};

const REGIONS = ["us-west-2", "us-east-1"] as const;

export async function runAwsScan(): Promise<ScanResult> {
  const ec2Findings: Ec2Finding[] = [];
  const cfFindings: CloudFrontFinding[] = [];
  const ddbFindings: DynamoFinding[] = [];
  const s3Findings: S3Finding[] = [];

  // EC2 / NAT / EIPs (costly compute + networking)
  for (const region of REGIONS) {
    const ec2 = new EC2Client({ region });
    const instances = await ec2.send(
      new DescribeInstancesCommand({
        Filters: [{ Name: "instance-state-name", Values: ["running"] }],
      }),
    );
    for (const res of instances.Reservations ?? []) {
      for (const inst of res.Instances ?? []) {
        ec2Findings.push({
          id: inst.InstanceId ?? "unknown",
          type: inst.InstanceType ?? "unknown",
          state: inst.State?.Name ?? "unknown",
          region,
          reason: "Running EC2 instance billed hourly. Stop if not actively used.",
        });
      }
    }
  }

  // CloudFront (distributions & potential old sites)
  const cf = new CloudFrontClient({ region: "us-east-1" });
  const dists = await cf.send(new ListDistributionsCommand({}));
  for (const d of dists.DistributionList?.Items ?? []) {
    const aliases = d.Aliases?.Items ?? [];
    cfFindings.push({
      id: d.Id ?? "unknown",
      domainName: d.DomainName ?? "",
      aliases,
      priceClass: d.PriceClass ?? "",
      comment: d.Comment,
      reason:
        "CloudFront distribution. If this domain is no longer in use, disable and delete to stop charges.",
    });
  }

  // DynamoDB (tables replicated across regions)
  const ddbTablesByRegion: Record<string, string[]> = {};
  for (const region of REGIONS) {
    const ddb = new DynamoDBClient({ region });
    const tables = await ddb.send(new ListTablesCommand({}));
    ddbTablesByRegion[region] = tables.TableNames ?? [];
  }

  const allTableNames = new Set<string>();
  for (const list of Object.values(ddbTablesByRegion)) {
    for (const name of list) allTableNames.add(name);
  }

  for (const name of allTableNames) {
    const regions = REGIONS.filter((r) => ddbTablesByRegion[r].includes(name));
    if (regions.length > 1) {
      ddbFindings.push({
        name,
        regions,
        reason:
          "Table exists in multiple regions (global/replicated). This can double write & storage costs.",
      });
    }
  }

  // S3 (buckets that might be old apps / backups)
  const s3 = new S3Client({ region: "us-west-2" });
  const buckets = await s3.send(new ListBucketsCommand({}));
  for (const b of buckets.Buckets ?? []) {
    if (!b.Name) continue;
    if (
      b.Name.includes("backup") ||
      b.Name.includes("backups") ||
      b.Name.includes("amplify") ||
      b.Name.includes("elasticbeanstalk") ||
      b.Name.includes("musing-browser") ||
      b.Name.includes("rollout-app") === false // non-primary buckets
    ) {
      s3Findings.push({
        name: b.Name,
        reason: "S3 bucket that may belong to an old app or backup. Review size and delete if unused.",
      });
    }
  }

  return { ec2: ec2Findings, cloudfront: cfFindings, dynamodb: ddbFindings, s3: s3Findings };
}



