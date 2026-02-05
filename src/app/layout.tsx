import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AWS Dzera - Cost Optimization Tool",
  description: "Identify exactly why your AWS bill is high. Scan your account for expensive resources and get actionable cost-saving recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f7f7f7] text-[#1f2933]`}
      >
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50">
            <div className="h-8 bg-[#131A22]"></div>
            <div className="h-16 bg-[#232f3e] border-b border-[#37474f] flex items-center px-4 sm:px-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#FF9900] rotate-45 rounded-sm"></div>
                <span className="relative text-black font-black text-lg sm:text-xl z-10">D</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-white font-bold text-base sm:text-lg leading-none tracking-tight">AWS Dzera</h1>
                <p className="text-[#FF9900] text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Cost Optimizer</p>
              </div>
            </div>
            
            <nav className="ml-4 sm:ml-8 xl:ml-12 flex items-center gap-3 sm:gap-4 xl:gap-6">
              <Link href="/" className="text-white hover:text-[#FF9900] text-sm font-bold transition-colors whitespace-nowrap">Scanner</Link>
              <Link href="/why-dzera" className="text-gray-300 hover:text-[#FF9900] text-sm font-medium transition-colors whitespace-nowrap">Why Dzera</Link>
            </nav>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
