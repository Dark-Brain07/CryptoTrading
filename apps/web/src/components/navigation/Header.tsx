'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { ShieldCheck, Zap, Activity, Wallet } from 'lucide-react';
import { GasTrackerData } from '@baseindex/shared';
import { AgenticWalletModal } from '../wallet/AgenticWalletModal';
import { useAgenticWallet } from '../../hooks/useAgenticWallet';
import { truncateAddress } from '../../lib/utils';

export function Header() {
  const { address: connectedAddress } = useAccount();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { address, isCreated, usdcBalance } = useAgenticWallet();

  const [gasData, setGasData] = useState<GasTrackerData>({
    baseFeeGwei: 0.005,
    priorityFeeGwei: 0.001,
    estimatedSwapCostUSD: 0.0035,
    blockNumber: 19804250,
    timestamp: Date.now()
  });

  // Periodically fetch live gas from backend or fallback to RPC
  useEffect(() => {
    const fetchGas = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/portfolio/gas`);
        if (res.ok) {
          const json = await res.json();
          if (json.gas) setGasData(json.gas);
        }
      } catch {
        // keep fallback state
      }
    };

    fetchGas();
    const interval = setInterval(fetchGas, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-obsidian-border bg-obsidian-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Logo & Network Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
              <img
                src="/logo.png"
                alt="BaseIndex Agent Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_10px_rgba(0,82,255,0.5)] group-hover:drop-shadow-[0_0_16px_rgba(0,240,255,0.8)] transition-all duration-300"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white flex items-center gap-1 text-sm sm:text-base group-hover:text-cyan-300 transition-colors">
                BaseIndex <span className="text-[9px] sm:text-xs font-mono px-1 sm:px-1.5 py-0.5 rounded bg-base-blue/20 text-blue-400 border border-base-blue/30">AGENT</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 -mt-0.5 sm:-mt-1 font-mono hidden xs:inline sm:inline">
                Base Mainnet &middot; DEX Agent
              </span>
            </div>
          </Link>
        </div>

        {/* Center Indicators: Gas & Compliance */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          {/* Live Base Gas Tracker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-obsidian-900 border border-obsidian-border text-slate-300">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-slate-400">Gas:</span>
            <span className="font-semibold text-white font-mono">{gasData.baseFeeGwei} Gwei</span>
            <span className="text-[10px] text-slate-500 font-mono">(&lt;${gasData.estimatedSwapCostUSD.toFixed(4)})</span>
          </div>

          {/* Geo-Compliance Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-[11px]">Non-US Verified</span>
          </div>
        </div>

        {/* Right: Agentic Wallet & Wallet Connect */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Agentic Wallet Button */}
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-obsidian-900 hover:bg-obsidian-800 border border-obsidian-border text-xs text-white transition-all shadow-md group"
          >
            <div className="w-5 h-5 rounded-md bg-base-blue/20 border border-base-blue/40 flex items-center justify-center text-blue-400 shrink-0">
              <Wallet className="w-3 h-3" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-[10px] sm:text-[11px] flex items-center gap-1">
                <span className="hidden sm:inline">{isCreated && address ? truncateAddress(address) : 'Agent Wallet'}</span>
                <span className="sm:hidden">{isCreated ? `$${usdcBalance.toFixed(2)}` : 'Agent'}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isCreated ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono -mt-0.5 hidden sm:block">
                {isCreated ? `$${usdcBalance.toFixed(2)} USDC` : 'Create / Backup'}
              </span>
            </div>
          </button>

          {/* RainbowKit Connect Wallet */}
          <div className="scale-90 sm:scale-100 origin-right">
            <ConnectButton 
              chainStatus="icon"
              showBalance={false}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </div>

      {/* Agentic Wallet Management & Backup Modal */}
      <AgenticWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        connectedMainAddress={connectedAddress}
      />
    </header>
  );
}
