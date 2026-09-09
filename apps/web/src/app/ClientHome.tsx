'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Header } from '../components/navigation/Header';
import { TelegramBanner } from '../components/navigation/TelegramBanner';
import { ChatTerminal } from '../components/chat/ChatTerminal';
import { PortfolioTracker } from '../components/portfolio/PortfolioTracker';

export default function ClientHome() {
  const { address } = useAccount();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [mobileTab, setMobileTab] = useState<'chat' | 'portfolio'>('chat');

  const handleTradeExecuted = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <div className="h-full min-h-screen lg:min-h-0 lg:h-screen flex flex-col bg-obsidian-950 selection:bg-base-blue selection:text-white lg:overflow-hidden">
      {/* Top Navigation */}
      <Header />

      {/* Telegram Banner: Trade Tokenized Stocks on Base */}
      <TelegramBanner />

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
            <span>📊 Portfolio &amp; Holdings</span>
          </button>
        </div>
      </div>

      {/* Main Interface */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-4 min-h-0 lg:h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-4rem)] lg:overflow-hidden">
        {/* Left Column: Interactive Agent Terminal */}
        <section
          className={`lg:col-span-5 flex flex-col h-full min-h-0 lg:overflow-hidden ${
            mobileTab === 'chat' ? 'flex h-[calc(100dvh-8rem)] lg:h-full' : 'hidden lg:flex lg:h-full'
          }`}
        >
          <ChatTerminal
            walletAddress={address}
            onTradeExecuted={handleTradeExecuted}
          />
        </section>

        {/* Right Column: Live Portfolio & Asset Tracker */}
        <section
          className={`lg:col-span-7 flex flex-col h-full min-h-0 lg:overflow-hidden ${
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
