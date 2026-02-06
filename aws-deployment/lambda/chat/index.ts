// aws-deployment/lambda/chat/index.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import OpenAI from 'openai';

// System prompt for AWS cost optimization context
const SYSTEM_PROMPT = `You are Dzera, an AWS cost optimization assistant. You help users understand their AWS bills, identify cost-saving opportunities, and provide actionable recommendations. 

Key capabilities:
- Explain AWS service costs and pricing models
- Identify common cost drivers (EC2, S3, NAT Gateways, Elastic IPs, etc.)
- Provide optimization strategies for 50+ AWS services
- Guide users through the AWS Dzera scanning process
- Answer questions about AWS infrastructure and billing

Be concise, helpful, and focus on actionable advice. When users ask about specific services, reference the detailed analysis available in the AWS Dzera interface.`;

// Initialize Nova client
function getNovaClient() {
  if (!process.env.NOVA_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.NOVA_API_KEY,
    baseURL: 'https://api.nova.amazon.com/v1',
  });
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { messages } = JSON.parse(event.body || '{}');

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array required' }),
      };
    }

    const novaClient = getNovaClient();
    if (!novaClient) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'NOVA_API_KEY not configured. Please set NOVA_API_KEY in Lambda environment variables.',
        }),
      };
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
      model: 'nova-2-lite-v1',
      messages: novaMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: assistantMessage,
      }),
    };
  } catch (error: any) {
    console.error('Chat Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to get response from Nova',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
    };
  }
};

