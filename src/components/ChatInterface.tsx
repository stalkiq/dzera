// src/components/ChatInterface.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User } from "lucide-react";

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

type ChatMessage = {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
};

interface ChatInterfaceProps {
  className?: string;
  scanResults?: ScanResult | null;
}

/** Build a structured text summary of scan results for the AI context */
function buildScanContext(results: ScanResult): string {
  const critical = results.findings.filter(f => f.severity === "critical");
  const warnings = results.findings.filter(f => f.severity === "warning");
  const infos = results.findings.filter(f => f.severity === "info");

  let ctx = `=== AWS INFRASTRUCTURE SCAN RESULTS ===\n`;
  ctx += `Total estimated monthly cost: $${results.totalEstimatedMonthlyCost?.toFixed(2)}\n`;
  ctx += `Total findings: ${results.findings.length} (${critical.length} critical, ${warnings.length} warnings, ${infos.length} informational)\n`;
  ctx += `Scan period: ${results.startedAt} → ${results.finishedAt}\n\n`;

  results.findings.forEach((f, i) => {
    ctx += `[${i + 1}] ${f.severity.toUpperCase()} — ${f.title}\n`;
    ctx += `    Service: ${f.service} | Resource: ${f.resourceId}${f.resourceName ? ` (${f.resourceName})` : ""} | Region: ${f.region}\n`;
    ctx += `    Cost: ~$${f.estimatedMonthlyCost?.toFixed(2)}/mo ($${f.estimatedHourlyCost?.toFixed(4)}/hr)\n`;
    ctx += `    Description: ${f.description}\n`;
    ctx += `    Suggestion: ${f.suggestion}\n\n`;
  });

  return ctx;
}

/** Build a human-friendly summary message for the chat */
function buildSummaryMessage(results: ScanResult): string {
  const critical = results.findings.filter(f => f.severity === "critical");
  const warnings = results.findings.filter(f => f.severity === "warning");

  let msg = `I've analyzed your AWS infrastructure scan results. Here's what I found:\n\n`;
  msg += `**Total estimated cost: $${results.totalEstimatedMonthlyCost?.toFixed(2)}/month**\n`;
  msg += `**${results.findings.length} findings** — ${critical.length} critical, ${warnings.length} warnings\n\n`;

  if (critical.length > 0) {
    msg += `🔴 **Top issues to address:**\n`;
    critical.slice(0, 3).forEach(f => {
      msg += `• **${f.title}** — ${f.service} in ${f.region} (~$${f.estimatedMonthlyCost?.toFixed(2)}/mo)\n`;
    });
    msg += `\n`;
  }

  if (warnings.length > 0) {
    msg += `🟡 **Optimization opportunities:**\n`;
    warnings.slice(0, 3).forEach(f => {
      msg += `• **${f.title}** — ${f.service} in ${f.region} (~$${f.estimatedMonthlyCost?.toFixed(2)}/mo)\n`;
    });
    msg += `\n`;
  }

  msg += `You can ask me anything about these results — for example:\n`;
  msg += `• "What's my biggest cost driver?"\n`;
  msg += `• "How do I fix the critical issues?"\n`;
  msg += `• "Prioritize my cleanup tasks"\n`;
  msg += `• "How much could I save?"`;

  return msg;
}

export default function ChatInterface({ className = "", scanResults = null }: ChatInterfaceProps) {
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const hasSentSummaryRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Demo chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hi! I'm Dzera, your AWS cost optimization assistant. I can help you understand your AWS bill, identify cost-saving opportunities, and provide recommendations. What would you like to know?",
      timestamp: new Date(Date.now() - 300000)
    },
    {
      id: "2",
      type: "user",
      content: "My AWS bill went from $50 to $200 this month. Can you help me figure out why?",
      timestamp: new Date(Date.now() - 240000)
    },
    {
      id: "3",
      type: "assistant",
      content: "I'd be happy to help you investigate that cost increase! A 4x jump in your AWS bill suggests something significant changed. Here are the most common causes:\n\n**1. New EC2 Instances** - Did you launch any new servers or increase instance sizes?\n**2. Data Transfer** - Large file uploads/downloads or increased traffic\n**3. Storage Growth** - S3, EBS, or database storage expansion\n**4. Forgotten Resources** - NAT Gateways, Elastic IPs, or idle instances\n\nTo get specific answers, I recommend running a scan with your AWS credentials. Would you like me to guide you through that process?",
      timestamp: new Date(Date.now() - 180000)
    },
    {
      id: "4",
      type: "user",
      content: "Yes, please guide me through the scanning process",
      timestamp: new Date(Date.now() - 120000)
    },
    {
      id: "5",
      type: "assistant",
      content: "Perfect! Here's how to scan your AWS account safely:\n\n**Step 1: Create Read-Only Credentials**\n• Go to AWS IAM Console\n• Create a new user with 'ReadOnlyAccess' policy\n• Generate access keys\n\n**Step 2: Run the Scan**\n• Enter your credentials in the editor on the left\n• Click 'SCAN AWS ENVIRONMENT'\n• Wait 30-60 seconds for results\n\n**What the scan finds:**\n• Running EC2 instances and their costs\n• Unattached EBS volumes\n• Unused Elastic IPs\n• NAT Gateway charges\n• CloudFront distributions\n• DynamoDB replication costs\n\nThe scan is completely safe - it only reads your resources, never modifies anything. Ready to try it?",
      timestamp: new Date(Date.now() - 60000)
    }
  ]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // When scan results arrive, auto-post a summary message
  useEffect(() => {
    if (scanResults && scanResults.findings.length > 0 && !hasSentSummaryRef.current) {
      hasSentSummaryRef.current = true;
      const summary = buildSummaryMessage(scanResults);
      setChatMessages(prev => [
        ...prev,
        {
          id: `scan-summary-${Date.now()}`,
          type: "assistant",
          content: summary,
          timestamp: new Date(),
        },
      ]);
    }
    // Reset if results are cleared (new scan)
    if (!scanResults) {
      hasSentSummaryRef.current = false;
    }
  }, [scanResults]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput("");
    setIsTyping(true);

    try {
      // Prepare messages for API (excluding timestamps)
      const apiMessages = [...chatMessages, userMessage].map(msg => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      // Build scan context if results are available
      const scanContext = scanResults && scanResults.findings.length > 0
        ? buildScanContext(scanResults)
        : undefined;

      // Use API Gateway endpoint directly in production, local API route in development
      const isProduction = typeof window !== 'undefined' && 
        !window.location.hostname.includes('localhost');
      const apiUrl = isProduction 
        ? 'https://8phpxwcke6.execute-api.us-west-2.amazonaws.com/prod/chat' 
        : '/api/chat';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages, scanContext }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.message,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `I apologize, but I encountered an error: ${error.message || 'Failed to get response'}. Please make sure the Nova API key is configured. You can still use the demo responses by refreshing the page.`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`bg-[#0d1117] flex flex-col h-full ${className}`}>
      {/* Chat Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 sm:gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.type === "assistant" && (
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#FF9900] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
              </div>
            )}
            <div
              className={`max-w-[85%] sm:max-w-xs lg:max-w-sm px-3 py-2 rounded-2xl text-[13px] sm:text-sm leading-relaxed ${
                message.type === "user"
                  ? "bg-[#FF9900] text-black ml-auto rounded-br-sm"
                  : "bg-[#161b22] text-gray-200 border border-[#30363d] rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              <p className={`text-[9px] sm:text-[10px] mt-1 ${message.type === "user" ? "text-black/60" : "text-gray-500"}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {message.type === "user" && (
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-2 sm:gap-3 justify-start">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#FF9900] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
            </div>
            <div className="bg-[#161b22] text-gray-200 border border-[#30363d] px-3 py-2.5 rounded-2xl rounded-bl-sm text-sm">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-[#FF9900] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[#FF9900] rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                <div className="w-1.5 h-1.5 bg-[#FF9900] rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-2 sm:p-4 bg-[#0d1117] border-t border-[#30363d]">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-2 focus-within:ring-1 focus-within:ring-[#FF9900] focus-within:border-[#FF9900]">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask Dzera about AWS costs..."
            rows={2}
            className="w-full bg-transparent border-none text-white text-[13px] sm:text-sm focus:outline-none resize-none px-2"
          />
          <div className="flex items-center justify-between mt-1 px-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-wider">Nova 2 Lite</span>
              {scanResults && scanResults.findings.length > 0 && (
                <span className="text-[8px] sm:text-[9px] bg-[#FF9900]/15 text-[#FF9900] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {scanResults.findings.length} findings loaded
                </span>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isTyping}
              className="bg-[#FF9900] hover:bg-[#e68a00] disabled:bg-gray-700 disabled:text-gray-500 text-black p-2 sm:p-1.5 rounded-lg transition-colors active:scale-95"
            >
              <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
