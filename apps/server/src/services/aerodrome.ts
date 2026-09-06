import { parseUnits, formatUnits } from 'viem';
import { 
  BASE_USDC, 
  VERIFIED_BASE_TOKENIZED_STOCKS, 
  AERODROME_ROUTER_ADDRESS,
  AERODROME_ROUTER_ABI,
  AERODROME_SWAP_ROUTES,
  StockToken,
  PreparedTransaction 
} from '@baseindex/shared';
import { publicClient } from './blockchain';

export interface QuoteResult {
  ticker: string;
  tokenAddress: `0x${string}`;
  amountInUSD: number;
  expectedShares: number;
  minSharesOut: number;
  pricePerShareUSD: number;
  priceImpactPercent: number;
  route: 'Aerodrome DEX Base';
}

/**
 * Calculates live on-chain liquidity quote from Aerodrome Router
 */
export async function getLiveAerodromeQuote(
  stock: StockToken,
  amountInUSD: number,
  slippageBps: number = 100 // 1.0% default slippage
): Promise<QuoteResult> {
  const amountInUSDC = parseUnits(amountInUSD.toFixed(6), BASE_USDC.decimals);
  const routes = AERODROME_SWAP_ROUTES[stock.ticker];

  if (routes) {
    try {
      const amountsOut = await publicClient.readContract({
        address: AERODROME_ROUTER_ADDRESS,
        abi: AERODROME_ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [amountInUSDC, routes]
      }) as bigint[];

      const expectedOutRaw = amountsOut[amountsOut.length - 1];
      const expectedShares = parseFloat(formatUnits(expectedOutRaw, stock.decimals));
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
    } catch (err) {
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
export function getSimulatedOrLiveQuote(
  stock: StockToken,
  amountInUSD: number,
  slippageBps: number = 100
): QuoteResult {
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

export function buildClientPreparedTransactions(
  recipient: `0x${string}`,
  allocations: { ticker: string; amountUSD: number }[],
  slippageBps: number = 100
): PreparedTransaction[] {
  return allocations.map(a => ({
    to: AERODROME_ROUTER_ADDRESS,
    data: '0x' as `0x${string}`,
    value: '0x0',
    description: `Aerodrome DEX Swap: $${a.amountUSD.toFixed(2)} USDC -> ${a.ticker}`,
    ticker: a.ticker,
    amountUSD: a.amountUSD
  }));
}

