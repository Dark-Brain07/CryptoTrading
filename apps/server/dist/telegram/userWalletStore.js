"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramWalletStore = void 0;
const accounts_1 = require("viem/accounts");
const viem_1 = require("viem");
const blockchain_1 = require("../services/blockchain");
const shared_1 = require("../shared");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class TelegramUserWalletStore {
    wallets = new Map();
    storagePath;
    constructor() {
        // Persistent file store in data/wallets.json
        const dataDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            try {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            catch (e) {
                // ignore
            }
        }
        this.storagePath = path.join(dataDir, 'wallets.json');
        this.loadFromDisk();
    }
    loadFromDisk() {
        try {
            if (fs.existsSync(this.storagePath)) {
                const data = fs.readFileSync(this.storagePath, 'utf8');
                const parsed = JSON.parse(data);
                for (const [k, v] of Object.entries(parsed)) {
                    this.wallets.set(k, v);
                }
                console.log(`Loaded ${this.wallets.size} Telegram agentic wallets from disk.`);
            }
        }
        catch (e) {
            console.warn('Could not load Telegram wallets from disk:', e);
        }
    }
    saveToDisk() {
        try {
            const obj = {};
            for (const [k, v] of this.wallets.entries()) {
                obj[k] = v;
            }
            fs.writeFileSync(this.storagePath, JSON.stringify(obj, null, 2), 'utf8');
        }
        catch (e) {
            console.warn('Could not persist Telegram wallets to disk:', e);
        }
    }
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
        this.saveToDisk();
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
        this.saveToDisk();
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
