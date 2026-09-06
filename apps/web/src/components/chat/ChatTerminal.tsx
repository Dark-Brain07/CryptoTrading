'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Terminal, 
  ArrowUpRight, 
  RotateCcw,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  ArrowDownLeft,
  Shield,
  ShieldAlert,
  Key
} from 'lucide-react';
import { AgentMessage } from '@baseindex/shared';
import { MessageBubble } from './MessageBubble';
import { useAgenticWallet } from '../../hooks/useAgenticWallet';
import { AgenticWalletModal } from '../wallet/AgenticWalletModal';
import { truncateAddress } from '../../lib/utils';
import { BASE_EXPLORER_URL } from '@baseindex/shared';

interface ChatTerminalProps {
  onTradeExecuted?: () => void;
  walletAddress?: string;
}

const QUICK_PROMPTS = [
  'Buy $0.10 of NVDA',
  'Sell 0.10 of NVDA to USDC',
  'Sell all my TSLA to USDC',
  'Check My Wallet Balance',
  'Allocate $100 across 60% NVDA and 40% TSLA',
  'Withdraw Funds to Main Wallet',
  'Build a $250 Tech Basket: AAPL, MSFT, and AMZN'
];

const INITIAL_MESSAGES: AgentMessage[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content: 'Welcome to BaseIndex Agent. I am your autonomous portfolio architect on Base Mainnet.\n\nTell me how you would like to buy or sell tokenized stocks (NVDA, TSLA, AAPL, MSFT, SPY, COIN, AMZN, GOOGL), liquidate positions to USDC, or check your wallet balances.',
    timestamp: Date.now()
  }
];

export function ChatTerminal({ onTradeExecuted, walletAddress }: ChatTerminalProps) {
  const [messages, setMessages] = useState<AgentMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Agentic Wallet Hook
  const {
    address,
    ethBalance,
    usdcBalance,
    isCreated,
    createWallet,
    fetchBalances,
    executeBuyOnChain,
    executeSellOnChain
  } = useAgenticWallet();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'overview' | 'withdraw' | 'backup' | 'import'>('overview');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);

  const openWalletModal = (tab: 'overview' | 'withdraw' | 'backup' | 'import') => {
    setModalTab(tab);
    setIsWalletModalOpen(true);
  };

  const handleCopyAgenticAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleRefreshBalances = async () => {
    setIsRefreshingBalances(true);
    await fetchBalances();
    setTimeout(() => setIsRefreshingBalances(false), 600);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent, promptOverride?: string) => {
    if (e) e.preventDefault();
    const promptToSend = promptOverride || input;
    if (!promptToSend.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const pendingAssistantId = `agent-${Date.now()}`;
    const initialAssistantMessage: AgentMessage = {
      id: pendingAssistantId,
      role: 'assistant',
      content: 'Analyzing intent and quoting live Base Mainnet liquidity pools...',
      steps: [
        { id: '1', title: 'Connecting to Base Mainnet & Parsing Intent', status: 'in_progress' }
      ],
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, initialAssistantMessage]);

    try {
      // Connect to backend chat endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          walletAddress: walletAddress || 'default',
          agenticWalletAddress: address,
          usdcBalance: usdcBalance,
          ethBalance: ethBalance
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();

      // If user has live funds (ETH gas and USDC), broadcast directly to Base blockchain node!
      if (
        data.executionResult &&
        data.executionResult.action !== 'SELL' &&
        data.executionResult.allocations &&
        data.executionResult.allocations.length > 0 &&
        address &&
        ethBalance > 0.00003 &&
        usdcBalance >= (data.executionResult.totalAllocatedUSD || 0)
      ) {
        try {
          const firstTrade = data.executionResult.allocations[0];
          const liveTx = await executeBuyOnChain(firstTrade.amountUSD, firstTrade.ticker);

          data.message = `⚡ **Confirmed on Base Blockchain Node (Chain ID 8453)**\n\n` +
            `• **Asset:** ${firstTrade.shares} ${firstTrade.ticker}\n` +
            `• **Amount:** $${firstTrade.amountUSD.toFixed(2)} USDC\n` +
            `• **Signer:** \`${address}\`\n` +
            `• **Node:** \`https://mainnet.base.org\`\n` +
            `• **Status:** Successfully Mined On-Chain ✅\n` +
            `• **BaseScan Link:** [View Live Transaction](${liveTx.explorerUrl})\n\n` +
            `Transaction has been confirmed by Base blockchain validators. Your real on-chain USDC balance has been updated.`;

          data.steps = [
            { id: '1', title: 'Intent Parsed', status: 'completed' as const, detail: `Quoting ${firstTrade.ticker}` },
            { id: '2', title: 'Signed by Agentic Wallet', status: 'completed' as const, detail: `Key: ${address.substring(0, 10)}...` },
            { id: '3', title: 'Broadcasted to Base Node', status: 'completed' as const, detail: `TX: ${liveTx.txHash.substring(0, 12)}...` }
          ];

          data.executionResult = {
            ...data.executionResult,
            overallTxHash: liveTx.txHash,
            allocations: data.executionResult.allocations.map((a: any) => ({
              ...a,
              txHash: liveTx.txHash,
              explorerUrl: liveTx.explorerUrl
            }))
          };
        } catch (liveBroadcastErr: any) {
          console.warn('Real on-chain broadcast notice:', liveBroadcastErr);
        }
      }

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === pendingAssistantId) {
            return {
              ...msg,
              content: data.message,
              steps: data.steps,
              executionResult: data.executionResult
            };
          }
          return msg;
        })
      );

      if (data.executionResult && onTradeExecuted) {
        onTradeExecuted();
        fetchBalances();
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === pendingAssistantId) {
            return {
              ...msg,
              content: `Error executing trade on Base: ${err?.message || 'Server connection failed.'}`,
              steps: [
                { id: '1', title: 'Connection Failure', status: 'failed', detail: err?.message }
              ]
            };
          }
          return msg;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border-obsidian-border overflow-hidden shadow-2xl">
      {/* Terminal Bar */}
      <div className="px-4 py-3 border-b border-obsidian-border/80 bg-obsidian-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-base-blue" />
          <span className="text-xs font-mono font-semibold text-slate-200">
            agent-terminal &middot; base-mainnet
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            title="Reset Terminal"
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-obsidian-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </div>
        </div>
      </div>

      {/* Embedded Agentic Wallet Command Center */}
      {!isCreated ? (
        <div className="m-3 p-3.5 rounded-xl bg-gradient-to-r from-base-blue/20 via-obsidian-900 to-base-blue/10 border border-base-blue/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-base-blue/20 border border-base-blue/40 flex items-center justify-center text-blue-400 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                Autonomous Agent Wallet
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  NOT INITIALIZED
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Generate your client-isolated Base wallet for sub-second zero-signature trading.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openWalletModal('import')}
              className="px-3 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-border text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Key className="w-3.5 h-3.5 text-blue-400" />
              Import Key
            </button>
            <button
              onClick={() => {
                createWallet();
                openWalletModal('overview');
              }}
              className="px-3.5 py-2 rounded-xl bg-base-blue hover:bg-base-blueHover text-white text-xs font-bold shadow-md shadow-base-blue/25 flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Create Wallet
            </button>
          </div>
        </div>
      ) : (
        <div className="m-3 p-3 rounded-xl bg-obsidian-900/95 border border-obsidian-border shadow-xl space-y-2 shrink-0">
          {/* Top: Address & Balances */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-mono font-semibold text-slate-300">Agent Wallet:</span>
              <span className="text-xs font-mono text-white font-medium">
                {truncateAddress(address || '')}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyAgenticAddress}
                  className="p-1 rounded bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 transition-colors"
                  title="Copy Address"
                >
                  {copiedAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
                <a
                  href={`${BASE_EXPLORER_URL}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 transition-colors"
                  title="View on BaseScan"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Live Balance & Refresh */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-400 text-[10px]">USDC:</span>
                <span className="text-white font-bold">${usdcBalance.toFixed(2)}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 text-[10px]">ETH:</span>
                <span className="text-slate-300">{ethBalance.toFixed(4)}</span>
              </div>
              <button
                onClick={handleRefreshBalances}
                disabled={isRefreshingBalances}
                className="p-1 rounded bg-obsidian-800 hover:bg-obsidian-700 text-blue-400 transition-colors"
                title="Refresh Live Balances on Base"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingBalances ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick-Action Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-obsidian-border/50">
            <button
              onClick={() => openWalletModal('overview')}
              className="py-1.5 px-2 rounded-lg bg-obsidian-800/90 hover:bg-obsidian-700 text-[11px] font-medium text-slate-200 border border-obsidian-border/60 flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
              Deposit
            </button>
            <button
              onClick={() => openWalletModal('withdraw')}
              className="py-1.5 px-2 rounded-lg bg-obsidian-800/90 hover:bg-obsidian-700 text-[11px] font-medium text-slate-200 border border-obsidian-border/60 flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowUpRight className="w-3 h-3 text-blue-400" />
              Withdraw
            </button>
            <button
              onClick={() => openWalletModal('backup')}
              className="py-1.5 px-2 rounded-lg bg-red-950/20 hover:bg-red-900/30 text-[11px] font-medium text-red-300 border border-red-500/30 flex items-center justify-center gap-1 transition-colors"
            >
              <Shield className="w-3 h-3 text-red-400" />
              Backup
            </button>
            <button
              onClick={() => openWalletModal('import')}
              className="py-1.5 px-2 rounded-lg bg-obsidian-800/90 hover:bg-obsidian-700 text-[11px] font-medium text-slate-200 border border-obsidian-border/60 flex items-center justify-center gap-1 transition-colors"
            >
              <Key className="w-3 h-3 text-blue-400" />
              Import
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Container */}
      <div className="px-4 py-2 border-t border-obsidian-border/50 bg-obsidian-900/40">
        <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-400" />
          Quick Index Templates
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSubmit(undefined, qp)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-obsidian-800 hover:bg-obsidian-700 hover:text-white border border-obsidian-border text-slate-300 transition-colors flex items-center gap-1"
            >
              <span>{qp}</span>
              <ArrowUpRight className="w-2.5 h-2.5 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-obsidian-border bg-obsidian-900/90 flex items-center gap-2 shrink-0"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Allocate $500 across 50% TSLA and 50% NVDA..."
            className="w-full bg-obsidian-950 border border-obsidian-border rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-base-blue focus:ring-1 focus:ring-base-blue transition-all disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-xl bg-base-blue hover:bg-base-blueHover disabled:opacity-40 text-white font-medium shadow-md shadow-base-blue/20 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Agentic Smart Wallet Modal */}
      <AgenticWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        initialTab={modalTab}
        connectedMainAddress={walletAddress}
      />
    </div>
  );
}
