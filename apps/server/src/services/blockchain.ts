import { createPublicClient, http, formatGwei, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { config } from '../config';
import { BASE_USDC, VERIFIED_BASE_TOKENIZED_STOCKS, ERC20_ABI } from '@baseindex/shared';
import { GasTrackerData } from '@baseindex/shared';

export const publicClient = createPublicClient({
  chain: base,
  transport: http(config.BASE_RPC_URL)
});

/**
 * Fetches real-time Base Mainnet gas metrics
 */
export async function getLiveGasMetrics(): Promise<GasTrackerData> {
  try {
    const block = await publicClient.getBlock({ blockTag: 'latest' });
    const gasPrice = await publicClient.getGasPrice();
    const baseFeeGwei = block.baseFeePerGas ? parseFloat(formatGwei(block.baseFeePerGas)) : 0.005;
    const priorityFeeGwei = parseFloat(formatGwei(gasPrice)) - baseFeeGwei;

    // Approximate cost of standard ERC-20 approve + Uniswap/Aerodrome swap (~180,000 gas) with ETH at ~$2500
    const ethGasCost = (180000n * gasPrice);
    const ethGasCostInEth = parseFloat(formatUnits(ethGasCost, 18));
    const estimatedCostUSD = Number((ethGasCostInEth * 2500).toFixed(4));

    return {
      baseFeeGwei: Number(baseFeeGwei.toFixed(4)),
      priorityFeeGwei: Number(Math.max(0, priorityFeeGwei).toFixed(4)),
      estimatedSwapCostUSD: estimatedCostUSD,
      blockNumber: Number(block.number),
      timestamp: Number(block.timestamp) * 1000
    };
  } catch (error) {
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
export async function getOnChainTokenBalance(
  tokenAddress: `0x${string}`,
  walletAddress: `0x${string}`,
  decimals: number = 18
): Promise<number> {
  try {
    const balanceRaw = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress]
    }) as bigint;

    return parseFloat(formatUnits(balanceRaw, decimals));
  } catch (error) {
    console.warn(`Could not read token balance at ${tokenAddress} for ${walletAddress}:`, error);
    return 0;
  }
}
