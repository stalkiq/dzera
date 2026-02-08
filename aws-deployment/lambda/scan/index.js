const { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand, DescribeAddressesCommand, DescribeNatGatewaysCommand } = require('@aws-sdk/client-ec2');
const { CloudFrontClient, ListDistributionsCommand } = require('@aws-sdk/client-cloudfront');
const { DynamoDBClient, ListTablesCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, ListBucketsCommand, GetBucketVersioningCommand } = require('@aws-sdk/client-s3');
const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');
const { KMSClient, DecryptCommand } = require('@aws-sdk/client-kms');

// Cost estimation helpers
const EC2_HOURLY_COST = {
  't2.micro': 0.0116, 't2.small': 0.023, 't2.medium': 0.0464,
  't3.micro': 0.0104, 't3.small': 0.0208, 't3.medium': 0.0416, 't3.large': 0.0832,
  'm5.large': 0.096, 'm5.xlarge': 0.192, 'm5.2xlarge': 0.384,
  'r5.large': 0.126, 'r5.xlarge': 0.252,
  'c5.large': 0.085, 'c5.xlarge': 0.17,
};

const getEc2Cost = (instanceType) => {
  if (!instanceType) return 0.05;
  return EC2_HOURLY_COST[instanceType] || 0.10;
};

// Decrypt credentials using KMS
async function decryptCredentials(encryptedCredentials, kmsKeyId) {
  const kms = new KMSClient({});
  const response = await kms.send(new DecryptCommand({
    CiphertextBlob: Buffer.from(encryptedCredentials, 'base64'),
    KeyId: kmsKeyId,
  }));
  const decrypted = JSON.parse(Buffer.from(response.Plaintext).toString('utf-8'));
  return { accessKeyId: decrypted.accessKeyId, secretAccessKey: decrypted.secretAccessKey };
}

// Full scan logic
async function scanAwsCosts(accessKeyId, secretAccessKey, region = 'us-west-2') {
  const startedAt = new Date().toISOString();
  const findings = [];
  let totalMonthly = 0;
  let totalHourly = 0;
  const regions = ['us-west-2', 'us-east-1'];

  // EC2 Instances
  for (const reg of regions) {
    try {
      const ec2 = new EC2Client({ region: reg, credentials: { accessKeyId, secretAccessKey } });
      const res = await ec2.send(new DescribeInstancesCommand({}));
      for (const r of (res.Reservations || [])) {
        for (const inst of (r.Instances || [])) {
          const id = inst.InstanceId || 'unknown';
          const state = inst.State?.Name;
          const instanceType = inst.InstanceType;
          if (state === 'running') {
            const hourlyCost = getEc2Cost(instanceType);
            const monthlyCost = hourlyCost * 24 * 30;
            findings.push({
              service: 'EC2', resourceId: id,
              resourceName: inst.Tags?.find(t => t.Key === 'Name')?.Value,
              region: reg, severity: 'critical',
              title: `Running EC2 Instance: ${id}`,
              description: `Instance type: ${instanceType}. Running 24/7 costs ~$${hourlyCost.toFixed(4)}/hour.`,
              estimatedMonthlyCost: monthlyCost, estimatedHourlyCost: hourlyCost,
              suggestion: "Stop this instance if it's not needed 24/7, or use scheduled scaling.",
              actionUrl: `https://console.aws.amazon.com/ec2/v2/home?region=${reg}#Instances:instanceId=${id}`,
            });
            totalHourly += hourlyCost;
            totalMonthly += monthlyCost;
          }
        }
      }
    } catch (err) { console.error(`EC2 scan failed for ${reg}:`, err.message); }
  }

  // EBS Volumes (Unattached)
  for (const reg of regions) {
    try {
      const ec2 = new EC2Client({ region: reg, credentials: { accessKeyId, secretAccessKey } });
      const volumes = await ec2.send(new DescribeVolumesCommand({}));
      for (const vol of (volumes.Volumes || [])) {
        if (vol.State === 'available' && (!vol.Attachments || vol.Attachments.length === 0)) {
          const sizeGb = vol.Size || 0;
          const monthlyCost = sizeGb * 0.10;
          findings.push({
            service: 'EBS', resourceId: vol.VolumeId || 'unknown', region: reg, severity: 'warning',
            title: `Unattached EBS Volume: ${vol.VolumeId}`,
            description: `${sizeGb} GB volume not attached to any instance. Still incurring storage costs.`,
            estimatedMonthlyCost: monthlyCost, estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: "Delete this volume if you don't need the data, or create a snapshot first.",
            actionUrl: `https://console.aws.amazon.com/ec2/v2/home?region=${reg}#Volumes:volumeId=${vol.VolumeId}`,
          });
          totalMonthly += monthlyCost;
        }
      }
    } catch (err) { console.error(`EBS scan failed for ${reg}:`, err.message); }
  }

  // Elastic IPs (Unattached)
  for (const reg of regions) {
    try {
      const ec2 = new EC2Client({ region: reg, credentials: { accessKeyId, secretAccessKey } });
      const addresses = await ec2.send(new DescribeAddressesCommand({}));
      for (const addr of (addresses.Addresses || [])) {
        if (!addr.InstanceId && !addr.NetworkInterfaceId) {
          const monthlyCost = 3.65;
          findings.push({
            service: 'Elastic IP', resourceId: addr.PublicIp || 'unknown', region: reg, severity: 'warning',
            title: `Unattached Elastic IP: ${addr.PublicIp}`,
            description: 'Elastic IP not associated with any resource. Costs $3.65/month.',
            estimatedMonthlyCost: monthlyCost, estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: "Release this Elastic IP if you don't need it.",
            actionUrl: `https://console.aws.amazon.com/ec2/v2/home?region=${reg}#Addresses:`,
          });
          totalMonthly += monthlyCost;
        }
      }
    } catch (err) { console.error(`Elastic IP scan failed for ${reg}:`, err.message); }
  }

  // NAT Gateways
  for (const reg of regions) {
    try {
      const ec2 = new EC2Client({ region: reg, credentials: { accessKeyId, secretAccessKey } });
      const natGateways = await ec2.send(new DescribeNatGatewaysCommand({}));
      for (const nat of (natGateways.NatGateways || [])) {
        if (nat.State === 'available') {
          const hourlyCost = 0.045;
          const monthlyCost = hourlyCost * 24 * 30;
          findings.push({
            service: 'NAT Gateway', resourceId: nat.NatGatewayId || 'unknown', region: reg, severity: 'critical',
            title: `Active NAT Gateway: ${nat.NatGatewayId}`,
            description: 'NAT Gateway charges ~$0.045/hour plus data transfer costs.',
            estimatedMonthlyCost: monthlyCost, estimatedHourlyCost: hourlyCost,
            suggestion: 'Review if you need this NAT Gateway. Consider VPC endpoints or removing unused VPCs.',
            actionUrl: `https://console.aws.amazon.com/vpc/home?region=${reg}#NatGateways:natGatewayId=${nat.NatGatewayId}`,
          });
          totalHourly += hourlyCost;
          totalMonthly += monthlyCost;
        }
      }
    } catch (err) { console.error(`NAT Gateway scan failed for ${reg}:`, err.message); }
  }

  // CloudFront Distributions
  try {
    const cf = new CloudFrontClient({ region: 'us-east-1', credentials: { accessKeyId, secretAccessKey } });
    const res = await cf.send(new ListDistributionsCommand({}));
    if (res.DistributionList?.Items) {
      for (const d of res.DistributionList.Items) {
        if (d.Enabled) {
          const domain = d.Aliases?.Items?.[0] || d.DomainName || d.Id;
          const monthlyCost = 20;
          findings.push({
            service: 'CloudFront', resourceId: d.Id || 'unknown', resourceName: domain,
            region: 'global', severity: 'warning',
            title: `Enabled CloudFront Distribution: ${d.Id}`,
            description: `Distribution for ${domain}. Costs depend on traffic, typically $10-50+/month.`,
            estimatedMonthlyCost: monthlyCost, estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: 'Disable and delete if the domain is no longer used.',
            actionUrl: `https://console.aws.amazon.com/cloudfront/v3/home#/distributions/${d.Id}`,
          });
          totalMonthly += monthlyCost;
        }
      }
    }
  } catch (err) { console.error('CloudFront scan failed:', err.message); }

  // DynamoDB (Replicated Tables)
  try {
    const ddb = new DynamoDBClient({ region: 'us-west-2', credentials: { accessKeyId, secretAccessKey } });
    const list = await ddb.send(new ListTablesCommand({}));
    for (const tableName of (list.TableNames || [])) {
      try {
        const desc = await ddb.send(new DescribeTableCommand({ TableName: tableName }));
        const replicaCount = desc.Table?.Replicas?.length ?? 0;
        if (replicaCount > 0) {
          const monthlyCost = 50;
          findings.push({
            service: 'DynamoDB', resourceId: tableName, region: 'us-west-2', severity: 'warning',
            title: `DynamoDB Table with Replicas: ${tableName}`,
            description: `Table has ${replicaCount} cross-region replica(s). Increases write costs.`,
            estimatedMonthlyCost: monthlyCost, estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: "Remove replicas if you don't need multi-region redundancy.",
            actionUrl: `https://console.aws.amazon.com/dynamodbv2/home?region=us-west-2#table?name=${tableName}`,
          });
          totalMonthly += monthlyCost;
        }
      } catch (e) { /* Skip tables we can't describe */ }
    }
  } catch (err) { console.error('DynamoDB scan failed:', err.message); }

  // S3 (Versioned Buckets)
  try {
    const s3 = new S3Client({ region: 'us-west-2', credentials: { accessKeyId, secretAccessKey } });
    const res = await s3.send(new ListBucketsCommand({}));
    for (const b of (res.Buckets || [])) {
      const name = b.Name;
      try {
        const versioning = await s3.send(new GetBucketVersioningCommand({ Bucket: name }));
        if (versioning.Status === 'Enabled') {
          const monthlyCost = 10;
          findings.push({
            service: 'S3', resourceId: name, region: 'us-west-2', severity: 'info',
            title: `S3 Bucket with Versioning: ${name}`,
            description: 'Versioning enabled. Each update creates a new version, increasing storage costs.',
            estimatedMonthlyCost: monthlyCost, estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: "Disable versioning or set lifecycle policies to delete old versions.",
            actionUrl: `https://s3.console.aws.amazon.com/s3/buckets/${name}?region=us-west-2`,
          });
          totalMonthly += monthlyCost;
        }
      } catch (e) { /* Skip buckets we can't access */ }
    }
  } catch (err) { console.error('S3 scan failed:', err.message); }

  // RDS Instances
  for (const reg of regions) {
    try {
      const rds = new RDSClient({ region: reg, credentials: { accessKeyId, secretAccessKey } });
      const instances = await rds.send(new DescribeDBInstancesCommand({}));
      for (const db of (instances.DBInstances || [])) {
        if (db.DBInstanceStatus === 'available') {
          const instanceClass = db.DBInstanceClass || 'db.t3.micro';
          const monthlyCost = instanceClass.includes('micro') ? 15 : instanceClass.includes('small') ? 30 : 100;
          findings.push({
            service: 'RDS', resourceId: db.DBInstanceIdentifier || 'unknown', region: reg, severity: 'critical',
            title: `Running RDS Instance: ${db.DBInstanceIdentifier}`,
            description: `Instance class: ${instanceClass}. Running 24/7.`,
            estimatedMonthlyCost: monthlyCost, estimatedHourlyCost: monthlyCost / (24 * 30),
            suggestion: 'Review if this database is needed. Consider stopping or downsizing for dev/test.',
            actionUrl: `https://console.aws.amazon.com/rds/home?region=${reg}#database:id=${db.DBInstanceIdentifier}`,
          });
          totalMonthly += monthlyCost;
        }
      }
    } catch (err) { console.error(`RDS scan failed for ${reg}:`, err.message); }
  }

  return {
    findings,
    totalEstimatedMonthlyCost: totalMonthly,
    totalEstimatedHourlyCost: totalHourly,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}

// Lambda handler
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { encryptedCredentials, accessKeyId: rawAccessKey, secretAccessKey: rawSecretKey, region } = body;

    let accessKeyId = rawAccessKey;
    let secretAccessKey = rawSecretKey;

    if (encryptedCredentials) {
      const kmsKeyId = process.env.KMS_KEY_ID;
      if (!kmsKeyId) throw new Error('KMS_KEY_ID not configured');
      const decrypted = await decryptCredentials(encryptedCredentials, kmsKeyId);
      accessKeyId = decrypted.accessKeyId;
      secretAccessKey = decrypted.secretAccessKey;
    }

    if (!accessKeyId || !secretAccessKey) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'AWS credentials required' }) };
    }

    console.log('Starting scan for access key:', accessKeyId.substring(0, 8) + '...');
    const result = await scanAwsCosts(accessKeyId, secretAccessKey, region);
    console.log(`Scan complete: ${result.findings.length} findings, $${result.totalEstimatedMonthlyCost.toFixed(2)}/month`);

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    console.error('Lambda error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Scan failed', message: err.message || 'Unknown error' }),
    };
  }
};

