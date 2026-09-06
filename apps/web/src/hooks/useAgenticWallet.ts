'use client';

import { useState, useEffect, useCallback } from 'react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, http, formatUnits, parseUnits, formatEther, parseEther } from 'viem';
import { base } from 'viem/chains';
import {
  BASE_USDC,
  ERC20_ABI,
  VERIFIED_BASE_TOKENIZED_STOCKS,
  PortfolioHolding
} from '@baseindex/shared';
import {
  executeBuyTokenOnAerodrome,
  executeSellTokenOnAerodrome,
  discoverTokenMetadata
} from '../lib/dexTrading';

const STORAGE_KEY = 'baseindex_agentic_wallet_key';

export interface AgenticWalletState {
  address: `0x${string}` | null;
  privateKey: `0x${string}` | null;
  ethBalance: number;
  usdcBalance: number;
  tokenBalances: Record<string, number>;
  isLoading: boolean;
  isCreated: boolean;
}

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org')
});

export function useAgenticWallet() {
  const [wallet, setWallet] = useState<AgenticWalletState>({
    address: null,
    privateKey: null,
    ethBalance: 0,
    usdcBalance: 0,
    tokenBalances: {},
    isLoading: true,
    isCreated: false
  });

  // Load existing wallet or initialize state
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem(STORAGE_KEY) as `0x${string}` | null;
      if (savedKey && savedKey.startsWith('0x')) {
        const account = privateKeyToAccount(savedKey);
        setWallet(prev => ({
          ...prev,
          address: account.address,
          privateKey: savedKey,
          isCreated: true,
          isLoading: false
        }));
      } else {
        setWallet(prev => ({ ...prev, isLoading: false }));
      }
    } catch (e) {
      console.warn('Error loading saved agentic wallet:', e);
      setWallet(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Fetch live on-chain balances from Base Mainnet
  const fetchBalances = useCallback(async (addressOverride?: `0x${string}`) => {
    const targetAddr = addressOverride || wallet.address;
    if (!targetAddr) return;

    try {
      // 1. Real Base ETH Balance
      const ethBalRaw = await publicClient.getBalance({ address: targetAddr });
      const ethVal = parseFloat(formatEther(ethBalRaw));

      // 2. Real Base USDC Balance
      let usdcVal = 0;
      try {
        const usdcBalRaw = await publicClient.readContract({
          address: BASE_USDC.contractAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [targetAddr]
        }) as bigint;
        usdcVal = parseFloat(formatUnits(usdcBalRaw, BASE_USDC.decimals));
      } catch {}

      // 3. Real on-chain balances for supported Base tokens
      const tBalances: Record<string, number> = {};
      const tokensToCheck = ['AERO', 'WETH', 'cbBTC', 'VIRTUAL', 'DEGEN'];

      await Promise.all(
        tokensToCheck.map(async (sym) => {
          const info = VERIFIED_BASE_TOKENIZED_STOCKS[sym];
          if (!info) return;
          try {
            const raw = await publicClient.readContract({
              address: info.contractAddress,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [targetAddr]
            }) as bigint;
            tBalances[sym] = parseFloat(formatUnits(raw, info.decimals));
          } catch {
            tBalances[sym] = 0;
          }
        })
      );

      setWallet(prev => ({
        ...prev,
        ethBalance: Number(ethVal.toFixed(5)),
        usdcBalance: Number(usdcVal.toFixed(2)),
        tokenBalances: tBalances
      }));
    } catch (err) {
      console.warn('Error fetching live balances on Base:', err);
    }
  }, [wallet.address]);

  useEffect(() => {
    if (wallet.address) {
      fetchBalances();
      const interval = setInterval(() => fetchBalances(), 12000);
      return () => clearInterval(interval);
    }
  }, [wallet.address, fetchBalances]);

  // Create a brand new unique agentic wallet
  const createWallet = () => {
    try {
      const newKey = generatePrivateKey();
      const account = privateKeyToAccount(newKey);
      localStorage.setItem(STORAGE_KEY, newKey);

      setWallet({
        address: account.address,
        privateKey: newKey,
        ethBalance: 0,
        usdcBalance: 0,
        tokenBalances: {},
        isLoading: false,
        isCreated: true
      });

      fetchBalances(account.address);
      return account.address;
    } catch (err) {
      console.error('Error generating agentic wallet:', err);
      throw err;
    }
  };

  // Withdraw funds from Agentic Wallet to recipient on Base
  const withdrawFunds = async (
    toAddress: `0x${string}`,
    amount: number,
    asset: 'USDC' | 'ETH'
  ): Promise<{ txHash: string; explorerUrl: string }> => {
    if (!wallet.privateKey || !wallet.address) {
      throw new Error('Agentic wallet not initialized');
    }

    if (wallet.ethBalance > 0.00003) {
      try {
        const account = privateKeyToAccount(wallet.privateKey);
        const walletClient = createWalletClient({
          account,
          chain: base,
          transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org')
        });

        let txHash: `0x${string}`;
        if (asset === 'ETH') {
          txHash = await walletClient.sendTransaction({
            to: toAddress,
            value: parseEther(amount.toString())
          });
        } else {
          txHash = await walletClient.writeContract({
            address: BASE_USDC.contractAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [toAddress, parseUnits(amount.toFixed(6), BASE_USDC.decimals)]
          });
        }

        await publicClient.waitForTransactionReceipt({ hash: txHash });
        setTimeout(() => fetchBalances(), 2000);
        return {
          txHash,
          explorerUrl: `https://basescan.org/tx/${txHash}`
        };
      } catch (chainErr: any) {
        console.warn('Direct on-chain withdrawal error:', chainErr?.message || chainErr);
      }
    }

    // Backend withdrawal fallback
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const res = await fetch(`${apiUrl}/api/portfolio/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromPrivateKey: wallet.privateKey,
        toAddress,
        amount,
        asset
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Withdrawal failed on Base Mainnet');
    }

    setTimeout(() => fetchBalances(), 3000);
    return {
      txHash: data.txHash,
      explorerUrl: data.explorerUrl
    };
  };

  // Execute 100% Real On-Chain Buy via Aerodrome DEX
  const executeBuyOnChain = async (
    amountUSD: number,
    targetTokenOrAddress: string
  ): Promise<{ txHash: string; explorerUrl: string; shares: number; symbol: string }> => {
    if (!wallet.privateKey || !wallet.address) {
      throw new Error('Agentic wallet not initialized. Please create or import an Agent Wallet first.');
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    // If user has live on-chain balance (ETH gas > 0 and USDC >= amountUSD), broadcast live Aerodrome swap!
    if (wallet.ethBalance > 0.00003 && wallet.usdcBalance >= amountUSD) {
      try {
        const account = privateKeyToAccount(wallet.privateKey);
        const walletClient = createWalletClient({
          account,
          chain: base,
          transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org')
        });

        // 100% Real Aerodrome DEX Swap on Base Mainnet
        const swapResult = await executeBuyTokenOnAerodrome(walletClient, publicClient, {
          targetTokenOrSymbol: targetTokenOrAddress,
          amountUSD,
          slippagePercent: 1.5
        });

        // Record confirmed on-chain trade in portfolio store
        try {
          await fetch(`${apiUrl}/api/portfolio/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: wallet.address,
              ticker: swapResult.symbol,
              amountUSD,
              shares: swapResult.amountOut,
              txHash: swapResult.txHash
            })
          });
        } catch (syncErr) {
          console.warn('Backend trade record sync note:', syncErr);
        }

        setTimeout(() => fetchBalances(), 2000);

        return {
          txHash: swapResult.txHash,
          explorerUrl: swapResult.explorerUrl,
          shares: swapResult.amountOut,
          symbol: swapResult.symbol
        };
      } catch (swapErr: any) {
        console.error('Aerodrome on-chain buy error:', swapErr);
        throw new Error(swapErr?.shortMessage || swapErr?.message || 'Failed to execute Aerodrome DEX swap on Base Mainnet');
      }
    }

    // If insufficient balance, inform user
    if (wallet.ethBalance <= 0.00003) {
      throw new Error(`Insufficient ETH for gas. Your Agentic Wallet has ${wallet.ethBalance} ETH. Send a tiny fraction of ETH (~0.0005 ETH / $0.001) to ${wallet.address} to pay for Base gas.`);
    }

    if (wallet.usdcBalance < amountUSD) {
      throw new Error(`Insufficient USDC balance. You requested $${amountUSD.toFixed(2)} USDC, but have $${wallet.usdcBalance.toFixed(2)} USDC in your Agentic Wallet.`);
    }

    throw new Error('Could not execute on-chain trade.');
  };

  // Execute 100% Real On-Chain Sell via Aerodrome DEX back to USDC
  const executeSellOnChain = async (
    targetTokenOrSymbol: string,
    amountUSD?: number,
    shares?: number
  ): Promise<{ txHash: string; explorerUrl: string; sharesSold: number; amountUSD: number }> => {
    if (!wallet.privateKey || !wallet.address) {
      throw new Error('Agentic wallet not initialized');
    }

    const symbol = targetTokenOrSymbol.toUpperCase().replace(/^[$]/, '');
    let tokenAddress: `0x${string}`;
    let tokenDecimals = 18;

    if (VERIFIED_BASE_TOKENIZED_STOCKS[symbol]) {
      tokenAddress = VERIFIED_BASE_TOKENIZED_STOCKS[symbol].contractAddress;
      tokenDecimals = VERIFIED_BASE_TOKENIZED_STOCKS[symbol].decimals;
    } else if (targetTokenOrSymbol.startsWith('0x') && targetTokenOrSymbol.length === 42) {
      const disc = await discoverTokenMetadata(publicClient, targetTokenOrSymbol as `0x${string}`);
      tokenAddress = disc.address;
      tokenDecimals = disc.decimals;
    } else {
      throw new Error(`Asset ${targetTokenOrSymbol} not recognized on Base Mainnet`);
    }

    // Determine shares to sell
    const currentHoldingShares = wallet.tokenBalances[symbol] || 0;
    const sharesToSell = shares !== undefined && shares > 0 ? shares : currentHoldingShares;

    if (sharesToSell <= 0) {
      throw new Error(`You do not hold any ${symbol} to sell in your Agentic Wallet.`);
    }

    if (wallet.ethBalance <= 0.00003) {
      throw new Error(`Insufficient ETH for gas to execute sell on Base Mainnet.`);
    }

    const account = privateKeyToAccount(wallet.privateKey);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org')
    });

    // Execute real reverse Aerodrome swap (Token -> USDC)
    const sellResult = await executeSellTokenOnAerodrome(walletClient, publicClient, {
      tokenAddress,
      tokenSymbol: symbol,
      tokenDecimals,
      tokenAmountToSell: sharesToSell,
      slippagePercent: 1.5
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    try {
      await fetch(`${apiUrl}/api/portfolio/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: wallet.address,
          ticker: symbol,
          amountUSD: sellResult.amountOut,
          shares: sellResult.amountIn,
          txHash: sellResult.txHash,
          toAddress: wallet.address
        })
      });
    } catch {}

    setTimeout(() => fetchBalances(), 2000);

    return {
      txHash: sellResult.txHash,
      explorerUrl: sellResult.explorerUrl,
      sharesSold: sellResult.amountIn,
      amountUSD: sellResult.amountOut
    };
  };

  // Import an existing agentic wallet via raw private key or keystore backup JSON
  const importWallet = (input: string) => {
    let rawKey = input.trim();

    if (rawKey.startsWith('{') && rawKey.endsWith('}')) {
      try {
        const parsed = JSON.parse(rawKey);
        if (parsed.privateKey) {
          rawKey = parsed.privateKey.trim();
        }
      } catch (e) {}
    }

    if (!rawKey.startsWith('0x')) {
      rawKey = `0x${rawKey}`;
    }

    if (rawKey.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(rawKey)) {
      throw new Error('Invalid private key format. Must be a 64-character hex string (0x...).');
    }

    try {
      const account = privateKeyToAccount(rawKey as `0x${string}`);
      localStorage.setItem(STORAGE_KEY, rawKey);

      setWallet({
        address: account.address,
        privateKey: rawKey as `0x${string}`,
        ethBalance: 0,
        usdcBalance: 0,
        tokenBalances: {},
        isLoading: false,
        isCreated: true
      });

      fetchBalances(account.address);
      return account.address;
    } catch (err: any) {
      console.error('Error importing private key:', err);
      throw new Error(err?.message || 'Failed to import wallet from private key');
    }
  };

  // Clear wallet from local browser memory
  const clearWallet = () => {
    localStorage.removeItem(STORAGE_KEY);
    setWallet({
      address: null,
      privateKey: null,
      ethBalance: 0,
      usdcBalance: 0,
      tokenBalances: {},
      isLoading: false,
      isCreated: false
    });
  };

  return {
    ...wallet,
    createWallet,
    importWallet,
    fetchBalances,
    withdrawFunds,
    executeBuyOnChain,
    executeSellOnChain,
    clearWallet
  };
}
