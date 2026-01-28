// src/app/api/scan/route.ts
import { NextResponse } from "next/server";
import { scanAwsCosts } from "@/lib/costScanner";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("Scan request received");
    const { accessKeyId, secretAccessKey, region } = await req.json();

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { error: "Access Key ID and Secret Access Key required" },
        { status: 400 }
      );
    }

    console.log("Starting AWS cost scan...");
    const result = await scanAwsCosts(accessKeyId, secretAccessKey, region);
    console.log(`Scan completed. Found ${result.findings.length} findings.`);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("AWS cost scan failed", err);
    const errorMessage = err?.message ?? "Unknown error";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      {
        message: "AWS cost scan failed",
        error: errorMessage,
        details: err?.stack,
      },
      { status: 500 }
    );
  }
}
