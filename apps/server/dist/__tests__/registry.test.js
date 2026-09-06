"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@baseindex/shared");
const aerodrome_1 = require("../services/aerodrome");
describe('BaseIndex Agent - Base Mainnet Tokenized Stocks', () => {
    it('should include all verified equities with valid Base contract addresses', () => {
        const requiredTickers = ['TSLA', 'NVDA', 'AAPL', 'MSFT', 'SPY', 'COIN'];
        for (const ticker of requiredTickers) {
            const stock = shared_1.VERIFIED_BASE_TOKENIZED_STOCKS[ticker];
            expect(stock).toBeDefined();
            expect(stock.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
            expect(stock.decimals).toBe(18);
            expect(stock.referencePriceUSD).toBeGreaterThan(0);
        }
    });
    it('should calculate accurate quotes with strict 50 bps slippage bounds', () => {
        const nvda = shared_1.VERIFIED_BASE_TOKENIZED_STOCKS.NVDA;
        const amountUSD = 1000;
        const quote = (0, aerodrome_1.getSimulatedOrLiveQuote)(nvda, amountUSD, 50);
        expect(quote.ticker).toBe('NVDA');
        expect(quote.expectedShares).toBeCloseTo(amountUSD / nvda.referencePriceUSD, 3);
        // Slippage guarantee: minSharesOut should be 99.5% of expectedShares
        expect(quote.minSharesOut).toBeCloseTo(quote.expectedShares * 0.995, 3);
    });
});
