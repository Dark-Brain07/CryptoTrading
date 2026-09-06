import { publicClient } from './blockchain';
import { BASE_EXPLORER_URL, BASE_USDC } from '@baseindex/shared';

export interface BaseTokenMarketStats {
  symbol: string;
  name: string;
  address: string;
  priceUSD: number;
  change24h: number;
  liquidityUSD: number;
  volume24hUSD: number;
  marketCapUSD: number;
  pairUrl: string;
}

export interface BaseWhaleTransaction {
  hash: string;
  from: string;
  to: string;
  valueETH: number;
  valueUSD: number;
  blockNumber: number;
  explorerUrl: string;
}

const CORE_BASE_TOKENS = [
  { symbol: 'AERO', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631' },
  { symbol: 'VIRTUAL', address: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b' },
  { symbol: 'DEGEN', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed' },
  { symbol: 'cbBTC', address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' },
  { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' }
];

export async function getBaseMarketIntelligence(): Promise<{
  chainTVL: number;
  tokens: BaseTokenMarketStats[];
  topGainer24h: BaseTokenMarketStats | null;
  highestLiquidity: BaseTokenMarketStats | null;
  highestVolume: BaseTokenMarketStats | null;
}> {
  let chainTVL = 5670000000; // ~$5.67B Base TVL fallback

  try {
    const llamaRes = await fetch('https://api.llama.fi/v2/chains');
    if (llamaRes.ok) {
      const chains = await llamaRes.json();
      const baseChain = chains.find((c: any) => c.name?.toLowerCase() === 'base');
      if (baseChain && baseChain.tvl) {
        chainTVL = Number(baseChain.tvl);
      }
    }
  } catch (e) {
    // ignore
  }

  const addressesStr = CORE_BASE_TOKENS.map(t => t.address).join(',');
  const tokens: BaseTokenMarketStats[] = [];

  try {
    const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addressesStr}`);
    if (dexRes.ok) {
      const data = await dexRes.json();
      const pairs = data.pairs || [];

      // Pick most liquid pair for each token
      for (const core of CORE_BASE_TOKENS) {
        const matching = pairs
          .filter((p: any) => p.baseToken?.address?.toLowerCase() === core.address.toLowerCase() && p.chainId === 'base')
          .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

        if (matching.length > 0) {
          const topPair = matching[0];
          tokens.push({
            symbol: topPair.baseToken.symbol,
            name: topPair.baseToken.name || core.symbol,
            address: core.address,
            priceUSD: parseFloat(topPair.priceUsd || '0'),
            change24h: topPair.priceChange?.h24 || 0,
            liquidityUSD: topPair.liquidity?.usd || 0,
            volume24hUSD: topPair.volume?.h24 || 0,
            marketCapUSD: topPair.fdv || 0,
            pairUrl: topPair.url || `https://dexscreener.com/base/${core.address}`
          });
        }
      }
    }
  } catch (e) {
    console.warn('Could not fetch DexScreener stats for Base tokens:', e);
  }

  const sortedByGain = [...tokens].sort((a, b) => b.change24h - a.change24h);
  const sortedByLiq = [...tokens].sort((a, b) => b.liquidityUSD - a.liquidityUSD);
  const sortedByVol = [...tokens].sort((a, b) => b.volume24hUSD - a.volume24hUSD);

  return {
    chainTVL,
    tokens: sortedByLiq,
    topGainer24h: sortedByGain[0] || null,
    highestLiquidity: sortedByLiq[0] || null,
    highestVolume: sortedByVol[0] || null
  };
}

export async function getRecentBaseWhaleTransactions(limit: number = 5): Promise<BaseWhaleTransaction[]> {
  const ETH_PRICE_ESTIMATE = 2524.00;
  const whaleTxs: BaseWhaleTransaction[] = [];

  try {
    const latestBlockNumber = await publicClient.getBlockNumber();
    
    // Scan last 15 blocks
    const blockPromises = [];
    for (let i = 0; i < 12; i++) {
      blockPromises.push(
        publicClient.getBlock({
          blockNumber: latestBlockNumber - BigInt(i),
          includeTransactions: true
        }).catch(() => null)
      );
    }

    const blocks = await Promise.all(blockPromises);

    for (const b of blocks) {
      if (!b || !b.transactions) continue;
      for (const tx of b.transactions as any[]) {
        if (!tx.value) continue;
        const valETH = parseFloat((Number(tx.value) / 1e18).toFixed(4));
        const valUSD = Number((valETH * ETH_PRICE_ESTIMATE).toFixed(2));

        // Threshold: >= 1.0 ETH (~$2,500+)
        if (valETH >= 1.0) {
          whaleTxs.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to || 'Contract Creation',
            valueETH: valETH,
            valueUSD: valUSD,
            blockNumber: Number(b.number),
            explorerUrl: `${BASE_EXPLORER_URL}/tx/${tx.hash}`
          });
        }
      }
    }
  } catch (e) {
    console.warn('Could not scan recent Base whale transactions:', e);
  }

  // Sort descending by value
  whaleTxs.sort((a, b) => b.valueUSD - a.valueUSD);
  return whaleTxs.slice(0, limit);
}
