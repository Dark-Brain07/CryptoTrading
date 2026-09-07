"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockRegistryTool = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const shared_1 = require("../../shared");
exports.stockRegistryTool = new tools_1.DynamicStructuredTool({
    name: 'resolve_tokenized_stock',
    description: 'Resolves a stock ticker (e.g. TSLA, NVDA, AAPL, SPY) to its verified Base Mainnet contract address, reference price, issuer, and decimals.',
    schema: zod_1.z.object({
        ticker: zod_1.z.string().describe('The stock ticker symbol to look up, e.g. NVDA')
    }),
    func: async ({ ticker }) => {
        const symbol = ticker.toUpperCase().replace(/^[$]/, '');
        const stock = shared_1.VERIFIED_BASE_TOKENIZED_STOCKS[symbol];
        if (!stock) {
            const available = Object.keys(shared_1.VERIFIED_BASE_TOKENIZED_STOCKS).join(', ');
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
