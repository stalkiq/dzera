// src/components/aws-setup-guide.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

export function AwsSetupGuide({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Create IAM User",
      content: (
        <div className="space-y-3 text-sm">
          <p>
            1. Go to{" "}
            <a
              href="https://console.aws.amazon.com/iam"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline"
            >
              AWS IAM Console
            </a>
          </p>
          <p>2. Click "Users" → "Create user"</p>
          <p>
            3. Name it:{" "}
            <code className="bg-slate-800 px-2 py-1 rounded">
              cost-analyzer-readonly
            </code>
          </p>
          <p>4. Click "Next" (skip permissions for now)</p>
        </div>
      ),
    },
    {
      title: "Attach Read-Only Policy",
      content: (
        <div className="space-y-3 text-sm">
          <p>1. On the user page, click "Add permissions"</p>
          <p>2. Select "Attach policies directly"</p>
          <p>
            3. Search for and select:{" "}
            <code className="bg-slate-800 px-2 py-1 rounded">
              ReadOnlyAccess
            </code>
          </p>
          <p>4. Click "Next" → "Add permissions"</p>
        </div>
      ),
    },
    {
      title: "Create Access Key",
      content: (
        <div className="space-y-3 text-sm">
          <p>1. Click the "Security credentials" tab</p>
          <p>2. Scroll to "Access keys" → "Create access key"</p>
          <p>3. Select "Application running outside AWS"</p>
          <p>4. Click "Next" → "Create access key"</p>
          <p className="text-yellow-400 font-semibold">
            ⚠️ Copy both the Access Key ID and Secret Access Key now. You
            won't see the secret again!
          </p>
        </div>
      ),
    },
    {
      title: "Enter Credentials",
      content: (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Access Key ID"
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Secret Access Key"
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
          />
          <button
            onClick={onComplete}
            className="w-full bg-emerald-500 text-black font-medium py-2 rounded hover:bg-emerald-400"
          >
            Verify & Continue
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Connect Your AWS Account</h2>
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              {idx < currentStep ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <Circle className="h-5 w-5 text-slate-500" />
              )}
              <h3 className="font-medium">{step.title}</h3>
            </div>
            {idx === currentStep && (
              <div className="ml-8">{step.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

