'use client';

import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  ArrowUpRight, 
  ShieldAlert, 
  Download, 
  Eye, 
  EyeOff, 
  Sparkles,
  Send,
  AlertTriangle,
  QrCode,
  Key,
  Upload,
  FolderUp,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useAgenticWallet } from '../../hooks/useAgenticWallet';
import { truncateAddress } from '../../lib/utils';
import { BASE_EXPLORER_URL } from '@baseindex/shared';

interface AgenticWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'overview' | 'withdraw' | 'backup' | 'import';
  connectedMainAddress?: string;
}

export function AgenticWalletModal({
  isOpen,
  onClose,
  initialTab = 'overview',
  connectedMainAddress
}: AgenticWalletModalProps) {
  const {
    address,
    privateKey,
    ethBalance,
    usdcBalance,
    isCreated,
    createWallet,
    importWallet,
    fetchBalances,
    withdrawFunds,
    clearWallet
  } = useAgenticWallet();

  const [activeTab, setActiveTab] = useState<'overview' | 'withdraw' | 'backup' | 'import'>(initialTab);
  const [authMode, setAuthMode] = useState<'create' | 'import'>('create');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [securityAcknowledged, setSecurityAcknowledged] = useState(false);
  const [autoHideSeconds, setAutoHideSeconds] = useState(30);

  // Import form state
  const [importKeyInput, setImportKeyInput] = useState('');
  const [isImportMasked, setIsImportMasked] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync active tab when initialTab or isOpen changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      setIsRevealed(false);
      setSecurityAcknowledged(false);
      setAutoHideSeconds(30);
      setImportError(null);
      setImportSuccess(false);
      if (initialTab === 'import') setAuthMode('import');
    }
  }, [isOpen, initialTab]);

  // Auto-hide private key after 30 seconds for sensitivity and security
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRevealed && autoHideSeconds > 0) {
      timer = setTimeout(() => {
        setAutoHideSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isRevealed && autoHideSeconds <= 0) {
      setIsRevealed(false);
      setAutoHideSeconds(30);
    }
    return () => clearTimeout(timer);
  }, [isRevealed, autoHideSeconds]);

  // Withdraw form state
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAsset, setWithdrawAsset] = useState<'USDC' | 'ETH'>('USDC');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawTx, setWithdrawTx] = useState<{ txHash: string; explorerUrl: string } | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBalances();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleCreate = () => {
    createWallet();
    setActiveTab('overview');
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawTx(null);

    if (!withdrawAddress || !withdrawAddress.startsWith('0x') || withdrawAddress.length !== 42) {
      setWithdrawError('Please enter a valid 42-character Base Mainnet address (0x...)');
      return;
    }

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawError('Please enter a valid amount greater than 0');
      return;
    }

    const maxBal = withdrawAsset === 'USDC' ? usdcBalance : ethBalance;
    if (amountNum > maxBal && maxBal > 0) {
      setWithdrawError(`Insufficient ${withdrawAsset} balance. Max available: ${maxBal}`);
      return;
    }

    setIsWithdrawing(true);
    try {
      const outcome = await withdrawFunds(withdrawAddress as `0x${string}`, amountNum, withdrawAsset);
      setWithdrawTx(outcome);
      setWithdrawAmount('');
    } catch (err: any) {
      setWithdrawError(err?.message || 'Withdrawal failed on Base Mainnet');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDownloadBackup = () => {
    if (!address || !privateKey) return;
    const backupData = {
      app: 'BaseIndex Agent',
      network: 'Base Mainnet (Chain ID 8453)',
      address: address,
      privateKey: privateKey,
      exportTimestamp: new Date().toISOString(),
      securityWarning: 'NEVER share this file or private key with anyone. Store offline in a secure location.'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baseindex-agentic-wallet-${address.substring(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportKeyInput(content);
        setImportError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    if (!importKeyInput.trim()) {
      setImportError('Please enter your 64-character private key or upload a keystore JSON file.');
      return;
    }
    try {
      importWallet(importKeyInput.trim());
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        setActiveTab('overview');
        setAuthMode('create');
        setImportKeyInput('');
      }, 800);
    } catch (err: any) {
      setImportError(err?.message || 'Failed to import wallet. Please check key format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-lg w-full glass-panel rounded-2xl border-obsidian-border shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-obsidian-border bg-obsidian-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-base-blue/20 border border-base-blue/40 flex items-center justify-center text-blue-400 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 sm:gap-2">
                Agentic Smart Wallet
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  BASE
                </span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                Client-Isolated &middot; 100% Self-Custodial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-obsidian-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        {isCreated && (
          <div className="flex border-b border-obsidian-border bg-obsidian-950 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 sm:py-2.5 text-center font-medium transition-colors border-b-2 text-[11px] sm:text-xs ${
                activeTab === 'overview'
                  ? 'border-base-blue text-slate-900 dark:text-white bg-obsidian-900/50 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Deposit<span className="hidden sm:inline"> & Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 py-2 sm:py-2.5 text-center font-medium transition-colors border-b-2 text-[11px] sm:text-xs ${
                activeTab === 'withdraw'
                  ? 'border-base-blue text-slate-900 dark:text-white bg-obsidian-900/50 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Withdraw<span className="hidden sm:inline"> Funds</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-2 sm:py-2.5 text-center font-medium transition-colors border-b-2 text-[11px] sm:text-xs ${
                activeTab === 'backup'
                  ? 'border-base-blue text-slate-900 dark:text-white bg-obsidian-900/50 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Backup<span className="hidden sm:inline"> & Key</span>
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-2 sm:py-2.5 text-center font-medium transition-colors border-b-2 text-[11px] sm:text-xs ${
                activeTab === 'import'
                  ? 'border-base-blue text-slate-900 dark:text-white bg-obsidian-900/50 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Import<span className="hidden sm:inline"> / Switch</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!isCreated ? (
            /* Creation & Import Pre-Login View */
            <div className="space-y-4">
              <div className="flex rounded-xl bg-obsidian-950 p-1 border border-obsidian-border max-w-sm mx-auto">
                <button
                  onClick={() => setAuthMode('create')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    authMode === 'create'
                      ? 'bg-base-blue text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Create New Wallet
                </button>
                <button
                  onClick={() => setAuthMode('import')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    authMode === 'import'
                      ? 'bg-base-blue text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  Import Existing
                </button>
              </div>

              {authMode === 'create' ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-base-blue/10 border border-base-blue/30 flex items-center justify-center mx-auto text-blue-400 shadow-xl shadow-base-blue/10">
                    <Sparkles className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white mb-1">
                      Create Your Agentic Trading Wallet
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Generate an isolated, autonomous on-chain wallet on Base Mainnet. Back up your private key anytime and withdraw whenever you want.
                    </p>
                  </div>

                  <div className="bg-obsidian-900/80 border border-obsidian-border rounded-xl p-3.5 text-left text-[11px] text-slate-300 space-y-1.5 max-w-sm mx-auto">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Sub-second autonomous trade execution</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>No signature pop-ups on every trade</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>100% exportable to MetaMask / Coinbase Wallet</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCreate}
                    className="w-full max-w-sm py-3 px-4 rounded-xl bg-base-blue hover:bg-base-blueHover text-white text-xs font-bold transition-all shadow-lg shadow-base-blue/25 flex items-center justify-center gap-2 mx-auto"
                  >
                    <Wallet className="w-4 h-4" />
                    Generate Agentic Wallet Now
                  </button>
                </div>
              ) : (
                /* Import Form on Pre-Login */
                <form onSubmit={handleImportSubmit} className="space-y-4 py-2 text-left">
                  <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-blue-400" />
                      <span>Login to Existing Agentic Wallet</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Paste your raw 64-character private key (0x...) or upload your exported Keystore JSON backup file.
                    </p>
                  </div>

                  {importError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{importError}</span>
                    </div>
                  )}

                  {importSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Wallet Imported Successfully! Loading balances...</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-slate-400 uppercase">
                        Private Key or Keystore JSON
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsImportMasked(!isImportMasked)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                      >
                        {isImportMasked ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{isImportMasked ? 'Show' : 'Mask'}</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={importKeyInput}
                      onChange={(e) => setImportKeyInput(e.target.value)}
                      placeholder="0x... or paste entire JSON backup content"
                      className={`w-full bg-obsidian-950 border border-obsidian-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-base-blue ${
                        isImportMasked ? 'filter blur-[1.5px] hover:filter-none transition-all' : ''
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 rounded-lg bg-obsidian-900 hover:bg-obsidian-800 border border-obsidian-border text-xs text-slate-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      Upload Keystore Backup File (.json)
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-obsidian-950/80 border border-obsidian-border/80 text-[11px] text-slate-400 flex items-start gap-2">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-300 block">100% Client-Side Isolated</strong>
                      Your key is loaded into local browser storage. It is never transmitted over any network.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!importKeyInput.trim()}
                    className="w-full py-3 px-4 rounded-xl bg-base-blue hover:bg-base-blueHover disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-base-blue/25 flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Import & Login to Wallet
                  </button>
                </form>
              )}
            </div>
          ) : activeTab === 'overview' ? (
            /* Overview & Deposit Tab */
            <div className="space-y-4">
              {/* Address Card */}
              <div className="p-4 rounded-xl bg-obsidian-900 border border-obsidian-border space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Your Base Deposit Address</span>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1 text-[11px] text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-mono"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-obsidian-950 border border-obsidian-border/80">
                  <span className="font-mono text-xs text-slate-900 dark:text-white truncate max-w-[260px] sm:max-w-[340px]">
                    {address}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => handleCopy(address || '')}
                      className="p-1.5 rounded-md bg-obsidian-800 hover:bg-obsidian-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Copy Address"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={`${BASE_EXPLORER_URL}/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md bg-obsidian-800 hover:bg-obsidian-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="View on BaseScan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Balances Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-obsidian-900/80 border border-obsidian-border">
                  <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Base USDC (Trading)
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    ${usdcBalance.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Native Base Settlement</div>
                </div>

                <div className="p-3.5 rounded-xl bg-obsidian-900/80 border border-obsidian-border">
                  <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1">
                    ETH Balance (Gas)
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-200">
                    {ethBalance.toFixed(4)} ETH
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Gas Cost &lt;$0.003/tx</div>
                </div>
              </div>

              {/* Deposit Instructions */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                <div className="font-semibold text-blue-600 dark:text-blue-300 flex items-center gap-1.5">
                  <span>How to Fund Your Agentic Wallet:</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Send <strong className="text-slate-900 dark:text-white">USDC on Base Mainnet</strong> (and a small fraction of ETH for gas) from your Coinbase account or MetaMask to the address above. Your agent will detect it automatically!
                </p>
              </div>
            </div>
          ) : activeTab === 'withdraw' ? (
            /* Withdraw Tab */
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {withdrawTx ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Withdrawal Dispatched!</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Your funds are on their way to your personal wallet.
                    </p>
                  </div>
                  <a
                    href={withdrawTx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-blue-400 hover:text-blue-300 underline"
                  >
                    View on BaseScan ({truncateAddress(withdrawTx.txHash)})
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setWithdrawTx(null)}
                    className="block w-full py-2 px-3 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-xs text-slate-200 mt-2 font-medium"
                  >
                    New Withdrawal
                  </button>
                </div>
              ) : (
                <>
                  {withdrawError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{withdrawError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase">
                      Destination Address (Your Main Wallet)
                    </label>
                    <input
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder="0x... (MetaMask, Coinbase, Ledger)"
                      className="w-full bg-obsidian-950 border border-obsidian-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-base-blue"
                    />
                    {connectedMainAddress && (
                      <button
                        type="button"
                        onClick={() => setWithdrawAddress(connectedMainAddress)}
                        className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-mono text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <span>⚡ Use Connected Wallet ({truncateAddress(connectedMainAddress)})</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase flex items-center justify-between">
                        <span>Amount</span>
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(withdrawAsset === 'USDC' ? usdcBalance.toString() : ethBalance.toString())}
                          className="text-blue-400 hover:text-blue-300 text-[10px]"
                        >
                          MAX
                        </button>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-obsidian-950 border border-obsidian-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-base-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase">
                        Asset
                      </label>
                      <select
                        value={withdrawAsset}
                        onChange={(e) => setWithdrawAsset(e.target.value as any)}
                        className="w-full bg-obsidian-950 border border-obsidian-border rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-base-blue"
                      >
                        <option value="USDC">USDC</option>
                        <option value="ETH">ETH</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-obsidian-900 text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Available Balance:</span>
                      <span className="font-mono text-white">
                        {withdrawAsset === 'USDC' ? `$${usdcBalance.toFixed(2)} USDC` : `${ethBalance.toFixed(4)} ETH`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Gas:</span>
                      <span className="font-mono text-emerald-400">&lt;$0.003 USD (Base)</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isWithdrawing || !withdrawAddress || !withdrawAmount}
                    className="w-full py-3 px-4 rounded-xl bg-base-blue hover:bg-base-blueHover disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-base-blue/20 flex items-center justify-center gap-2"
                  >
                    {isWithdrawing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Broadcasting to Base Mainnet...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Confirm Withdrawal
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          ) : activeTab === 'backup' ? (
            /* Backup & Security Tab (Sensitive Task) */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white block mb-0.5">Sensitive Task: Private Key & Backup Protocol</strong>
                  Never reveal or transmit this key. Anyone who acquires your private key has permanent custody of all funds.
                </div>
              </div>

              {!isRevealed ? (
                /* Pre-Reveal Security Confirmation */
                <div className="p-4 rounded-xl bg-obsidian-900 border border-obsidian-border space-y-3">
                  <div className="text-xs font-semibold text-white">Security Verification Before Reveal:</div>
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={securityAcknowledged}
                      onChange={(e) => setSecurityAcknowledged(e.target.checked)}
                      className="mt-0.5 rounded border-obsidian-border bg-obsidian-950 text-base-blue focus:ring-base-blue"
                    />
                    <span>I confirm I am in a private environment and no one is recording or viewing my screen.</span>
                  </label>

                  <button
                    disabled={!securityAcknowledged}
                    onClick={() => {
                      setIsRevealed(true);
                      setAutoHideSeconds(30);
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-red-600/80 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Reveal Sensitive Private Key
                  </button>
                </div>
              ) : (
                /* Active Revealed View with Auto-Hide Countdown */
                <div className="p-4 rounded-xl bg-obsidian-900 border border-red-500/40 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                      Auto-hiding in {autoHideSeconds}s for safety
                    </span>
                    <button
                      onClick={() => setIsRevealed(false)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Hide Key Now
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-obsidian-950 border border-red-500/20 font-mono text-xs break-all text-amber-300 select-all">
                    {privateKey}
                  </div>

                  <button
                    onClick={() => handleCopy(privateKey || '')}
                    className="w-full py-2.5 px-3 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied to Clipboard!' : 'Copy Raw Private Key'}
                  </button>

                  <div className="p-2.5 rounded-lg bg-obsidian-950/80 border border-obsidian-border text-[11px] text-slate-400 space-y-1">
                    <strong className="text-slate-300 block">How to Import into MetaMask / Coinbase:</strong>
                    <div>1. Open wallet extension &rarr; Click account icon</div>
                    <div>2. Select <em>&ldquo;Add Account or Hardware Wallet&rdquo;</em> &rarr; <em>&ldquo;Import Account&rdquo;</em></div>
                    <div>3. Paste this 64-character private key and select Base Mainnet.</div>
                  </div>
                </div>
              )}

              {/* Download Keystore File */}
              <button
                onClick={handleDownloadBackup}
                className="w-full py-3 px-4 rounded-xl bg-obsidian-900 hover:bg-obsidian-800 border border-obsidian-border text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4 text-blue-400" />
                Download Encrypted Keystore Backup JSON
              </button>

              <div className="pt-2 border-t border-obsidian-border flex justify-between items-center text-xs">
                <span className="text-slate-500">Remove from this browser:</span>
                <button
                  onClick={clearWallet}
                  className="text-red-400 hover:text-red-300 font-medium text-xs"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          ) : (
            /* Import / Switch Tab (When already created) */
            <form onSubmit={handleImportSubmit} className="space-y-4 py-2 text-left">
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-blue-400" />
                  <span>Import or Switch Agentic Wallet</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Enter an existing 64-character private key (0x...) or upload a Keystore JSON file to switch your active Base trading agent.
                </p>
              </div>

              {importError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Wallet Switched Successfully! Loading on-chain balances...</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">
                    Private Key or Keystore JSON
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsImportMasked(!isImportMasked)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    {isImportMasked ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{isImportMasked ? 'Show' : 'Mask'}</span>
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={importKeyInput}
                  onChange={(e) => setImportKeyInput(e.target.value)}
                  placeholder="0x... or paste raw JSON backup content"
                  className={`w-full bg-obsidian-950 border border-obsidian-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-base-blue ${
                    isImportMasked ? 'filter blur-[1.5px] hover:filter-none transition-all' : ''
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-lg bg-obsidian-900 hover:bg-obsidian-800 border border-obsidian-border text-xs text-slate-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  Upload Keystore Backup File (.json)
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-obsidian-950/80 border border-obsidian-border/80 text-[11px] text-slate-400 flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-300 block">Client-Side Isolation</strong>
                  Importing replaces the current agentic wallet key in this browser only.
                </div>
              </div>

              <button
                type="submit"
                disabled={!importKeyInput.trim()}
                className="w-full py-3 px-4 rounded-xl bg-base-blue hover:bg-base-blueHover disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-base-blue/25 flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                Switch to This Wallet
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
