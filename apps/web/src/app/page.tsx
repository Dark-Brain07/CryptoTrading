'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Header } from '../components/navigation/Header';
import { ChatTerminal } from '../components/chat/ChatTerminal';
import { PortfolioTracker } from '../components/portfolio/PortfolioTracker';

export default function Home() {
  const { address } = useAccount();
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleTradeExecuted = () => {
    // Increment counter to notify portfolio tracker to refresh its data
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950 selection:bg-base-blue selection:text-white">
      {/* Top Navigation */}
      <Header />

      {/* Main Split Interface */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
        {/* Left Column: Interactive Agent Chat Terminal (5 cols on lg) */}
        <section className="lg:col-span-5 h-[550px] lg:h-full flex flex-col">
          <ChatTerminal
            walletAddress={address}
            onTradeExecuted={handleTradeExecuted}
          />
        </section>

        {/* Right Column: Live Portfolio & Asset Tracker (7 cols on lg) */}
        <section className="lg:col-span-7 h-[650px] lg:h-full flex flex-col">
          <PortfolioTracker
            walletAddress={address}
            refreshTrigger={refreshCounter}
          />
        </section>
      </main>
    </div>
  );
}
