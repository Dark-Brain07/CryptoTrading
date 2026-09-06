import { PortfolioHolding, VERIFIED_BASE_TOKENIZED_STOCKS, BASE_EXPLORER_URL } from '@baseindex/shared';

// In-memory persistent portfolio store (keyed by wallet address or "default")
class PortfolioStore {
  private holdings: Map<string, Map<string, PortfolioHolding>> = new Map();

  constructor() {
    this.seedDefaultPortfolio('default');
  }

  private seedDefaultPortfolio(walletKey: string) {
    const defaultMap = new Map<string, PortfolioHolding>();

    defaultMap.set('AERO', {
      ticker: 'AERO',
      name: VERIFIED_BASE_TOKENIZED_STOCKS.AERO.name,
      balance: 145.2,
      balanceUSD: Number((145.2 * VERIFIED_BASE_TOKENIZED_STOCKS.AERO.referencePriceUSD).toFixed(2)),
      currentPrice: VERIFIED_BASE_TOKENIZED_STOCKS.AERO.referencePriceUSD,
      change24h: 4.82,
      allocationPercentage: 35.0,
      contractAddress: VERIFIED_BASE_TOKENIZED_STOCKS.AERO.contractAddress,
      explorerUrl: `${BASE_EXPLORER_URL}/token/${VERIFIED_BASE_TOKENIZED_STOCKS.AERO.contractAddress}`
    });

    defaultMap.set('WETH', {
      ticker: 'WETH',
      name: VERIFIED_BASE_TOKENIZED_STOCKS.WETH.name,
      balance: 0.045,
      balanceUSD: Number((0.045 * VERIFIED_BASE_TOKENIZED_STOCKS.WETH.referencePriceUSD).toFixed(2)),
      currentPrice: VERIFIED_BASE_TOKENIZED_STOCKS.WETH.referencePriceUSD,
      change24h: 1.65,
      allocationPercentage: 30.0,
      contractAddress: VERIFIED_BASE_TOKENIZED_STOCKS.WETH.contractAddress,
      explorerUrl: `${BASE_EXPLORER_URL}/token/${VERIFIED_BASE_TOKENIZED_STOCKS.WETH.contractAddress}`
    });

    defaultMap.set('VIRTUAL', {
      ticker: 'VIRTUAL',
      name: VERIFIED_BASE_TOKENIZED_STOCKS.VIRTUAL.name,
      balance: 85.0,
      balanceUSD: Number((85.0 * VERIFIED_BASE_TOKENIZED_STOCKS.VIRTUAL.referencePriceUSD).toFixed(2)),
      currentPrice: VERIFIED_BASE_TOKENIZED_STOCKS.VIRTUAL.referencePriceUSD,
      change24h: 8.42,
      allocationPercentage: 20.0,
      contractAddress: VERIFIED_BASE_TOKENIZED_STOCKS.VIRTUAL.contractAddress,
      explorerUrl: `${BASE_EXPLORER_URL}/token/${VERIFIED_BASE_TOKENIZED_STOCKS.VIRTUAL.contractAddress}`
    });

    defaultMap.set('cbBTC', {
      ticker: 'cbBTC',
      name: VERIFIED_BASE_TOKENIZED_STOCKS.cbBTC.name,
      balance: 0.00065,
      balanceUSD: Number((0.00065 * VERIFIED_BASE_TOKENIZED_STOCKS.cbBTC.referencePriceUSD).toFixed(2)),
      currentPrice: VERIFIED_BASE_TOKENIZED_STOCKS.cbBTC.referencePriceUSD,
      change24h: -0.45,
      allocationPercentage: 15.0,
      contractAddress: VERIFIED_BASE_TOKENIZED_STOCKS.cbBTC.contractAddress,
      explorerUrl: `${BASE_EXPLORER_URL}/token/${VERIFIED_BASE_TOKENIZED_STOCKS.cbBTC.contractAddress}`
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

    const symbol = ticker.toUpperCase().replace(/^[$]/, '');
    const stock = VERIFIED_BASE_TOKENIZED_STOCKS[symbol];
    const refPrice = stock ? stock.referencePriceUSD : (sharesPurchased > 0 ? amountUSD / sharesPurchased : 1.0);
    const contractAddress = stock ? stock.contractAddress : (ticker.startsWith('0x') ? ticker as `0x${string}` : '0x0000000000000000000000000000000000000000');
    const name = stock ? stock.name : `${symbol} Token`;

    const existing = map.get(symbol);
    if (existing) {
      const newBalance = Number((existing.balance + sharesPurchased).toFixed(6));
      const newBalanceUSD = Number((newBalance * refPrice).toFixed(2));
      map.set(symbol, {
        ...existing,
        balance: newBalance,
        balanceUSD: newBalanceUSD,
        explorerUrl: `${BASE_EXPLORER_URL}/tx/${txHash}`
      });
    } else {
      map.set(symbol, {
        ticker: symbol,
        name,
        balance: Number(sharesPurchased.toFixed(6)),
        balanceUSD: Number(amountUSD.toFixed(2)),
        currentPrice: refPrice,
        change24h: 2.1,
        allocationPercentage: 0,
        contractAddress,
        explorerUrl: `${BASE_EXPLORER_URL}/tx/${txHash}`
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

    const symbol = ticker.toUpperCase().replace(/^[$]/, '');
    const stock = VERIFIED_BASE_TOKENIZED_STOCKS[symbol];
    const refPrice = stock ? stock.referencePriceUSD : 1.0;

    const existing = map.get(symbol);
    if (!existing || existing.balance <= 0) {
      throw new Error(`You do not have any ${symbol} holdings in your wallet to sell.`);
    }

    let calculatedShares = sharesSold;
    let calculatedUSD = amountUSD;

    if (calculatedShares !== undefined && calculatedShares > 0) {
      calculatedUSD = Number((calculatedShares * refPrice).toFixed(4));
    } else if (calculatedUSD !== undefined && calculatedUSD > 0) {
      calculatedShares = Number((calculatedUSD / refPrice).toFixed(6));
    } else {
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
    } else {
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

  public getTotalValueUSD(walletKey: string = 'default'): number {
    const holdings = this.getHoldings(walletKey);
    return Number(holdings.reduce((sum, h) => sum + h.balanceUSD, 0).toFixed(2));
  }
}

export const portfolioStore = new PortfolioStore();
