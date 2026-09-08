'use client';

import React from 'react';
import { ArrowUpRight, Zap } from 'lucide-react';
import { TelegramIcon } from '../common/TelegramIcon';

export function TelegramBanner() {
  return (
    <aside aria-label="Telegram Bot Announcement" className="w-full bg-gradient-to-r from-[#229ED9]/15 via-base-blue/10 to-[#229ED9]/10 border-b border-[#229ED9]/25 shrink-0 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
        <a
          href="https://t.me/CryptoStocksTrd_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 min-w-0 group cursor-pointer"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#229ED9] flex items-center justify-center text-white shrink-0 shadow-sm shadow-[#229ED9]/40 group-hover:scale-105 transition-transform">
            <TelegramIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-white" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#229ED9] dark:group-hover:text-sky-300 transition-colors truncate flex items-center gap-1.5">
              <span>Use Telegram to Trade Tokenized Stocks on Base</span>
              <span className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#229ED9]/20 text-[#229ED9] dark:text-sky-300 text-[10px] font-mono font-semibold">
                <Zap className="w-2.5 h-2.5" /> 24/7 LIVE
              </span>
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
              &middot; 1-click execution on Aerodrome DEX, live quotes &amp; portfolio tracking
            </span>
          </div>
        </a>

        <a
          href="https://t.me/CryptoStocksTrd_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg bg-[#229ED9] hover:bg-[#1d8bc0] text-white text-xs font-semibold shrink-0 shadow-sm shadow-[#229ED9]/30 transition-all hover:scale-105 cursor-pointer"
        >
          <span className="hidden xs:inline">Trade via</span>
          <span>@CryptoStocksTrd_bot</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
}
