"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicClient = void 0;
exports.getLiveGasMetrics = getLiveGasMetrics;
exports.getOnChainTokenBalance = getOnChainTokenBalance;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const config_1 = require("../config");
const shared_1 = require("@baseindex/shared");
exports.publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.base,
    transport: (0, viem_1.http)(config_1.config.BASE_RPC_URL)
});
/**
 * Fetches real-time Base Mainnet gas metrics
 */
async function getLiveGasMetrics() {
    try {
        const block = await exports.publicClient.getBlock({ blockTag: 'latest' });
        const gasPrice = await exports.publicClient.getGasPrice();
        const baseFeeGwei = block.baseFeePerGas ? parseFloat((0, viem_1.formatGwei)(block.baseFeePerGas)) : 0.005;
        const priorityFeeGwei = parseFloat((0, viem_1.formatGwei)(gasPrice)) - baseFeeGwei;
        // Approximate cost of standard ERC-20 approve + Uniswap/Aerodrome swap (~180,000 gas) with ETH at ~$2500
        const ethGasCost = (180000n * gasPrice);
        const ethGasCostInEth = parseFloat((0, viem_1.formatUnits)(ethGasCost, 18));
        const estimatedCostUSD = Number((ethGasCostInEth * 2500).toFixed(4));
        return {
            baseFeeGwei: Number(baseFeeGwei.toFixed(4)),
            priorityFeeGwei: Number(Math.max(0, priorityFeeGwei).toFixed(4)),
            estimatedSwapCostUSD: estimatedCostUSD,
            blockNumber: Number(block.number),
            timestamp: Number(block.timestamp) * 1000
        };
    }
    catch (error) {
        console.warn('Error fetching live gas metrics from Base Mainnet RPC:', error);
        return {
            baseFeeGwei: 0.008,
            priorityFeeGwei: 0.002,
            estimatedSwapCostUSD: 0.0045,
            blockNumber: 19804210,
            timestamp: Date.now()
        };
    }
}
/**
 * Query real on-chain ERC-20 balance for a given wallet address on Base Mainnet
 */
async function getOnChainTokenBalance(tokenAddress, walletAddress, decimals = 18) {
    try {
        const balanceRaw = await exports.publicClient.readContract({
            address: tokenAddress,
            abi: shared_1.ERC20_ABI,
            functionName: 'balanceOf',
            args: [walletAddress]
        });
        return parseFloat((0, viem_1.formatUnits)(balanceRaw, decimals));
    }
    catch (error) {
        console.warn(`Could not read token balance at ${tokenAddress} for ${walletAddress}:`, error);
        return 0;
    }
}
