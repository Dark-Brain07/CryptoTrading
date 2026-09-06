'use client';

import React from 'react';
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { PortfolioHolding } from '@baseindex/shared';

interface HoldingsTableProps {
  holdings: PortfolioHolding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs font-mono">
        No tokenized equity holdings found for this address on Base Mainnet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-obsidian-900/80 border-b border-obsidian-border text-[10px] font-mono uppercase text-slate-400">
          <tr>
            <th className="py-2.5 px-3">Asset</th>
            <th className="py-2.5 px-3 text-right">Price</th>
            <th className="py-2.5 px-3 text-right">Holdings</th>
            <th className="py-2.5 px-3 text-right">Value (USD)</th>
            <th className="py-2.5 px-3 text-right">24h</th>
            <th className="py-2.5 px-3 text-center">BaseScan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-obsidian-border/50">
          {holdings.map((h) => {
            const isPositive = h.change24h >= 0;
            return (
              <tr key={h.ticker} className="hover:bg-obsidian-900/40 transition-colors">
                {/* Asset */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-base-blue/20 border border-base-blue/30 flex items-center justify-center font-bold text-blue-400 text-[10px]">
                      {h.ticker}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{h.ticker}</div>
                      <div className="text-[10px] text-slate-400 hidden sm:block truncate max-w-[120px]">
                        {h.name}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td className="py-3 px-3 text-right font-mono text-slate-200">
                  ${h.currentPrice.toFixed(2)}
                </td>

                {/* Holdings Shares */}
                <td className="py-3 px-3 text-right font-mono text-slate-300">
                  {h.balance.toFixed(4)}
                </td>

                {/* Value USD */}
                <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                  ${h.balanceUSD.toFixed(2)}
                </td>

                {/* 24h Change */}
                <td className="py-3 px-3 text-right">
                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      isPositive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {isPositive ? '+' : ''}{h.change24h}%
                  </span>
                </td>

                {/* BaseScan Link */}
                <td className="py-3 px-3 text-center">
                  <a
                    href={h.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors p-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
