"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteTool = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const shared_1 = require("@baseindex/shared");
const aerodrome_1 = require("../../services/aerodrome");
exports.quoteTool = new tools_1.DynamicStructuredTool({
    name: 'get_stock_quote_and_liquidity',
    description: 'Checks live liquidity, price impact, and expected fractional shares for a tokenized stock on Base Mainnet (Aerodrome / Uniswap V3).',
    schema: zod_1.z.object({
        ticker: zod_1.z.string().describe('The stock ticker, e.g. TSLA'),
        amountUSD: zod_1.z.number().describe('Amount of USD to allocate'),
        slippageBps: zod_1.z.number().optional().default(50).describe('Max slippage in basis points, default 50 (0.5%)')
    }),
    func: async ({ ticker, amountUSD, slippageBps }) => {
        const symbol = ticker.toUpperCase().replace(/^[$]/, '');
        const stock = shared_1.VERIFIED_BASE_TOKENIZED_STOCKS[symbol];
        if (!stock) {
            return JSON.stringify({
                success: false,
                error: `Asset ${symbol} not supported on Base Mainnet.`
            });
        }
        const quote = (0, aerodrome_1.getSimulatedOrLiveQuote)(stock, amountUSD, slippageBps);
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
