// src/components/sidebar.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Info,
  PlayCircle,
  BookOpen,
  Settings,
  HelpCircle,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: Home, label: "Scanner", href: "/" },
    { icon: Info, label: "What is AWS Dzera", href: "/about" },
    { icon: PlayCircle, label: "Getting Started", href: "/getting-started" },
    { icon: BookOpen, label: "How It Works", href: "/how-it-works" },
    { icon: HelpCircle, label: "FAQ", href: "/faq" },
  ];

  return (
    <div
      className={`h-screen bg-[#e5e5e5] border-r border-[#d4d4d4] flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo/Header */}
      <div className="p-4 border-b border-[#d4d4d4]">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#737373] to-[#525252] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DZ</span>
            </div>
            <div>
              <h1 className="text-[#404040] font-semibold text-sm">AWS Dzera</h1>
              <p className="text-[#737373] text-xs">Cost Optimizer</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-[#737373] to-[#525252] rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">DZ</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#d4d4d4] text-[#262626]"
                    : "text-[#737373] hover:bg-[#e5e5e5] hover:text-[#404040]"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Collapse Button */}
      <div className="p-2 border-t border-[#d4d4d4]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#737373] hover:bg-[#e5e5e5] hover:text-[#404040] transition-colors"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm">Settings</span>}
        </button>
      </div>
    </div>
  );
}

