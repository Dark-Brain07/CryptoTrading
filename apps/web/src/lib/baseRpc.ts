import { http, fallback } from 'viem';

export const BASE_RPC_URLS = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://base-rpc.publicnode.com',
  'https://developer-access-mainnet.base.org',
  'https://base-pokt.nodies.app',
  'https://gateway.tenderly.co/public/base',
  'https://1rpc.io/base',
  'https://mainnet.base.org'
];

export const baseTransport = fallback(
  BASE_RPC_URLS.map(url => http(url, { timeout: 10_000 })),
  { rank: false }
);
