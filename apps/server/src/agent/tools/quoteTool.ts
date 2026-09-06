import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { VERIFIED_BASE_TOKENIZED_STOCKS } from '@baseindex/shared';
import { getSimulatedOrLiveQuote } from '../../services/aerodrome';

export const quoteTool = new DynamicStructuredTool({
  name: 'get_stock_quote_and_liquidity',
  description: 'Checks live liquidity, price impact, and expected fractional shares for a tokenized stock on Base Mainnet (Aerodrome / Uniswap V3).',
  schema: z.object({
    ticker: z.string().describe('The stock ticker, e.g. TSLA'),
    amountUSD: z.number().describe('Amount of USD to allocate'),
    slippageBps: z.number().optional().default(50).describe('Max slippage in basis points, default 50 (0.5%)')
  }),
  func: async ({ ticker, amountUSD, slippageBps }) => {
    const symbol = ticker.toUpperCase().replace(/^[$]/, '');
    const stock = VERIFIED_BASE_TOKENIZED_STOCKS[symbol];

    if (!stock) {
      return JSON.stringify({
        success: false,
        error: `Asset ${symbol} not supported on Base Mainnet.`
      });
    }

    const quote = getSimulatedOrLiveQuote(stock, amountUSD, slippageBps);

    return JSON.stringify({
      success: true,
      ticker: quote.ticker,
      amountInUSD: quote.amountInUSD,
      expectedShares: quote.expectedShares,
      guaranteedMinShares: quote.minSharesOut,
      pricePerShareUSD: quote.pricePerShareUSD,
      priceImpactPercent: `${quote.priceImpactPercent}%`,
      route: quote.route,
      poolAddress: stock.contractAddress
    });
  }
});
