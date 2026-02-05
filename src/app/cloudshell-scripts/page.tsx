// src/app/cloudshell-scripts/page.tsx
"use client";

import { useState } from "react";

export default function CloudShellScriptsPage() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 6))
      .toISOString()
      .slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#0b0f14] px-6 py-10 text-[#e5e7eb]">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="uppercase tracking-widest text-xs font-bold text-[#ff9900]">
            CloudShell Scripts
          </p>
          <h1 className="text-3xl font-black text-white">
            CloudShell categories and example actions
          </h1>
          <p className="text-sm text-[#9ca3af]">
            Use these lists as a reference for what you can safely inspect and
            what requires stronger permissions.
          </p>
        </header>

        <div className="bg-[#0f141b] border border-[#1f2933] rounded-lg p-4 shadow-sm space-y-6 text-sm text-[#d1d5db]">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">Read / inspect (safe)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>List EC2 instances, S3 buckets, CloudFront distributions</li>
              <li>Check DynamoDB tables and replication</li>
              <li>View IAM users/roles (if permitted)</li>
              <li>Show VPCs, subnets, security groups</li>
              <li>Pull cost data from Cost Explorer</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">
              Modify / delete (if your IAM allows it)
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Stop or terminate EC2 instances</li>
              <li>Delete unused S3 buckets</li>
              <li>Disable CloudFront distributions</li>
              <li>Remove DynamoDB replicas</li>
              <li>Delete NAT Gateways, Elastic IPs, etc.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">Automate workflows</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Daily cost scans</li>
              <li>Cleanup scripts</li>
              <li>Tag checking / reporting</li>
              <li>Backups, exports, log collection</li>
            </ul>
          </section>
        </div>

        <div className="bg-[#0f141b] border border-[#1f2933] rounded-lg p-4 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-white">CloudShell scripts for spending visibility</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#9ca3af]">Start date (YYYY-MM-DD)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded bg-[#0b1220] border border-[#1f2933] px-3 py-2 text-sm text-[#e5e7eb] focus:outline-none focus:ring-1 focus:ring-[#ff9900]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#9ca3af]">End date (YYYY-MM-DD)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded bg-[#0b1220] border border-[#1f2933] px-3 py-2 text-sm text-[#e5e7eb] focus:outline-none focus:ring-1 focus:ring-[#ff9900]"
              />
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white">Monthly spend (selected period)</h3>
            <p className="text-sm text-[#9ca3af]">
              Shows total unblended cost per month. Requires Cost Explorer access.
            </p>
            <pre className="p-4 text-xs leading-relaxed bg-[#0b1220] text-[#e5e7eb] overflow-x-auto">
              {`aws ce get-cost-and-usage --time-period Start=${startDate},End=${endDate} --granularity MONTHLY --metrics UnblendedCost`}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white">Top services by cost (selected period)</h3>
            <p className="text-sm text-[#9ca3af]">
              Lists the highest cost services for the selected period.
            </p>
            <pre className="p-4 text-xs leading-relaxed bg-[#0b1220] text-[#e5e7eb] overflow-x-auto">
              {`aws ce get-cost-and-usage --time-period Start=${startDate},End=${endDate} --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE`}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white">Daily spend (selected period)</h3>
            <p className="text-sm text-[#9ca3af]">
              Shows daily spend so you can spot spikes quickly.
            </p>
            <pre className="p-4 text-xs leading-relaxed bg-[#0b1220] text-[#e5e7eb] overflow-x-auto">
              {`aws ce get-cost-and-usage --time-period Start=${startDate},End=${endDate} --granularity DAILY --metrics UnblendedCost`}
            </pre>
            <p className="text-xs text-[#9ca3af]">
              If you see negative values, those are credits or refunds applied to your account.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white">Top regions by cost (selected period)</h3>
            <p className="text-sm text-[#9ca3af]">
              Breaks spend down by AWS region for the selected period.
            </p>
            <pre className="p-4 text-xs leading-relaxed bg-[#0b1220] text-[#e5e7eb] overflow-x-auto">
              {`aws ce get-cost-and-usage --time-period Start=${startDate},End=${endDate} --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=REGION`}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white">Credits and refunds (selected period)</h3>
            <p className="text-sm text-[#9ca3af]">
              Shows credits and refunds applied during the selected period.
            </p>
            <pre className="p-4 text-xs leading-relaxed bg-[#0b1220] text-[#e5e7eb] overflow-x-auto">
              {`aws ce get-cost-and-usage --time-period Start=${startDate},End=${endDate} --granularity MONTHLY --metrics Credits,Refund`}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white">Usage types by service (selected period)</h3>
            <p className="text-sm text-[#9ca3af]">
              Detailed usage types for each service in the selected period.
            </p>
            <pre className="p-4 text-xs leading-relaxed bg-[#0b1220] text-[#e5e7eb] overflow-x-auto">
              {`aws ce get-cost-and-usage --time-period Start=${startDate},End=${endDate} --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=USAGE_TYPE --group-by Type=DIMENSION,Key=SERVICE`}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white">EC2 running instances and types</h3>
            <p className="text-sm text-[#9ca3af]">
              Quick view of running instances that typically drive compute cost.
            </p>
            <pre className="p-4 text-xs leading-relaxed bg-[#0b1220] text-[#e5e7eb] overflow-x-auto">
              {`aws ec2 describe-instances --filters "Name=instance-state-name,Values=running" --query "Reservations[*].Instances[*].{Id:InstanceId,Type:InstanceType,State:State.Name}" --output table`}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white">S3 buckets list</h3>
            <p className="text-sm text-[#9ca3af]">
              Lists buckets so you can check storage growth and lifecycle policies.
            </p>
            <pre className="p-4 text-xs leading-relaxed bg-[#0b1220] text-[#e5e7eb] overflow-x-auto">
              {`aws s3 ls`}
            </pre>
          </section>
        </div>

        <div className="bg-[#0f141b] border border-[#1f2933] rounded-lg p-4 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-white">macOS equivalents</h2>
          <p className="text-sm text-[#9ca3af]">
            CloudShell uses GNU date. If you run these on macOS, use the -v flag instead of -d.
          </p>
          <pre className="p-4 text-xs leading-relaxed bg-[#0b1220] text-[#e5e7eb] overflow-x-auto">
            {`aws ce get-cost-and-usage --time-period Start=$(date -u -v-6m +%Y-%m-01),End=$(date -u +%Y-%m-%d) --granularity MONTHLY --metrics UnblendedCost`}
          </pre>
        </div>
      </div>
    </div>
  );
}

