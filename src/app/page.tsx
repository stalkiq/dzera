// src/app/page.tsx
"use client";

import { useState } from "react";
import { TrendingUp, AlertTriangle, Info, ExternalLink } from "lucide-react";

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

export default function Home() {
  const [step, setStep] = useState<"setup" | "scanning" | "results">("setup");
  const [credentials, setCredentials] = useState({
    accessKeyId: "",
    secretAccessKey: "",
  });
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      setError("Please enter both credentials");
      return;
    }

    setStep("scanning");
    setError(null);

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `Scan failed with status ${res.status}`);
      }

      const data = (await res.json()) as ScanResult;
      setResult(data);
      setStep("results");
    } catch (e: any) {
      if (e.name === "AbortError") {
        setError("Scan timed out after 2 minutes. Please try again or check your AWS credentials.");
      } else {
        setError(e.message || "Scan failed. Check your AWS credentials and permissions.");
      }
      setStep("setup");
      console.error("Scan error:", e);
    }
  };

  const severityIcon = (s: CostFinding["severity"]) => {
    switch (s) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const severityColor = (s: CostFinding["severity"]) => {
    switch (s) {
      case "critical":
        return "border-red-300 bg-red-50";
      case "warning":
        return "border-yellow-300 bg-yellow-50";
      default:
        return "border-blue-300 bg-blue-50";
    }
  };

  if (step === "setup") {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#404040] px-4 py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-[#262626]">AWS Dzera</h1>
            <p className="text-[#737373]">
              Connect your AWS account to identify exactly why your bill is high
            </p>
          </header>

          <div className="border border-[#d4d4d4] bg-white rounded-lg p-6 space-y-4 shadow-sm">
            <h2 className="text-xl font-semibold text-[#262626]">Enter Your AWS Credentials</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Access Key ID"
                value={credentials.accessKeyId}
                onChange={(e) =>
                  setCredentials({ ...credentials, accessKeyId: e.target.value })
                }
                className="w-full bg-[#fafafa] border border-[#d4d4d4] rounded px-4 py-2 text-[#404040] focus:outline-none focus:ring-2 focus:ring-[#737373] focus:border-transparent"
              />
              <input
                type="password"
                placeholder="Secret Access Key"
                value={credentials.secretAccessKey}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    secretAccessKey: e.target.value,
                  })
                }
                className="w-full bg-[#fafafa] border border-[#d4d4d4] rounded px-4 py-2 text-[#404040] focus:outline-none focus:ring-2 focus:ring-[#737373] focus:border-transparent"
              />
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <button
                onClick={handleVerify}
                className="w-full bg-[#525252] text-white font-medium py-2 rounded hover:bg-[#404040] transition-colors"
              >
                Scan AWS Account
              </button>
            </div>
            <div className="text-xs text-[#737373] pt-4 border-t border-[#d4d4d4]">
              <p>
                <strong>Don't have credentials?</strong> Follow the{" "}
                <a
                  href="https://console.aws.amazon.com/iam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#525252] underline hover:text-[#404040]"
                >
                  step-by-step guide
                </a>{" "}
                to create an IAM user with read-only access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "scanning") {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#404040] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#525252] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-[#262626]">Scanning your AWS account...</p>
          <p className="text-sm text-[#737373]">
            This may take 30-60 seconds
          </p>
          <button
            onClick={() => {
              setStep("setup");
              setError("Scan cancelled by user");
            }}
            className="mt-4 px-4 py-2 bg-white border border-[#d4d4d4] rounded hover:bg-[#f5f5f5] text-sm text-[#404040] shadow-sm"
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
    const infoFindings = result.findings.filter((f) => f.severity === "info");

    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#404040] px-4 py-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-red-600" />
              <h1 className="text-4xl font-bold text-[#262626]">
                I found the exact reason your bill is high
              </h1>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-red-600">
                  ${result.totalEstimatedMonthlyCost.toFixed(2)}
                </span>
                <span className="text-[#737373]">/month estimated</span>
              </div>
              <p className="text-sm text-[#525252] mt-2">
                Based on {result.findings.length} cost-driving resources found
                in your account.
              </p>
            </div>
          </header>

          <section className="space-y-6">
            {criticalFindings.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-[#262626]">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  Critical Issues ({criticalFindings.length})
                </h2>
                <div className="space-y-3">
                  {criticalFindings.map((f, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 ${severityColor(
                        f.severity
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {severityIcon(f.severity)}
                            <h3 className="font-semibold">{f.title}</h3>
                          </div>
                          <p className="text-sm text-[#525252] mb-2">
                            {f.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-[#737373] mb-2">
                            <span>{f.service}</span>
                            <span>•</span>
                            <span>{f.region}</span>
                            <span>•</span>
                            <span className="text-red-600 font-semibold">
                              ~${f.estimatedMonthlyCost.toFixed(2)}/month
                            </span>
                          </div>
                          <p className="text-sm text-[#404040]">
                            💡 {f.suggestion}
                          </p>
                        </div>
                        {f.actionUrl && (
                          <a
                            href={f.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#525252] hover:text-[#404040]"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {warningFindings.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-[#262626]">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  Warnings ({warningFindings.length})
                </h2>
                <div className="space-y-3">
                  {warningFindings.map((f, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 ${severityColor(
                        f.severity
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {severityIcon(f.severity)}
                            <h3 className="font-semibold">{f.title}</h3>
                          </div>
                          <p className="text-sm text-slate-300 mb-2">
                            {f.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                            <span>{f.service}</span>
                            <span>•</span>
                            <span>{f.region}</span>
                            <span>•</span>
                            <span className="text-yellow-600 font-semibold">
                              ~${f.estimatedMonthlyCost.toFixed(2)}/month
                            </span>
                          </div>
                          <p className="text-sm text-emerald-300">
                            💡 {f.suggestion}
                          </p>
                        </div>
                        {f.actionUrl && (
                          <a
                            href={f.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {infoFindings.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-[#262626]">
                  <Info className="h-6 w-6 text-blue-600" />
                  Info ({infoFindings.length})
                </h2>
                <div className="space-y-3">
                  {infoFindings.map((f, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 ${severityColor(
                        f.severity
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {severityIcon(f.severity)}
                            <h3 className="font-semibold">{f.title}</h3>
                          </div>
                          <p className="text-sm text-slate-300 mb-2">
                            {f.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                            <span>{f.service}</span>
                            <span>•</span>
                            <span>{f.region}</span>
                            <span>•</span>
                            <span className="text-blue-600 font-semibold">
                              ~${f.estimatedMonthlyCost.toFixed(2)}/month
                            </span>
                          </div>
                          <p className="text-sm text-emerald-300">
                            💡 {f.suggestion}
                          </p>
                        </div>
                        {f.actionUrl && (
                          <a
                            href={f.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="text-center pt-8">
            <button
              onClick={() => {
                setStep("setup");
                setResult(null);
                setCredentials({ accessKeyId: "", secretAccessKey: "" });
              }}
              className="px-6 py-2 bg-white border border-[#d4d4d4] rounded hover:bg-[#f5f5f5] text-[#404040] shadow-sm"
            >
              Scan Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
