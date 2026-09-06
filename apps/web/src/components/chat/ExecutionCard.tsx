'use client';

import React from 'react';
import { ExternalLink, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { ExecutionResult } from '@baseindex/shared';

interface ExecutionCardProps {
  result: ExecutionResult;
}

export function ExecutionCard({ result }: ExecutionCardProps) {
  return (
    <div className="my-3 rounded-xl bg-obsidian-900 border border-emerald-500/30 overflow-hidden shadow-xl shadow-emerald-500/5">
      {/* Header Banner */}
      <div className="bg-emerald-500/10 px-4 py-2.5 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">
            Base Mainnet Execution Confirmed
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Gas: &lt;${result.gasUsedUSD.toFixed(4)}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-obsidian-border text-slate-400">
          <span>Total Capital Deployed</span>
          <span className="text-sm font-bold text-white font-mono">
            ${result.totalAllocatedUSD.toFixed(2)} USDC
          </span>
        </div>

        {/* Asset Breakdown */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Purchased Tokenized Stocks
          </div>
          {result.allocations.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-obsidian-800/80 border border-obsidian-border hover:border-slate-700 transition-colors text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-base-blue/15 border border-base-blue/30 flex items-center justify-center font-bold text-blue-400 text-xs">
                  {item.ticker}
                </div>
                <div>
                  <div className="font-semibold text-white">{item.ticker}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {item.shares} shares
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-semibold text-white">
                  ${item.amountUSD.toFixed(2)}
                </div>
                <a
                  href={item.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-end font-mono mt-0.5"
                >
                  <span>BaseScan</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer verification info */}
        <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>CDP MPC Signer &middot; Chain ID 8453</span>
          </div>
          <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
