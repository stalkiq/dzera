const OpenAI = require('openai').default;

const SYSTEM_PROMPT = `You are Dzera, an AWS cost optimization assistant. You help users understand their AWS bills, identify cost-saving opportunities, and provide actionable recommendations. 

Key capabilities:
- Explain AWS service costs and pricing models
- Identify common cost drivers (EC2, S3, NAT Gateways, Elastic IPs, etc.)
- Provide optimization strategies for 50+ AWS services
- Guide users through the AWS Dzera scanning process
- Answer questions about AWS infrastructure and billing

Be concise, helpful, and focus on actionable advice. When users ask about specific services, reference the detailed analysis available in the AWS Dzera interface.`;

let novaClient = null;

function getNovaClient() {
  if (!novaClient) {
    const apiKey = process.env.NOVA_API_KEY;
    if (!apiKey) return null;
    novaClient = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.nova.amazon.com/v1',
    });
  }
  return novaClient;
}

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
    const { messages } = JSON.parse(event.body || '{}');

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array required' }),
      };
    }

    const client = getNovaClient();
    if (!client) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'NOVA_API_KEY not configured.',
        }),
      };
    }

    // Filter messages: Nova API requires first non-system message to be from 'user'
    // Remove any leading assistant messages (like the initial greeting)
    const cleanedMessages = messages
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }))
      .filter((msg, idx, arr) => {
        // Remove assistant messages that appear before any user message
        if (msg.role === 'assistant') {
          const hasUserBefore = arr.slice(0, idx).some(m => m.role === 'user');
          return hasUserBefore;
        }
        return true;
      });

    const novaMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...cleanedMessages,
    ];

    const response = await client.chat.completions.create({
      model: 'nova-2-lite-v1',
      messages: novaMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: assistantMessage }),
    };
  } catch (error) {
    console.error('Chat Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to get response from Nova',
      }),
    };
  }
};

