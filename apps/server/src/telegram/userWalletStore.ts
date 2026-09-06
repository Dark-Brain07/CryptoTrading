import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { formatEther } from 'viem';
import { publicClient, getOnChainTokenBalance } from '../services/blockchain';
import { BASE_USDC } from '@baseindex/shared';

export interface TelegramUserWallet {
  address: `0x${string}`;
  privateKey: `0x${string}`;
  createdAt: number;
}

class TelegramUserWalletStore {
  private wallets: Map<string, TelegramUserWallet> = new Map();

  getWallet(userId: string): TelegramUserWallet | null {
    return this.wallets.get(userId) || null;
  }

  createWallet(userId: string): TelegramUserWallet {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const wallet: TelegramUserWallet = {
      address: account.address,
      privateKey,
      createdAt: Date.now()
    };
    this.wallets.set(userId, wallet);
    return wallet;
  }

  importWallet(userId: string, input: string): TelegramUserWallet {
    let rawKey = input.trim();

    // Check if input is JSON Keystore format
    if (rawKey.startsWith('{') && rawKey.endsWith('}')) {
      try {
        const parsed = JSON.parse(rawKey);
        if (parsed.privateKey) {
          rawKey = parsed.privateKey.trim();
        }
      } catch (e) {
        // Fall back to raw string
      }
    }

    if (!rawKey.startsWith('0x')) {
      rawKey = `0x${rawKey}`;
    }

    if (rawKey.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(rawKey)) {
      throw new Error('Invalid private key format. Must be a 64-character hex string (0x...).');
    }

    const account = privateKeyToAccount(rawKey as `0x${string}`);
    const wallet: TelegramUserWallet = {
      address: account.address,
      privateKey: rawKey as `0x${string}`,
      createdAt: Date.now()
    };
    this.wallets.set(userId, wallet);
    return wallet;
  }

  async getBalances(address: `0x${string}`): Promise<{ usdc: number; eth: number }> {
    try {
      const [ethRaw, usdcVal] = await Promise.all([
        publicClient.getBalance({ address }),
        getOnChainTokenBalance(BASE_USDC.contractAddress as `0x${string}`, address, BASE_USDC.decimals)
      ]);

      const ethVal = parseFloat(formatEther(ethRaw));
      return {
        usdc: Number(usdcVal.toFixed(2)),
        eth: Number(ethVal.toFixed(4))
      };
    } catch (e) {
      console.warn('Error querying Telegram wallet balances on Base:', e);
      return { usdc: 0, eth: 0 };
    }
  }

  generateBackupJson(wallet: TelegramUserWallet): string {
    return JSON.stringify({
      app: 'BaseIndex Agent',
      client: 'Telegram Trading Bot',
      network: 'Base Mainnet (Chain ID 8453)',
      address: wallet.address,
      privateKey: wallet.privateKey,
      exportTimestamp: new Date().toISOString(),
      securityWarning: 'HIGH SENSITIVITY: NEVER share this file or private key with anyone. Store offline in a secure location.'
    }, null, 2);
  }
}

export const telegramWalletStore = new TelegramUserWalletStore();
