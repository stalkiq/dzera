// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize Nova client lazily (only when needed)
function getNovaClient() {
  if (!process.env.NOVA_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.NOVA_API_KEY,
    baseURL: 'https://api.nova.amazon.com/v1',
  });
}

// System prompt for AWS cost optimization context
const SYSTEM_PROMPT = `You are Dzera, an AWS cost optimization assistant. You help users understand their AWS bills, identify cost-saving opportunities, and provide actionable recommendations. 

Key capabilities:
- Explain AWS service costs and pricing models
- Identify common cost drivers (EC2, S3, NAT Gateways, Elastic IPs, etc.)
- Provide optimization strategies for 50+ AWS services
- Guide users through the AWS Dzera scanning process
- Answer questions about AWS infrastructure and billing

Be concise, helpful, and focus on actionable advice. When users ask about specific services, reference the detailed analysis available in the AWS Dzera interface.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const novaClient = getNovaClient();
    if (!novaClient) {
      return NextResponse.json(
        { error: 'NOVA_API_KEY not configured. Please set NOVA_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    // Convert messages to Nova format, adding system prompt
    const novaMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    ];

    // Call Nova API
    const response = await novaClient.chat.completions.create({
      model: 'nova-2-lite-v1', // Using Nova 2 Lite as shown in the image
      messages: novaMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error: any) {
    console.error('Nova API error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to get response from Nova',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

