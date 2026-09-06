"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSimulatedOrLiveQuote = getSimulatedOrLiveQuote;
exports.buildClientPreparedTransactions = buildClientPreparedTransactions;
const viem_1 = require("viem");
const shared_1 = require("@baseindex/shared");
// Minimal ABI for Uniswap V3 / Aerodrome router exactInputSingle
const ROUTER_SWAP_ABI = [
    {
        inputs: [
            {
                components: [
                    { name: 'tokenIn', type: 'address' },
                    { name: 'tokenOut', type: 'address' },
                    { name: 'fee', type: 'uint24' },
                    { name: 'recipient', type: 'address' },
                    { name: 'amountIn', type: 'uint256' },
                    { name: 'amountOutMinimum', type: 'uint256' },
                    { name: 'sqrtPriceLimitX96', type: 'uint160' }
                ],
                name: 'params',
                type: 'tuple'
            }
        ],
        name: 'exactInputSingle',
        outputs: [{ name: 'amountOut', type: 'uint256' }],
        stateMutability: 'payable',
        type: 'function'
    }
];
/**
 * Calculates liquidity quote and slippage minimums
 */
function getSimulatedOrLiveQuote(stock, amountInUSD, slippageBps = 50) {
    const currentPrice = stock.referencePriceUSD;
    // Estimate shares before slippage
    const expectedShares = amountInUSD / currentPrice;
    // Price impact estimation based on pool depth (0.01% - 0.25%)
    const priceImpactPercent = Math.min(0.25, (amountInUSD / 50000) * 0.15);
    // Apply slippage constraint (e.g., 50 bps = 0.5%)
    const slippageFraction = slippageBps / 10000;
    const minSharesOut = expectedShares * (1 - slippageFraction);
    return {
        ticker: stock.ticker,
        tokenAddress: stock.contractAddress,
        amountInUSD,
        expectedShares: Number(expectedShares.toFixed(6)),
        minSharesOut: Number(minSharesOut.toFixed(6)),
        pricePerShareUSD: currentPrice,
        priceImpactPercent: Number(priceImpactPercent.toFixed(3)),
        route: 'Aerodrome Slipstream'
    };
}
/**
 * Generates prepared calldata for client-side Web3 wallet execution (RainbowKit)
 */
function buildClientPreparedTransactions(recipient, allocations, slippageBps = 50) {
    const transactions = [];
    for (const alloc of allocations) {
        const stock = shared_1.VERIFIED_BASE_TOKENIZED_STOCKS[alloc.ticker];
        if (!stock)
            continue;
        const amountInBigInt = (0, viem_1.parseUnits)(alloc.amountUSD.toString(), shared_1.BASE_USDC.decimals);
        const quote = getSimulatedOrLiveQuote(stock, alloc.amountUSD, slippageBps);
        const minOutBigInt = (0, viem_1.parseUnits)(quote.minSharesOut.toString(), stock.decimals);
        // 1. USDC Approval Calldata to Aerodrome/Uniswap Router
        const approvalData = (0, viem_1.encodeFunctionData)({
            abi: shared_1.ERC20_ABI,
            functionName: 'approve',
            args: [shared_1.AERODROME_ROUTER_ADDRESS, amountInBigInt]
        });
        transactions.push({
            to: shared_1.BASE_USDC.contractAddress,
            data: approvalData,
            value: '0x0',
            description: `Approve $${alloc.amountUSD.toFixed(2)} USDC for ${stock.ticker} purchase`,
            ticker: 'USDC',
            amountUSD: alloc.amountUSD
        });
        // 2. Exact Input Swap Calldata
        const swapData = (0, viem_1.encodeFunctionData)({
            abi: ROUTER_SWAP_ABI,
            functionName: 'exactInputSingle',
            args: [
                {
                    tokenIn: shared_1.BASE_USDC.contractAddress,
                    tokenOut: stock.contractAddress,
                    fee: 500, // 0.05% fee tier
                    recipient: recipient,
                    amountIn: amountInBigInt,
                    amountOutMinimum: minOutBigInt,
                    sqrtPriceLimitX96: 0n
                }
            ]
        });
        transactions.push({
            to: shared_1.AERODROME_ROUTER_ADDRESS,
            data: swapData,
            value: '0x0',
            description: `Swap $${alloc.amountUSD.toFixed(2)} USDC for ~${quote.expectedShares.toFixed(4)} ${stock.ticker}`,
            ticker: stock.ticker,
            amountUSD: alloc.amountUSD
        });
    }
    return transactions;
}
