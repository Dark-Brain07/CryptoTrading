'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Globe, ArrowLeft, ExternalLink } from 'lucide-react';

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-950/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full glass-panel rounded-2xl p-8 border border-obsidian-border/80 shadow-2xl relative z-10 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">
          Jurisdictional Access Restriction
        </h1>

        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          BaseIndex Agent facilitates automated trading of <span className="text-slate-200 font-semibold">live tokenized securities</span> issued on Base Mainnet. In compliance with regulatory standards and the U.S. Securities Act, this interface is restricted to non-U.S. persons and jurisdictions outside the United States.
        </p>

        <div className="bg-obsidian-900/80 border border-obsidian-border rounded-xl p-4 text-left mb-6 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span>Detected Status</span>
            <span className="text-red-400 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Restricted Region (US IP)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Protocol</span>
            <span className="text-slate-200 font-mono">Base Mainnet (8453)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Securities Custody</span>
            <span className="text-slate-200">1:1 Backed Qualified Custodians</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-border transition-colors text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Retry Connection
          </Link>
          <a
            href="https://base.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-base-blue hover:bg-base-blueHover text-white transition-colors"
          >
            Learn about Base
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-obsidian-border text-xs text-slate-500 flex items-center justify-center gap-2">
          <Globe className="w-3.5 h-3.5" />
          <span>Vercel Edge Compliance Engine &middot; Geo-Fence Verified</span>
        </div>
      </div>
    </div>
  );
}
