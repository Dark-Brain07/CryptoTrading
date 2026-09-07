import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { VERIFIED_BASE_TOKENIZED_STOCKS } from '../../shared';

export const stockRegistryTool = new DynamicStructuredTool({
  name: 'resolve_tokenized_stock',
  description: 'Resolves a stock ticker (e.g. TSLA, NVDA, AAPL, SPY) to its verified Base Mainnet contract address, reference price, issuer, and decimals.',
  schema: z.object({
    ticker: z.string().describe('The stock ticker symbol to look up, e.g. NVDA')
  }),
  func: async ({ ticker }) => {
    const symbol = ticker.toUpperCase().replace(/^[$]/, '');
    const stock = VERIFIED_BASE_TOKENIZED_STOCKS[symbol];

    if (!stock) {
      const available = Object.keys(VERIFIED_BASE_TOKENIZED_STOCKS).join(', ');
      return JSON.stringify({
        success: false,
        error: `Ticker '${symbol}' not found in Base Mainnet verified registry. Currently supported assets: ${available}`
      });
    }

    return JSON.stringify({
      success: true,
      ticker: stock.ticker,
      name: stock.name,
      contractAddress: stock.contractAddress,
      decimals: stock.decimals,
      issuer: stock.issuer,
      category: stock.category,
      referencePriceUSD: stock.referencePriceUSD,
      network: 'Base Mainnet (Chain ID 8453)'
    });
  }
});
