'use client';

import React, { useState } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, ArrowDownRight, Check, AlertCircle, RefreshCw, X } from 'lucide-react';
import { PortfolioHolding, VERIFIED_BASE_TOKENIZED_STOCKS } from '@baseindex/shared';
import { useAgenticWallet } from '../../hooks/useAgenticWallet';

interface HoldingsTableProps {
  holdings: PortfolioHolding[];
  onTradeCompleted?: () => void;
  walletAddress?: string;
}

export function HoldingsTable({ holdings, onTradeCompleted, walletAddress }: HoldingsTableProps) {
  const [selectedHolding, setSelectedHolding] = useState<PortfolioHolding | null>(null);
  const [sellPercentage, setSellPercentage] = useState<number>(100);
  const [isSelling, setIsSelling] = useState<boolean>(false);
  const [sellError, setSellError] = useState<string | null>(null);
  const [sellSuccessTx, setSellSuccessTx] = useState<{ txHash: string; explorerUrl: string; amountUSD: number } | null>(null);

  const { executeSellOnChain, ethBalance, address } = useAgenticWallet();

  const handleOpenSell = (h: PortfolioHolding) => {
    setSelectedHolding(h);
    setSellPercentage(100);
    setSellError(null);
    setSellSuccessTx(null);
  };

  const handleExecuteSell = async () => {
    if (!selectedHolding) return;
    setIsSelling(true);
    setSellError(null);

    try {
      const sharesToSell = Number(((selectedHolding.balance * sellPercentage) / 100).toFixed(6));
      const amountUSD = Number(((selectedHolding.balanceUSD * sellPercentage) / 100).toFixed(2));

      // Attempt direct real on-chain Aerodrome DEX sell if wallet has gas
      if (address && ethBalance > 0.00003) {
        try {
          const liveTx = await executeSellOnChain(selectedHolding.ticker, amountUSD, sharesToSell);
          setSellSuccessTx({
            txHash: liveTx.txHash,
            explorerUrl: liveTx.explorerUrl,
            amountUSD: liveTx.amountUSD
          });

          if (onTradeCompleted) {
            onTradeCompleted();
          }
          return;
        } catch (chainErr: any) {
          console.warn('Direct on-chain sell notice, trying backend settlement:', chainErr?.message || chainErr);
        }
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/portfolio/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress || 'default',
          ticker: selectedHolding.ticker,
          shares: sharesToSell,
          amountUSD,
          toAddress: walletAddress || 'default'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to execute sell order on Base Mainnet');
      }

      setSellSuccessTx({
        txHash: data.txHash,
        explorerUrl: data.explorerUrl,
        amountUSD: data.amountUSD
      });

      if (onTradeCompleted) {
        onTradeCompleted();
      }
    } catch (err: any) {
      setSellError(err?.message || 'Error processing sell order');
    } finally {
      setIsSelling(false);
    }
  };

  if (holdings.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs font-mono">
        No tokenized equity holdings found for this address on Base Mainnet.
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Cards View (Visible on < md screens) */}
      <div className="md:hidden divide-y divide-obsidian-border/60">
        {holdings.map((h) => {
          const isPositive = h.change24h >= 0;
          const tokenMeta = VERIFIED_BASE_TOKENIZED_STOCKS[h.ticker] || VERIFIED_BASE_TOKENIZED_STOCKS[h.ticker.replace(/c$/, '')];
          const iconSrc = h.iconUrl || tokenMeta?.iconUrl;

          return (
            <div key={h.ticker} className="p-3.5 space-y-2.5 hover:bg-obsidian-900/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-base-blue/10 border border-obsidian-border flex items-center justify-center font-bold text-blue-500 dark:text-blue-400 text-xs shrink-0 overflow-hidden shadow-sm p-1">
                    {iconSrc ? (
                      <img
                        src={iconSrc}
                        alt={h.ticker}
                        className="w-full h-full object-contain rounded-md"
                        onError={(e) => {
                          // Hide image and fall back to ticker text if URL fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>{h.ticker.substring(0, 3)}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                      {h.ticker}
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {isPositive ? '+' : ''}{h.change24h}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                      {h.name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    ${h.balanceUSD.toFixed(2)}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {h.balance < 0.0001 ? h.balance.toFixed(8) : h.balance.toFixed(4)} {h.ticker}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <a
                  href={h.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-mono px-2.5 py-1.5 rounded-lg bg-obsidian-900 border border-obsidian-border/60"
                >
                  <span>BaseScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={() => handleOpenSell(h)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Sell to USDC</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (Visible on >= md screens) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-obsidian-900/80 border-b border-obsidian-border text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
            <tr>
              <th className="py-2.5 px-3">Asset</th>
              <th className="py-2.5 px-3 text-right">Price</th>
              <th className="py-2.5 px-3 text-right">Holdings</th>
              <th className="py-2.5 px-3 text-right">Value (USD)</th>
              <th className="py-2.5 px-3 text-right">24h</th>
              <th className="py-2.5 px-3 text-center">BaseScan</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-border/50">
            {holdings.map((h) => {
              const isPositive = h.change24h >= 0;
              const tokenMeta = VERIFIED_BASE_TOKENIZED_STOCKS[h.ticker] || VERIFIED_BASE_TOKENIZED_STOCKS[h.ticker.replace(/c$/, '')];
              const iconSrc = h.iconUrl || tokenMeta?.iconUrl;

              return (
                <tr key={h.ticker} className="hover:bg-obsidian-900/40 transition-colors">
                  {/* Asset */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-base-blue/10 border border-obsidian-border flex items-center justify-center font-bold text-blue-500 dark:text-blue-400 text-[10px] shrink-0 overflow-hidden p-1 shadow-sm">
                        {iconSrc ? (
                          <img
                            src={iconSrc}
                            alt={h.ticker}
                            className="w-full h-full object-contain rounded-md"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{h.ticker.substring(0, 3)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{h.ticker}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-[120px]">
                          {h.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-200">
                    ${h.currentPrice.toFixed(2)}
                  </td>

                  {/* Holdings Shares */}
                  <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {h.balance.toFixed(4)}
                  </td>

                  {/* Value USD */}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    ${h.balanceUSD.toFixed(2)}
                  </td>

                  {/* 24h Change */}
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
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
                      title="View on BaseScan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>

                  {/* Sell Action Button */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleOpenSell(h)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-semibold shadow-sm transition-all"
                    >
                      <ArrowDownRight className="w-3 h-3" />
                      Sell to USDC
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Sell Modal */}
      {selectedHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-obsidian-border bg-obsidian-900 shadow-2xl p-5 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-obsidian-border/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-base-blue/10 border border-obsidian-border flex items-center justify-center font-bold text-blue-500 dark:text-blue-400 text-xs shrink-0 overflow-hidden p-1 shadow-sm">
                  {(selectedHolding.iconUrl || VERIFIED_BASE_TOKENIZED_STOCKS[selectedHolding.ticker]?.iconUrl) ? (
                    <img
                      src={selectedHolding.iconUrl || VERIFIED_BASE_TOKENIZED_STOCKS[selectedHolding.ticker]?.iconUrl}
                      alt={selectedHolding.ticker}
                      className="w-full h-full object-contain rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{selectedHolding.ticker.substring(0, 3)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Sell {selectedHolding.ticker} to USDC</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Base Mainnet Instant Liquidation</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHolding(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-obsidian-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Position Summary */}
            <div className="p-3 rounded-xl bg-obsidian-950 border border-obsidian-border/60 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Available Position:</span>
                <span className="text-white font-medium">{selectedHolding.balance.toFixed(4)} {selectedHolding.ticker}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Current Market Value:</span>
                <span className="text-emerald-400 font-bold">${selectedHolding.balanceUSD.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Reference Price:</span>
                <span className="text-slate-200">${selectedHolding.currentPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Percentage Selectors */}
            {!sellSuccessTx && (
              <div className="space-y-3">
                <label className="text-[11px] font-mono text-slate-300 block">Select Amount to Sell:</label>
                <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setSellPercentage(pct)}
                      className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        sellPercentage === pct
                          ? 'bg-red-500/20 border-red-500/60 text-red-300'
                          : 'bg-obsidian-800 border-obsidian-border text-slate-400 hover:text-white'
                      }`}
                    >
                      {pct === 100 ? 'MAX (100%)' : `${pct}%`}
                    </button>
                  ))}
                </div>

                {/* Estimated Proceeds Card */}
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Shares to liquidate:</span>
                    <span className="font-bold text-white">
                      {((selectedHolding.balance * sellPercentage) / 100).toFixed(4)} {selectedHolding.ticker}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-1 border-t border-red-500/20">
                    <span>USDC You Receive:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      +${((selectedHolding.balanceUSD * sellPercentage) / 100).toFixed(2)} USDC
                    </span>
                  </div>
                </div>

                {sellError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{sellError}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isSelling}
                  onClick={handleExecuteSell}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold font-mono shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  {isSelling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Executing On-Chain Sell...
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4" />
                      Confirm & Sell for ${((selectedHolding.balanceUSD * sellPercentage) / 100).toFixed(2)} USDC
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Success State */}
            {sellSuccessTx && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 font-mono">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Sell Executed Successfully!</div>
                <div className="text-[11px] text-emerald-400">
                  +${sellSuccessTx.amountUSD.toFixed(2)} USDC credited to your wallet
                </div>
                <div className="pt-2">
                  <a
                    href={sellSuccessTx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:underline flex items-center justify-center gap-1"
                  >
                    View on BaseScan ({sellSuccessTx.txHash.substring(0, 12)}...)
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <button
                  onClick={() => setSelectedHolding(null)}
                  className="mt-3 w-full py-2 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-xs text-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

