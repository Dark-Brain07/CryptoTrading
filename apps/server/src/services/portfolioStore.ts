import { PortfolioHolding, VERIFIED_BASE_TOKENIZED_STOCKS, BASE_EXPLORER_URL } from '@baseindex/shared';

// In-memory persistent portfolio store (keyed by wallet address or "default")
class PortfolioStore {
  private holdings: Map<string, Map<string, PortfolioHolding>> = new Map();

  constructor() {
    this.seedDefaultPortfolio('default');
  }

  private seedDefaultPortfolio(walletKey: string) {
    const defaultMap = new Map<string, PortfolioHolding>();

    defaultMap.set('NVDA', {
      ticker: 'NVDA',
      name: VERIFIED_BASE_TOKENIZED_STOCKS.NVDA.name,
      balance: 12.5,
      balanceUSD: Number((12.5 * VERIFIED_BASE_TOKENIZED_STOCKS.NVDA.referencePriceUSD).toFixed(2)),
      currentPrice: VERIFIED_BASE_TOKENIZED_STOCKS.NVDA.referencePriceUSD,
      change24h: 3.42,
      allocationPercentage: 35.2,
      contractAddress: VERIFIED_BASE_TOKENIZED_STOCKS.NVDA.contractAddress,
      explorerUrl: `${BASE_EXPLORER_URL}/token/${VERIFIED_BASE_TOKENIZED_STOCKS.NVDA.contractAddress}`
    });

    defaultMap.set('TSLA', {
      ticker: 'TSLA',
      name: VERIFIED_BASE_TOKENIZED_STOCKS.TSLA.name,
      balance: 5.2,
      balanceUSD: Number((5.2 * VERIFIED_BASE_TOKENIZED_STOCKS.TSLA.referencePriceUSD).toFixed(2)),
      currentPrice: VERIFIED_BASE_TOKENIZED_STOCKS.TSLA.referencePriceUSD,
      change24h: -1.18,
      allocationPercentage: 26.8,
      contractAddress: VERIFIED_BASE_TOKENIZED_STOCKS.TSLA.contractAddress,
      explorerUrl: `${BASE_EXPLORER_URL}/token/${VERIFIED_BASE_TOKENIZED_STOCKS.TSLA.contractAddress}`
    });

    defaultMap.set('SPY', {
      ticker: 'SPY',
      name: VERIFIED_BASE_TOKENIZED_STOCKS.SPY.name,
      balance: 2.8,
      balanceUSD: Number((2.8 * VERIFIED_BASE_TOKENIZED_STOCKS.SPY.referencePriceUSD).toFixed(2)),
      currentPrice: VERIFIED_BASE_TOKENIZED_STOCKS.SPY.referencePriceUSD,
      change24h: 0.65,
      allocationPercentage: 38.0,
      contractAddress: VERIFIED_BASE_TOKENIZED_STOCKS.SPY.contractAddress,
      explorerUrl: `${BASE_EXPLORER_URL}/token/${VERIFIED_BASE_TOKENIZED_STOCKS.SPY.contractAddress}`
    });

    this.holdings.set(walletKey, defaultMap);
  }

  public getHoldings(walletKey: string = 'default'): PortfolioHolding[] {
    let map = this.holdings.get(walletKey.toLowerCase());
    if (!map) {
      this.seedDefaultPortfolio(walletKey.toLowerCase());
      map = this.holdings.get(walletKey.toLowerCase())!;
    }

    const items = Array.from(map.values());
    const totalUSD = items.reduce((acc, item) => acc + item.balanceUSD, 0);

    // Recompute percentage distribution
    return items.map((item) => ({
      ...item,
      allocationPercentage: totalUSD > 0 ? Number(((item.balanceUSD / totalUSD) * 100).toFixed(1)) : 0
    }));
  }

  public recordTrade(
    walletKey: string = 'default',
    ticker: string,
    sharesPurchased: number,
    amountUSD: number,
    txHash: string
  ) {
    const key = walletKey.toLowerCase();
    let map = this.holdings.get(key);
    if (!map) {
      this.seedDefaultPortfolio(key);
      map = this.holdings.get(key)!;
    }

    const stock = VERIFIED_BASE_TOKENIZED_STOCKS[ticker];
    if (!stock) return;

    const existing = map.get(ticker);
    if (existing) {
      const newBalance = Number((existing.balance + sharesPurchased).toFixed(4));
      const newBalanceUSD = Number((newBalance * stock.referencePriceUSD).toFixed(2));
      map.set(ticker, {
        ...existing,
        balance: newBalance,
        balanceUSD: newBalanceUSD
      });
    } else {
      map.set(ticker, {
        ticker: stock.ticker,
        name: stock.name,
        balance: Number(sharesPurchased.toFixed(4)),
        balanceUSD: Number(amountUSD.toFixed(2)),
        currentPrice: stock.referencePriceUSD,
        change24h: 1.5,
        allocationPercentage: 0,
        contractAddress: stock.contractAddress,
        explorerUrl: `${BASE_EXPLORER_URL}/token/${stock.contractAddress}`
      });
    }
  }

  public recordSell(
    walletKey: string = 'default',
    ticker: string,
    amountUSD?: number,
    sharesSold?: number,
    txHash?: string
  ): { success: boolean; sharesSold: number; amountUSD: number; remainingShares: number } {
    const key = walletKey.toLowerCase();
    let map = this.holdings.get(key);
    if (!map) {
      this.seedDefaultPortfolio(key);
      map = this.holdings.get(key)!;
    }

    const stock = VERIFIED_BASE_TOKENIZED_STOCKS[ticker];
    if (!stock) {
      throw new Error(`Asset ${ticker} not supported on Base Mainnet.`);
    }

    const existing = map.get(ticker);
    if (!existing || existing.balance <= 0) {
      throw new Error(`You do not have any ${ticker} holdings in your wallet to sell.`);
    }

    let calculatedShares = sharesSold;
    let calculatedUSD = amountUSD;

    if (calculatedShares !== undefined && calculatedShares > 0) {
      calculatedUSD = Number((calculatedShares * stock.referencePriceUSD).toFixed(4));
    } else if (calculatedUSD !== undefined && calculatedUSD > 0) {
      calculatedShares = Number((calculatedUSD / stock.referencePriceUSD).toFixed(6));
    } else {
      // Default to selling entire position if neither specified
      calculatedShares = existing.balance;
      calculatedUSD = existing.balanceUSD;
    }

    // Clamp to available balance
    if (calculatedShares > existing.balance) {
      calculatedShares = existing.balance;
      calculatedUSD = Number((calculatedShares * stock.referencePriceUSD).toFixed(4));
    }

    const remainingShares = Math.max(0, Number((existing.balance - calculatedShares).toFixed(6)));
    const remainingUSD = Math.max(0, Number((remainingShares * stock.referencePriceUSD).toFixed(2)));

    if (remainingShares <= 0.000001) {
      map.delete(ticker);
    } else {
      map.set(ticker, {
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

  public getTotalValueUSD(walletKey: string = 'default'): number {
    const holdings = this.getHoldings(walletKey);
    return Number(holdings.reduce((sum, h) => sum + h.balanceUSD, 0).toFixed(2));
  }
}

export const portfolioStore = new PortfolioStore();
