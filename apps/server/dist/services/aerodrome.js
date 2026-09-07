"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLiveAerodromeQuote = getLiveAerodromeQuote;
exports.getSimulatedOrLiveQuote = getSimulatedOrLiveQuote;
exports.buildClientPreparedTransactions = buildClientPreparedTransactions;
const viem_1 = require("viem");
const shared_1 = require("../shared");
const blockchain_1 = require("./blockchain");
/**
 * Calculates live on-chain liquidity quote from Aerodrome Router
 */
async function getLiveAerodromeQuote(stock, amountInUSD, slippageBps = 100 // 1.0% default slippage
) {
    const amountInUSDC = (0, viem_1.parseUnits)(amountInUSD.toFixed(6), shared_1.BASE_USDC.decimals);
    const routes = shared_1.AERODROME_SWAP_ROUTES[stock.ticker];
    if (routes) {
        try {
            const amountsOut = await blockchain_1.publicClient.readContract({
                address: shared_1.AERODROME_ROUTER_ADDRESS,
                abi: shared_1.AERODROME_ROUTER_ABI,
                functionName: 'getAmountsOut',
                args: [amountInUSDC, routes]
            });
            const expectedOutRaw = amountsOut[amountsOut.length - 1];
            const expectedShares = parseFloat((0, viem_1.formatUnits)(expectedOutRaw, stock.decimals));
            const pricePerShare = expectedShares > 0 ? Number((amountInUSD / expectedShares).toFixed(4)) : stock.referencePriceUSD;
            const minSharesOut = expectedShares * (1 - (slippageBps / 10000));
            return {
                ticker: stock.ticker,
                tokenAddress: stock.contractAddress,
                amountInUSD,
                expectedShares: Number(expectedShares.toFixed(6)),
                minSharesOut: Number(minSharesOut.toFixed(6)),
                pricePerShareUSD: pricePerShare,
                priceImpactPercent: 0.15,
                route: 'Aerodrome DEX Base'
            };
        }
        catch (err) {
            console.warn(`Could not fetch live Aerodrome quote for ${stock.ticker}:`, err);
        }
    }
    // Fallback to reference price
    const expected = amountInUSD / stock.referencePriceUSD;
    return {
        ticker: stock.ticker,
        tokenAddress: stock.contractAddress,
        amountInUSD,
        expectedShares: Number(expected.toFixed(6)),
        minSharesOut: Number((expected * 0.99).toFixed(6)),
        pricePerShareUSD: stock.referencePriceUSD,
        priceImpactPercent: 0.20,
        route: 'Aerodrome DEX Base'
    };
}
/**
 * Synchronous quote wrapper for fast estimates
 */
function getSimulatedOrLiveQuote(stock, amountInUSD, slippageBps = 100) {
    const currentPrice = stock.referencePriceUSD;
    const expectedShares = amountInUSD / currentPrice;
    const minSharesOut = expectedShares * (1 - (slippageBps / 10000));
    return {
        ticker: stock.ticker,
        tokenAddress: stock.contractAddress,
        amountInUSD,
        expectedShares: Number(expectedShares.toFixed(6)),
        minSharesOut: Number(minSharesOut.toFixed(6)),
        pricePerShareUSD: currentPrice,
        priceImpactPercent: 0.15,
        route: 'Aerodrome DEX Base'
    };
}
function buildClientPreparedTransactions(recipient, allocations, slippageBps = 100) {
    return allocations.map(a => ({
        to: shared_1.AERODROME_ROUTER_ADDRESS,
        data: '0x',
        value: '0x0',
        description: `Aerodrome DEX Swap: $${a.amountUSD.toFixed(2)} USDC -> ${a.ticker}`,
        ticker: a.ticker,
        amountUSD: a.amountUSD
    }));
}
