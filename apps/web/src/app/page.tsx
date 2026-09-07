'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Header } from '../components/navigation/Header';
import { ChatTerminal } from '../components/chat/ChatTerminal';
import { PortfolioTracker } from '../components/portfolio/PortfolioTracker';

export default function Home() {
  const { address } = useAccount();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [mobileTab, setMobileTab] = useState<'chat' | 'portfolio'>('chat');

  const handleTradeExecuted = () => {
    // Increment counter to notify portfolio tracker to refresh its data
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <div className="h-screen flex flex-col bg-obsidian-950 selection:bg-base-blue selection:text-white lg:overflow-hidden">
      {/* Top Navigation */}
      <Header />

      {/* Mobile Tab Switcher (Visible only on < lg screens) */}
      <div className="lg:hidden px-3 pt-2 pb-1 bg-obsidian-950/90 border-b border-obsidian-border/60 sticky top-14 sm:top-16 z-40 backdrop-blur-md">
        <div className="flex items-center p-1 rounded-xl bg-obsidian-900 border border-obsidian-border">
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'chat'
                ? 'bg-base-blue text-white shadow-md shadow-base-blue/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>🤖 AI Trade Terminal</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('portfolio')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'portfolio'
                ? 'bg-base-blue text-white shadow-md shadow-base-blue/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>📊 Portfolio & Holdings</span>
          </button>
        </div>
      </div>

      {/* Main Interface: Side-by-side on lg+, Mobile-Tab switched on mobile */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
        {/* Left Column: Interactive Agent Chat Terminal (5 cols on lg) */}
        <section
          className={`lg:col-span-5 flex flex-col h-full min-h-0 ${
            mobileTab === 'chat' ? 'flex h-[calc(100dvh-8rem)] lg:h-full' : 'hidden lg:flex lg:h-full'
          }`}
        >
          <ChatTerminal
            walletAddress={address}
            onTradeExecuted={handleTradeExecuted}
          />
        </section>

        {/* Right Column: Live Portfolio & Asset Tracker (7 cols on lg) */}
        <section
          className={`lg:col-span-7 flex flex-col h-full min-h-0 ${
            mobileTab === 'portfolio' ? 'flex h-[calc(100dvh-8rem)] lg:h-full' : 'hidden lg:flex lg:h-full'
          }`}
        >
          <PortfolioTracker
            walletAddress={address}
            refreshTrigger={refreshCounter}
          />
        </section>
      </main>
    </div>
  );
}
