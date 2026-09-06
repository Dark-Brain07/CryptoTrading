import { parseUnits, encodeFunctionData } from 'viem';
import { 
  BASE_USDC, 
  VERIFIED_BASE_TOKENIZED_STOCKS, 
  AERODROME_ROUTER_ADDRESS,
  UNISWAP_V3_ROUTER_ADDRESS,
  ERC20_ABI,
  StockToken,
  PreparedTransaction 
} from '@baseindex/shared';

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
] as const;

export interface QuoteResult {
  ticker: string;
  tokenAddress: `0x${string}`;
  amountInUSD: number;
  expectedShares: number;
  minSharesOut: number;
  pricePerShareUSD: number;
  priceImpactPercent: number;
  route: 'Aerodrome Slipstream' | 'Uniswap V3 Base';
}

/**
 * Calculates liquidity quote and slippage minimums
 */
export function getSimulatedOrLiveQuote(
  stock: StockToken,
  amountInUSD: number,
  slippageBps: number = 50
): QuoteResult {
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
export function buildClientPreparedTransactions(
  recipient: `0x${string}`,
  allocations: { ticker: string; amountUSD: number }[],
  slippageBps: number = 50
): PreparedTransaction[] {
  const transactions: PreparedTransaction[] = [];

  for (const alloc of allocations) {
    const stock = VERIFIED_BASE_TOKENIZED_STOCKS[alloc.ticker];
    if (!stock) continue;

    const amountInBigInt = parseUnits(alloc.amountUSD.toString(), BASE_USDC.decimals);
    const quote = getSimulatedOrLiveQuote(stock, alloc.amountUSD, slippageBps);
    const minOutBigInt = parseUnits(quote.minSharesOut.toString(), stock.decimals);

    // 1. USDC Approval Calldata to Aerodrome/Uniswap Router
    const approvalData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [AERODROME_ROUTER_ADDRESS, amountInBigInt]
    });

    transactions.push({
      to: BASE_USDC.contractAddress,
      data: approvalData,
      value: '0x0',
      description: `Approve $${alloc.amountUSD.toFixed(2)} USDC for ${stock.ticker} purchase`,
      ticker: 'USDC',
      amountUSD: alloc.amountUSD
    });

    // 2. Exact Input Swap Calldata
    const swapData = encodeFunctionData({
      abi: ROUTER_SWAP_ABI,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn: BASE_USDC.contractAddress,
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
      to: AERODROME_ROUTER_ADDRESS,
      data: swapData,
      value: '0x0',
      description: `Swap $${alloc.amountUSD.toFixed(2)} USDC for ~${quote.expectedShares.toFixed(4)} ${stock.ticker}`,
      ticker: stock.ticker,
      amountUSD: alloc.amountUSD
    });
  }

  return transactions;
}
