'use client';

import { useState, useEffect, useCallback } from 'react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http, formatUnits, parseUnits, formatEther, parseEther } from 'viem';
import { base } from 'viem/chains';
import { BASE_USDC, ERC20_ABI } from '@baseindex/shared';

const STORAGE_KEY = 'baseindex_agentic_wallet_key';

export interface AgenticWalletState {
  address: `0x${string}` | null;
  privateKey: `0x${string}` | null;
  ethBalance: number;
  usdcBalance: number;
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
      // 1. ETH Balance
      const ethBalRaw = await publicClient.getBalance({ address: targetAddr });
      const ethVal = parseFloat(formatEther(ethBalRaw));

      // 2. Base USDC Balance
      let usdcVal = 0;
      try {
        const usdcBalRaw = await publicClient.readContract({
          address: BASE_USDC.contractAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [targetAddr]
        }) as bigint;
        usdcVal = parseFloat(formatUnits(usdcBalRaw, BASE_USDC.decimals));
      } catch {
        // Default to 0 if RPC or empty
      }

      setWallet(prev => ({
        ...prev,
        ethBalance: Number(ethVal.toFixed(5)),
        usdcBalance: Number(usdcVal.toFixed(2))
      }));
    } catch (err) {
      console.warn('Error fetching live balances on Base:', err);
    }
  }, [wallet.address]);

  useEffect(() => {
    if (wallet.address) {
      fetchBalances();
      const interval = setInterval(() => fetchBalances(), 15000);
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

    // Connect to backend withdrawal dispatcher or broadcast via RPC
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

    // Refresh balances after withdrawal
    setTimeout(() => fetchBalances(), 3000);

    return {
      txHash: data.txHash,
      explorerUrl: data.explorerUrl
    };
  };

  // Import an existing agentic wallet via raw private key or keystore backup JSON
  const importWallet = (input: string) => {
    let rawKey = input.trim();

    // Check if input is JSON Keystore format
    if (rawKey.startsWith('{') && rawKey.endsWith('}')) {
      try {
        const parsed = JSON.parse(rawKey);
        if (parsed.privateKey) {
          rawKey = parsed.privateKey.trim();
        }
      } catch (e) {
        // Fall back to treating as string
      }
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
    clearWallet
  };
}
