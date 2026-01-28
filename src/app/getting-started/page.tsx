// src/app/getting-started/page.tsx
"use client";

import { CheckCircle2, AlertCircle, Key, Shield, Play } from "lucide-react";
import Link from "next/link";

export default function GettingStartedPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-[#262626]">Getting Started</h1>
        <p className="text-[#737373] text-lg">
          Follow these simple steps to start optimizing your AWS costs
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#e5e5e5] rounded-full flex items-center justify-center">
              <span className="text-[#525252] font-bold text-lg">1</span>
            </div>
            <h2 className="text-2xl font-semibold text-[#262626]">
              Create an IAM User
            </h2>
          </div>
          <div className="ml-14 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">
                Go to the{" "}
                <a
                  href="https://console.aws.amazon.com/iam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#525252] hover:underline"
                >
                  AWS IAM Console
                </a>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">Click "Users" → "Create user"</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">
                Name it <code className="bg-[#0f0f0f] px-2 py-1 rounded text-emerald-400">aws-dzera-readonly</code>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">Click "Next" (skip permissions for now)</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#e5e5e5] rounded-full flex items-center justify-center">
              <span className="text-[#525252] font-bold text-lg">2</span>
            </div>
            <h2 className="text-2xl font-semibold text-white">
              Attach Read-Only Policy
            </h2>
          </div>
          <div className="ml-14 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">On the user page, click "Add permissions"</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">Select "Attach policies directly"</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">
                Search for and select{" "}
                <code className="bg-[#f5f5f5] px-2 py-1 rounded text-[#525252]">
                  ReadOnlyAccess
                </code>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">Click "Next" → "Add permissions"</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#e5e5e5] rounded-full flex items-center justify-center">
              <span className="text-[#525252] font-bold text-lg">3</span>
            </div>
            <h2 className="text-2xl font-semibold text-white">
              Create Access Keys
            </h2>
          </div>
          <div className="ml-14 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">Click the "Security credentials" tab</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">
                Scroll to "Access keys" → "Create access key"
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">Select "Application running outside AWS"</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#525252] mt-0.5 flex-shrink-0" />
              <p className="text-[#404040]">Click "Next" → "Create access key"</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 font-semibold mb-1">
                    ⚠️ Important: Save Your Keys
                  </p>
                  <p className="text-yellow-700 text-sm">
                    Copy both the Access Key ID and Secret Access Key immediately. You
                    won't be able to see the secret key again after closing this window.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#e5e5e5] rounded-full flex items-center justify-center">
              <span className="text-[#525252] font-bold text-lg">4</span>
            </div>
            <h2 className="text-2xl font-semibold text-white">
              Run Your First Scan
            </h2>
          </div>
          <div className="ml-14 space-y-4">
            <p className="text-[#404040]">
              Now you're ready to scan your AWS account! Go to the Scanner page and
              enter your credentials.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#525252] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#404040] transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Scanning
            </Link>
          </div>
        </section>

        <section className="bg-white border border-[#d4d4d4] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-[#525252]" />
            <h2 className="text-2xl font-semibold text-[#262626]">Security & Privacy</h2>
          </div>
          <div className="space-y-3 text-[#404040]">
            <p>
              <strong className="text-[#262626]">Read-Only Access:</strong> AWS Dzera only uses
              read-only permissions. It cannot modify, delete, or create any resources in
              your AWS account.
            </p>
            <p>
              <strong className="text-[#262626]">No Data Storage:</strong> Your credentials are
              used only for the scan and are never stored. They're sent directly to AWS APIs
              and immediately discarded.
            </p>
            <p>
              <strong className="text-[#262626]">Local Processing:</strong> All scanning happens
              on your machine. Your AWS data never leaves your local environment.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

