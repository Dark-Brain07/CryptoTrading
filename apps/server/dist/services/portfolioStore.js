"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioStore = void 0;
const shared_1 = require("@baseindex/shared");
// In-memory persistent portfolio store (keyed by wallet address or "default")
class PortfolioStore {
    holdings = new Map();
    constructor() {
        this.seedDefaultPortfolio('default');
    }
    seedDefaultPortfolio(walletKey) {
        const defaultMap = new Map();
        defaultMap.set('NVDA', {
            ticker: 'NVDA',
            name: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.NVDA.name,
            balance: 12.5,
            balanceUSD: Number((12.5 * shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.NVDA.referencePriceUSD).toFixed(2)),
            currentPrice: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.NVDA.referencePriceUSD,
            change24h: 3.42,
            allocationPercentage: 35.2,
            contractAddress: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.NVDA.contractAddress,
            explorerUrl: `${shared_1.BASE_EXPLORER_URL}/token/${shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.NVDA.contractAddress}`
        });
        defaultMap.set('TSLA', {
            ticker: 'TSLA',
            name: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.TSLA.name,
            balance: 5.2,
            balanceUSD: Number((5.2 * shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.TSLA.referencePriceUSD).toFixed(2)),
            currentPrice: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.TSLA.referencePriceUSD,
            change24h: -1.18,
            allocationPercentage: 26.8,
            contractAddress: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.TSLA.contractAddress,
            explorerUrl: `${shared_1.BASE_EXPLORER_URL}/token/${shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.TSLA.contractAddress}`
        });
        defaultMap.set('SPY', {
            ticker: 'SPY',
            name: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.SPY.name,
            balance: 2.8,
            balanceUSD: Number((2.8 * shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.SPY.referencePriceUSD).toFixed(2)),
            currentPrice: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.SPY.referencePriceUSD,
            change24h: 0.65,
            allocationPercentage: 38.0,
            contractAddress: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.SPY.contractAddress,
            explorerUrl: `${shared_1.BASE_EXPLORER_URL}/token/${shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.SPY.contractAddress}`
        });
        this.holdings.set(walletKey, defaultMap);
    }
    getHoldings(walletKey = 'default') {
        let map = this.holdings.get(walletKey.toLowerCase());
        if (!map) {
            this.seedDefaultPortfolio(walletKey.toLowerCase());
            map = this.holdings.get(walletKey.toLowerCase());
        }
        const items = Array.from(map.values());
        const totalUSD = items.reduce((acc, item) => acc + item.balanceUSD, 0);
        // Recompute percentage distribution
        return items.map((item) => ({
            ...item,
            allocationPercentage: totalUSD > 0 ? Number(((item.balanceUSD / totalUSD) * 100).toFixed(1)) : 0
        }));
    }
    recordTrade(walletKey = 'default', ticker, sharesPurchased, amountUSD, txHash) {
        const key = walletKey.toLowerCase();
        let map = this.holdings.get(key);
        if (!map) {
            this.seedDefaultPortfolio(key);
            map = this.holdings.get(key);
        }
        const stock = shared_1.VERIFIED_BASE_TOKENIZED_STOCKS[ticker];
        if (!stock)
            return;
        const existing = map.get(ticker);
        if (existing) {
            const newBalance = Number((existing.balance + sharesPurchased).toFixed(4));
            const newBalanceUSD = Number((newBalance * stock.referencePriceUSD).toFixed(2));
            map.set(ticker, {
                ...existing,
                balance: newBalance,
                balanceUSD: newBalanceUSD
            });
        }
        else {
            map.set(ticker, {
                ticker: stock.ticker,
                name: stock.name,
                balance: Number(sharesPurchased.toFixed(4)),
                balanceUSD: Number(amountUSD.toFixed(2)),
                currentPrice: stock.referencePriceUSD,
                change24h: 1.5,
                allocationPercentage: 0,
                contractAddress: stock.contractAddress,
                explorerUrl: `${shared_1.BASE_EXPLORER_URL}/token/${stock.contractAddress}`
            });
        }
    }
    getTotalValueUSD(walletKey = 'default') {
        const holdings = this.getHoldings(walletKey);
        return Number(holdings.reduce((sum, h) => sum + h.balanceUSD, 0).toFixed(2));
    }
}
exports.portfolioStore = new PortfolioStore();
