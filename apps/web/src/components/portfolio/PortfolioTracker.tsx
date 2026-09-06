'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, RefreshCw, ArrowUpRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { PortfolioHolding } from '@baseindex/shared';
import { AssetDistributionChart } from './AssetDistributionChart';
import { HoldingsTable } from './HoldingsTable';

interface PortfolioTrackerProps {
  refreshTrigger?: number;
  walletAddress?: string;
}

export function PortfolioTracker({ refreshTrigger, walletAddress }: PortfolioTrackerProps) {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [totalValueUSD, setTotalValueUSD] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchPortfolio = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const query = walletAddress ? `?wallet=${walletAddress}` : '';
      const res = await fetch(`${apiUrl}/api/portfolio${query}`);

      if (res.ok) {
        const data = await res.json();
        setHoldings(data.holdings || []);
        setTotalValueUSD(data.totalValueUSD || 0);
      }
    } catch (err) {
      console.warn('Could not fetch portfolio from server:', err);
    } finally {
      setIsLoading(false);
      setLastRefreshed(new Date());
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio, refreshTrigger]);

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border-obsidian-border overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="px-5 py-3 border-b border-obsidian-border/80 bg-obsidian-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-base-blue" />
          <span className="text-xs font-mono font-semibold text-slate-200">
            live-portfolio-indexer &middot; base
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={fetchPortfolio}
            disabled={isLoading}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-obsidian-800 transition-colors"
            title="Refresh Portfolio"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Total Value */}
          <div className="p-4 rounded-xl bg-obsidian-900/80 border border-obsidian-border">
            <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
              Indexed Portfolio Value
            </div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              ${totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+2.45% past 24h</span>
              <span className="text-[10px] text-slate-500 font-mono">(&lt;Base Mainnet&gt;)</span>
            </div>
          </div>

          {/* Holdings Counter & Safety */}
          <div className="p-4 rounded-xl bg-obsidian-900/80 border border-obsidian-border flex flex-col justify-between">
            <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
              Underlying Securities Backing
            </div>
            <div className="text-lg font-bold font-mono text-slate-200">
              {holdings.length} Tokenized Assets
            </div>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Audited Dinari dShare & Backed Tokens</span>
            </div>
          </div>
        </div>

        {/* Doughnut Distribution Chart */}
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            Target Asset Weightings
          </div>
          <AssetDistributionChart holdings={holdings} />
        </div>

        {/* Holdings Table */}
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            On-Chain Balances & BaseScan Verification
          </div>
          <div className="rounded-xl border border-obsidian-border bg-obsidian-900/40 overflow-hidden">
            <HoldingsTable
              holdings={holdings}
              onTradeCompleted={fetchPortfolio}
              walletAddress={walletAddress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
