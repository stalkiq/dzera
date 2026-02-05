// src/app/cli-script/page.tsx
export default function CliScriptPage() {
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

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#0b0f14] px-6 py-10 text-[#e5e7eb]">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="uppercase tracking-widest text-xs font-bold text-[#ff9900]">
            AWS CLI Script
          </p>
          <h1 className="text-3xl font-black text-white">
            Run the same cost discovery from your terminal
          </h1>
          <p className="text-sm text-[#9ca3af]">
            This script uses your local AWS CLI credentials. Make sure you have
            <code className="bg-white border border-[#e5e7eb] rounded px-1.5 py-0.5 mx-1 text-xs">
              aws configure
            </code>
            set up before running.
          </p>
        </header>

        <div className="bg-[#0f141b] border border-[#1f2933] rounded-lg shadow-sm overflow-hidden">
          <div className="bg-[#111827] text-white px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-bold">Script</span>
            <span className="text-xs text-[#ff9900]">Copy + Paste</span>
          </div>
          <pre className="p-4 text-xs leading-relaxed bg-[#0b1220] text-[#e5e7eb] overflow-x-auto">
{script}
          </pre>
        </div>

        <div className="bg-[#0f141b] border border-[#1f2933] rounded-lg p-4 shadow-sm">
          <h2 className="text-base font-bold text-white mb-2">What it checks</h2>
          <ul className="text-sm text-[#9ca3af] list-disc pl-5 space-y-1">
            <li>S3 buckets</li>
            <li>CloudFront distributions</li>
            <li>DynamoDB tables (us-west-2 and us-east-1)</li>
            <li>Running EC2 instances</li>
            <li>NAT Gateways</li>
            <li>Elastic IPs</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

