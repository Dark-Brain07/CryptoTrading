"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramWalletStore = void 0;
const accounts_1 = require("viem/accounts");
const viem_1 = require("viem");
const blockchain_1 = require("../services/blockchain");
const shared_1 = require("@baseindex/shared");
class TelegramUserWalletStore {
    wallets = new Map();
    getWallet(userId) {
        return this.wallets.get(userId) || null;
    }
    createWallet(userId) {
        const privateKey = (0, accounts_1.generatePrivateKey)();
        const account = (0, accounts_1.privateKeyToAccount)(privateKey);
        const wallet = {
            address: account.address,
            privateKey,
            createdAt: Date.now()
        };
        this.wallets.set(userId, wallet);
        return wallet;
    }
    importWallet(userId, input) {
        let rawKey = input.trim();
        // Check if input is JSON Keystore format
        if (rawKey.startsWith('{') && rawKey.endsWith('}')) {
            try {
                const parsed = JSON.parse(rawKey);
                if (parsed.privateKey) {
                    rawKey = parsed.privateKey.trim();
                }
            }
            catch (e) {
                // Fall back to raw string
            }
        }
        if (!rawKey.startsWith('0x')) {
            rawKey = `0x${rawKey}`;
        }
        if (rawKey.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(rawKey)) {
            throw new Error('Invalid private key format. Must be a 64-character hex string (0x...).');
        }
        const account = (0, accounts_1.privateKeyToAccount)(rawKey);
        const wallet = {
            address: account.address,
            privateKey: rawKey,
            createdAt: Date.now()
        };
        this.wallets.set(userId, wallet);
        return wallet;
    }
    async getBalances(address) {
        try {
            const [ethRaw, usdcVal] = await Promise.all([
                blockchain_1.publicClient.getBalance({ address }),
                (0, blockchain_1.getOnChainTokenBalance)(shared_1.BASE_USDC.contractAddress, address, shared_1.BASE_USDC.decimals)
            ]);
            const ethVal = parseFloat((0, viem_1.formatEther)(ethRaw));
            return {
                usdc: Number(usdcVal.toFixed(2)),
                eth: Number(ethVal.toFixed(4))
            };
        }
        catch (e) {
            console.warn('Error querying Telegram wallet balances on Base:', e);
            return { usdc: 0, eth: 0 };
        }
    }
    generateBackupJson(wallet) {
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
exports.telegramWalletStore = new TelegramUserWalletStore();
