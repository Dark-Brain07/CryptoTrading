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
        defaultMap.set('AERO', {
            ticker: 'AERO',
            name: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.AERO.name,
            balance: 145.2,
            balanceUSD: Number((145.2 * shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.AERO.referencePriceUSD).toFixed(2)),
            currentPrice: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.AERO.referencePriceUSD,
            change24h: 4.82,
            allocationPercentage: 35.0,
            contractAddress: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.AERO.contractAddress,
            explorerUrl: `${shared_1.BASE_EXPLORER_URL}/token/${shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.AERO.contractAddress}`
        });
        defaultMap.set('WETH', {
            ticker: 'WETH',
            name: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.WETH.name,
            balance: 0.045,
            balanceUSD: Number((0.045 * shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.WETH.referencePriceUSD).toFixed(2)),
            currentPrice: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.WETH.referencePriceUSD,
            change24h: 1.65,
            allocationPercentage: 30.0,
            contractAddress: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.WETH.contractAddress,
            explorerUrl: `${shared_1.BASE_EXPLORER_URL}/token/${shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.WETH.contractAddress}`
        });
        defaultMap.set('VIRTUAL', {
            ticker: 'VIRTUAL',
            name: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.VIRTUAL.name,
            balance: 85.0,
            balanceUSD: Number((85.0 * shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.VIRTUAL.referencePriceUSD).toFixed(2)),
            currentPrice: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.VIRTUAL.referencePriceUSD,
            change24h: 8.42,
            allocationPercentage: 20.0,
            contractAddress: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.VIRTUAL.contractAddress,
            explorerUrl: `${shared_1.BASE_EXPLORER_URL}/token/${shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.VIRTUAL.contractAddress}`
        });
        defaultMap.set('cbBTC', {
            ticker: 'cbBTC',
            name: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.cbBTC.name,
            balance: 0.00065,
            balanceUSD: Number((0.00065 * shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.cbBTC.referencePriceUSD).toFixed(2)),
            currentPrice: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.cbBTC.referencePriceUSD,
            change24h: -0.45,
            allocationPercentage: 15.0,
            contractAddress: shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.cbBTC.contractAddress,
            explorerUrl: `${shared_1.BASE_EXPLORER_URL}/token/${shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.cbBTC.contractAddress}`
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
        const symbol = ticker.toUpperCase().replace(/^[$]/, '');
        const stock = shared_1.VERIFIED_BASE_TOKENIZED_STOCKS[symbol];
        const refPrice = stock ? stock.referencePriceUSD : (sharesPurchased > 0 ? amountUSD / sharesPurchased : 1.0);
        const contractAddress = stock ? stock.contractAddress : (ticker.startsWith('0x') ? ticker : '0x0000000000000000000000000000000000000000');
        const name = stock ? stock.name : `${symbol} Token`;
        const existing = map.get(symbol);
        if (existing) {
            const newBalance = Number((existing.balance + sharesPurchased).toFixed(6));
            const newBalanceUSD = Number((newBalance * refPrice).toFixed(2));
            map.set(symbol, {
                ...existing,
                balance: newBalance,
                balanceUSD: newBalanceUSD,
                explorerUrl: `${shared_1.BASE_EXPLORER_URL}/tx/${txHash}`
            });
        }
        else {
            map.set(symbol, {
                ticker: symbol,
                name,
                balance: Number(sharesPurchased.toFixed(6)),
                balanceUSD: Number(amountUSD.toFixed(2)),
                currentPrice: refPrice,
                change24h: 2.1,
                allocationPercentage: 0,
                contractAddress,
                explorerUrl: `${shared_1.BASE_EXPLORER_URL}/tx/${txHash}`
            });
        }
    }
    recordSell(walletKey = 'default', ticker, amountUSD, sharesSold, txHash) {
        const key = walletKey.toLowerCase();
        let map = this.holdings.get(key);
        if (!map) {
            this.seedDefaultPortfolio(key);
            map = this.holdings.get(key);
        }
        const symbol = ticker.toUpperCase().replace(/^[$]/, '');
        const stock = shared_1.VERIFIED_BASE_TOKENIZED_STOCKS[symbol];
        const refPrice = stock ? stock.referencePriceUSD : 1.0;
        const existing = map.get(symbol);
        if (!existing || existing.balance <= 0) {
            throw new Error(`You do not have any ${symbol} holdings in your wallet to sell.`);
        }
        let calculatedShares = sharesSold;
        let calculatedUSD = amountUSD;
        if (calculatedShares !== undefined && calculatedShares > 0) {
            calculatedUSD = Number((calculatedShares * refPrice).toFixed(4));
        }
        else if (calculatedUSD !== undefined && calculatedUSD > 0) {
            calculatedShares = Number((calculatedUSD / refPrice).toFixed(6));
        }
        else {
            calculatedShares = existing.balance;
            calculatedUSD = existing.balanceUSD;
        }
        if (calculatedShares > existing.balance) {
            calculatedShares = existing.balance;
            calculatedUSD = Number((calculatedShares * refPrice).toFixed(4));
        }
        const remainingShares = Math.max(0, Number((existing.balance - calculatedShares).toFixed(6)));
        const remainingUSD = Math.max(0, Number((remainingShares * refPrice).toFixed(2)));
        if (remainingShares <= 0.000001) {
            map.delete(symbol);
        }
        else {
            map.set(symbol, {
                ...existing,
                balance: remainingShares,
                balanceUSD: remainingUSD
            });
        }
        return {
            success: true,
            sharesSold: calculatedShares,
            amountUSD: calculatedUSD || 0,
            remainingShares
        };
    }
    getTotalValueUSD(walletKey = 'default') {
        const holdings = this.getHoldings(walletKey);
        return Number(holdings.reduce((sum, h) => sum + h.balanceUSD, 0).toFixed(2));
    }
}
exports.portfolioStore = new PortfolioStore();
