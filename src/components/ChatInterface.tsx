// src/components/ChatInterface.tsx
"use client";

import { useState } from "react";
import { Send, Bot, User } from "lucide-react";

type ChatMessage = {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
};

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className = "" }: ChatInterfaceProps) {
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
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

      // Use API Gateway endpoint in production (via CloudFront /prod/* proxy), local API route in development
      const isProduction = typeof window !== 'undefined' && 
        (window.location.hostname.includes('cloudfront.net') || 
         window.location.hostname.includes('awsdzera.com'));
      const apiUrl = isProduction ? '/prod/chat' : '/api/chat';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
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
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.type === "assistant" && (
              <div className="w-7 h-7 bg-[#FF9900] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-black" />
              </div>
            )}
            <div
              className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-lg text-sm ${
                message.type === "user"
                  ? "bg-[#FF9900] text-black ml-auto"
                  : "bg-[#161b22] text-gray-200 border border-[#30363d]"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className={`text-[10px] mt-1 ${message.type === "user" ? "text-black/70" : "text-gray-500"}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {message.type === "user" && (
              <div className="w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 bg-[#FF9900] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-black" />
            </div>
            <div className="bg-[#161b22] text-gray-200 border border-[#30363d] px-3 py-2 rounded-lg text-sm">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-[#0d1117] border-t border-[#30363d]">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 focus-within:ring-1 focus-within:ring-[#FF9900]">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask anything..."
            rows={2}
            className="w-full bg-transparent border-none text-white text-sm focus:outline-none resize-none px-2"
          />
          <div className="flex items-center justify-between mt-1 px-2">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Nova 2 Lite</span>
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isTyping}
              className="bg-[#FF9900] hover:bg-[#e68a00] disabled:bg-gray-700 text-black p-1.5 rounded transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
