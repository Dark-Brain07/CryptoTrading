import {
  PublicClient,
  WalletClient,
  parseUnits,
  formatUnits,
  maxUint256
} from 'viem';
import {
  BASE_USDC,
  ERC20_ABI,
  VERIFIED_BASE_TOKENIZED_STOCKS
} from '@baseindex/shared';

export const BASE_WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as const;
export const AERODROME_ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43' as const;
export const AERODROME_FACTORY_ADDRESS = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da' as const;

export interface AerodromeRoute {
  from: `0x${string}`;
  to: `0x${string}`;
  stable: boolean;
  factory: `0x${string}`;
}

export const AERODROME_SWAP_ROUTES: Record<string, AerodromeRoute[]> = {
  AERO: [
    {
      from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      to: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ],
  WETH: [
    {
      from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      to: BASE_WETH_ADDRESS,
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ],
  cbBTC: [
    {
      from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      to: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ],
  VIRTUAL: [
    {
      from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      to: BASE_WETH_ADDRESS,
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    },
    {
      from: BASE_WETH_ADDRESS,
      to: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b',
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ],
  DEGEN: [
    {
      from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      to: BASE_WETH_ADDRESS,
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    },
    {
      from: BASE_WETH_ADDRESS,
      to: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ],
  // Base Tokenized Equities Swap Routes (Direct USDC pairs)
  NVDAc: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb20000000000000000000078ee7ce2fE4908108C', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  NVDA: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb20000000000000000000078ee7ce2fE4908108C', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  METAc: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb2000000000000000000008bC8786B856E61707C', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  META: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb2000000000000000000008bC8786B856E61707C', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  AAPLc: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb200000000000000000000C2e324d24d7eEcd1fb', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  AAPL: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb200000000000000000000C2e324d24d7eEcd1fb', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  GOOGLc: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb2000000000000000000002D0BA3164cc74f58B7', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  GOOGL: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb2000000000000000000002D0BA3164cc74f58B7', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  AMZNc: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb200000000000000000000d9192b6B456483C2E8', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  AMZN: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb200000000000000000000d9192b6B456483C2E8', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  MSFTc: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xB200000000000000000000Ab99cFa739E253872B', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  MSFT: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xB200000000000000000000Ab99cFa739E253872B', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  MSTRc: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb2000000000000000000004884b426556b92883d', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  MSTR: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb2000000000000000000004884b426556b92883d', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  SNDKc: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb200000000000000000000397293Cb8cda9a10c5', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  SNDK: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb200000000000000000000397293Cb8cda9a10c5', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  SPCXc: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb2000000000000000000007b9fcbd005511aCBd5', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  SPCX: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb2000000000000000000007b9fcbd005511aCBd5', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  TSLAc: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb2000000000000000000001e800a7f5189430cD0', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ],
  TSLA: [
    { from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', to: '0xb2000000000000000000001e800a7f5189430cD0', stable: false, factory: AERODROME_FACTORY_ADDRESS }
  ]
};

export const AERODROME_ROUTER_ABI = [
  {
    name: 'defaultFactory',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'stable', type: 'bool' },
          { name: 'factory', type: 'address' }
        ]
      }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  },
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'stable', type: 'bool' },
          { name: 'factory', type: 'address' }
        ]
      },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  },
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'stable', type: 'bool' },
          { name: 'factory', type: 'address' }
        ]
      },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  },
  {
    name: 'swapExactTokensForETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'stable', type: 'bool' },
          { name: 'factory', type: 'address' }
        ]
      },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  }
] as const;

export interface TokenDiscoveryResult {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  hasLiquidity: boolean;
  route?: AerodromeRoute[];
  priceUSD?: number;
}

export interface SwapExecutionResult {
  txHash: `0x${string}`;
  explorerUrl: string;
  amountIn: number;
  amountOut: number;
  symbol: string;
  tokenAddress: `0x${string}`;
  timestamp: number;
}

export const KNOWN_BASE_TOKENS_BY_SYMBOL: Record<string, { address: `0x${string}`; name: string; symbol: string; decimals: number; priceUSD: number }> = {
  AERO: { address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', name: 'Aerodrome Finance', symbol: 'AERO', decimals: 18, priceUSD: 1.18 },
  WETH: { address: '0x4200000000000000000000000000000000000006', name: 'Wrapped Ether', symbol: 'WETH', decimals: 18, priceUSD: 2450.00 },
  CBBTC: { address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', name: 'Coinbase Wrapped BTC', symbol: 'cbBTC', decimals: 8, priceUSD: 57800.00 },
  VIRTUAL: { address: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b', name: 'Virtuals Protocol', symbol: 'VIRTUAL', decimals: 18, priceUSD: 2.15 },
  DEGEN: { address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', name: 'Degen', symbol: 'DEGEN', decimals: 18, priceUSD: 0.0085 },
  USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', name: 'USD Coin', symbol: 'USDC', decimals: 6, priceUSD: 1.00 },

  // Base Tokenized Equities (Stocks)
  NVDAC: { address: '0xb20000000000000000000078ee7ce2fE4908108C', name: 'NVIDIA (NVDAc)', symbol: 'NVDAc', decimals: 18, priceUSD: 128.50 },
  NVDA: { address: '0xb20000000000000000000078ee7ce2fE4908108C', name: 'NVIDIA', symbol: 'NVDAc', decimals: 18, priceUSD: 128.50 },
  NVIDIA: { address: '0xb20000000000000000000078ee7ce2fE4908108C', name: 'NVIDIA', symbol: 'NVDAc', decimals: 18, priceUSD: 128.50 },

  METAC: { address: '0xb2000000000000000000008bC8786B856E61707C', name: 'Meta Platforms (METAc)', symbol: 'METAc', decimals: 18, priceUSD: 512.00 },
  META: { address: '0xb2000000000000000000008bC8786B856E61707C', name: 'Meta Platforms', symbol: 'METAc', decimals: 18, priceUSD: 512.00 },

  AAPLC: { address: '0xb200000000000000000000C2e324d24d7eEcd1fb', name: 'Apple (AAPLc)', symbol: 'AAPLc', decimals: 18, priceUSD: 228.00 },
  AAPL: { address: '0xb200000000000000000000C2e324d24d7eEcd1fb', name: 'Apple', symbol: 'AAPLc', decimals: 18, priceUSD: 228.00 },
  APPLE: { address: '0xb200000000000000000000C2e324d24d7eEcd1fb', name: 'Apple', symbol: 'AAPLc', decimals: 18, priceUSD: 228.00 },

  GOOGLC: { address: '0xb2000000000000000000002D0BA3164cc74f58B7', name: 'Alphabet (GOOGLc)', symbol: 'GOOGLc', decimals: 18, priceUSD: 164.00 },
  GOOGL: { address: '0xb2000000000000000000002D0BA3164cc74f58B7', name: 'Alphabet', symbol: 'GOOGLc', decimals: 18, priceUSD: 164.00 },
  GOOGLE: { address: '0xb2000000000000000000002D0BA3164cc74f58B7', name: 'Alphabet', symbol: 'GOOGLc', decimals: 18, priceUSD: 164.00 },

  AMZNC: { address: '0xb200000000000000000000d9192b6B456483C2E8', name: 'Amazon (AMZNc)', symbol: 'AMZNc', decimals: 18, priceUSD: 186.00 },
  AMZN: { address: '0xb200000000000000000000d9192b6B456483C2E8', name: 'Amazon', symbol: 'AMZNc', decimals: 18, priceUSD: 186.00 },
  AMAZON: { address: '0xb200000000000000000000d9192b6B456483C2E8', name: 'Amazon', symbol: 'AMZNc', decimals: 18, priceUSD: 186.00 },

  MSFTC: { address: '0xB200000000000000000000Ab99cFa739E253872B', name: 'Microsoft (MSFTc)', symbol: 'MSFTc', decimals: 18, priceUSD: 418.00 },
  MSFT: { address: '0xB200000000000000000000Ab99cFa739E253872B', name: 'Microsoft', symbol: 'MSFTc', decimals: 18, priceUSD: 418.00 },
  MICROSOFT: { address: '0xB200000000000000000000Ab99cFa739E253872B', name: 'Microsoft', symbol: 'MSFTc', decimals: 18, priceUSD: 418.00 },

  MSTRC: { address: '0xb2000000000000000000004884b426556b92883d', name: 'MicroStrategy (MSTRc)', symbol: 'MSTRc', decimals: 18, priceUSD: 138.00 },
  MSTR: { address: '0xb2000000000000000000004884b426556b92883d', name: 'MicroStrategy', symbol: 'MSTRc', decimals: 18, priceUSD: 138.00 },

  SNDKC: { address: '0xb200000000000000000000397293Cb8cda9a10c5', name: 'SanDisk (SNDKc)', symbol: 'SNDKc', decimals: 18, priceUSD: 72.00 },
  SNDK: { address: '0xb200000000000000000000397293Cb8cda9a10c5', name: 'SanDisk', symbol: 'SNDKc', decimals: 18, priceUSD: 72.00 },

  SPCXC: { address: '0xb2000000000000000000007b9fcbd005511aCBd5', name: 'SpaceX (SPCXc)', symbol: 'SPCXc', decimals: 18, priceUSD: 185.00 },
  SPCX: { address: '0xb2000000000000000000007b9fcbd005511aCBd5', name: 'SpaceX', symbol: 'SPCXc', decimals: 18, priceUSD: 185.00 },

  TSLAC: { address: '0xb2000000000000000000001e800a7f5189430cD0', name: 'Tesla (TSLAc)', symbol: 'TSLAc', decimals: 18, priceUSD: 215.00 },
  TSLA: { address: '0xb2000000000000000000001e800a7f5189430cD0', name: 'Tesla', symbol: 'TSLAc', decimals: 18, priceUSD: 215.00 },
  TESLA: { address: '0xb2000000000000000000001e800a7f5189430cD0', name: 'Tesla', symbol: 'TSLAc', decimals: 18, priceUSD: 215.00 }
};

export const KNOWN_BASE_TOKENS_BY_ADDRESS: Record<string, { name: string; symbol: string; decimals: number; priceUSD: number }> = {
  '0x940181a94a35a4569e4529a3cdfb74e38fd98631': { name: 'Aerodrome Finance', symbol: 'AERO', decimals: 18, priceUSD: 1.18 },
  '0x4200000000000000000000000000000000000006': { name: 'Wrapped Ether', symbol: 'WETH', decimals: 18, priceUSD: 2450.00 },
  '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf': { name: 'Coinbase Wrapped BTC', symbol: 'cbBTC', decimals: 8, priceUSD: 57800.00 },
  '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b': { name: 'Virtuals Protocol', symbol: 'VIRTUAL', decimals: 18, priceUSD: 2.15 },
  '0x4ed4e862860bed51a9570b96d89af5e1b0efefed': { name: 'Degen', symbol: 'DEGEN', decimals: 18, priceUSD: 0.0085 },
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { name: 'USD Coin', symbol: 'USDC', decimals: 6, priceUSD: 1.00 },

  // Base Tokenized Equities (Lowercased Addresses)
  '0xb20000000000000000000078ee7ce2fe4908108c': { name: 'NVIDIA', symbol: 'NVDAc', decimals: 18, priceUSD: 128.50 },
  '0xb2000000000000000000008bc8786b856e61707c': { name: 'Meta', symbol: 'METAc', decimals: 18, priceUSD: 512.00 },
  '0xb200000000000000000000c2e324d24d7eecd1fb': { name: 'Apple', symbol: 'AAPLc', decimals: 18, priceUSD: 228.00 },
  '0xb2000000000000000000002d0ba3164cc74f58b7': { name: 'Alphabet', symbol: 'GOOGLc', decimals: 18, priceUSD: 164.00 },
  '0xb200000000000000000000d9192b6b456483c2e8': { name: 'Amazon', symbol: 'AMZNc', decimals: 18, priceUSD: 186.00 },
  '0xb200000000000000000000ab99cfa739e253872b': { name: 'Microsoft', symbol: 'MSFTc', decimals: 18, priceUSD: 418.00 },
  '0xb2000000000000000000004884b426556b92883d': { name: 'MicroStrategy', symbol: 'MSTRc', decimals: 18, priceUSD: 138.00 },
  '0xb200000000000000000000397293cb8cda9a10c5': { name: 'SanDisk', symbol: 'SNDKc', decimals: 18, priceUSD: 72.00 },
  '0xb2000000000000000000007b9fcbd005511acbd5': { name: 'SpaceX', symbol: 'SPCXc', decimals: 18, priceUSD: 185.00 },
  '0xb2000000000000000000001e800a7f5189430cd0': { name: 'Tesla', symbol: 'TSLAc', decimals: 18, priceUSD: 215.00 }
};

/**
 * Inspects any ERC-20 contract address or recognized symbol on Base Mainnet and verifies DEX liquidity on Aerodrome
 */
export async function discoverTokenMetadata(
  publicClient: any,
  tokenAddressOrSymbol: string
): Promise<TokenDiscoveryResult> {
  let targetAddress: `0x${string}`;

  const clean = tokenAddressOrSymbol.trim().toUpperCase().replace(/^[$]/, '');
  if (KNOWN_BASE_TOKENS_BY_SYMBOL[clean]) {
    targetAddress = KNOWN_BASE_TOKENS_BY_SYMBOL[clean].address;
  } else if (tokenAddressOrSymbol.startsWith('0x') && tokenAddressOrSymbol.length === 42) {
    targetAddress = tokenAddressOrSymbol as `0x${string}`;
  } else {
    throw new Error(`Invalid token symbol or address: "${tokenAddressOrSymbol}". Please provide a symbol (AERO, WETH, VIRTUAL) or a 42-character contract address.`);
  }

  const code = await publicClient.getBytecode({ address: targetAddress });
  if (!code || code === '0x') {
    throw new Error(`Address ${targetAddress} is not a deployed contract on Base Mainnet.`);
  }

  // 1. Read standard ERC20 properties with known token override
  const known = KNOWN_BASE_TOKENS_BY_ADDRESS[targetAddress.toLowerCase()];
  let symbol = known?.symbol || 'UNKNOWN';
  let name = known?.name || 'Custom Token';
  let decimals = known?.decimals || 18;
  let priceUSD = known?.priceUSD;

  try {
    const sym = await publicClient.readContract({
      address: targetAddress,
      abi: ERC20_ABI,
      functionName: 'symbol'
    });
    symbol = String(sym);
  } catch {}

  try {
    const nm = await publicClient.readContract({
      address: targetAddress,
      abi: ERC20_ABI,
      functionName: 'name'
    });
    name = String(nm);
  } catch {}

  try {
    const dec = await publicClient.readContract({
      address: targetAddress,
      abi: ERC20_ABI,
      functionName: 'decimals'
    });
    decimals = Number(dec);
  } catch {}

  // 2. Discover best Aerodrome liquidity route (1 USDC test query)
  const testUSDC = BigInt(1000000); // 1.00 USDC
  let bestRoute: AerodromeRoute[] | undefined;

  // Try direct route: USDC -> Token
  const directRoute: AerodromeRoute[] = [
    {
      from: BASE_USDC.contractAddress,
      to: targetAddress,
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ];

  try {
    const out = await publicClient.readContract({
      address: AERODROME_ROUTER_ADDRESS,
      abi: AERODROME_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [testUSDC, directRoute]
    }) as bigint[];

    if (out && out.length > 1 && out[1] > BigInt(0)) {
      bestRoute = directRoute;
      const tokensPerUSDC = parseFloat(formatUnits(out[1], decimals));
      if (tokensPerUSDC > 0 && !priceUSD) {
        priceUSD = Number((1 / tokensPerUSDC).toFixed(6));
      }
    }
  } catch {}

  // If no direct route, try multi-hop route: USDC -> WETH -> Token
  if (!bestRoute) {
    const multiHopRoute: AerodromeRoute[] = [
      {
        from: BASE_USDC.contractAddress,
        to: BASE_WETH_ADDRESS,
        stable: false,
        factory: AERODROME_FACTORY_ADDRESS
      },
      {
        from: BASE_WETH_ADDRESS,
        to: targetAddress,
        stable: false,
        factory: AERODROME_FACTORY_ADDRESS
      }
    ];

    try {
      const out = await publicClient.readContract({
        address: AERODROME_ROUTER_ADDRESS,
        abi: AERODROME_ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [testUSDC, multiHopRoute]
      }) as bigint[];

      if (out && out.length > 2 && out[2] > BigInt(0)) {
        bestRoute = multiHopRoute;
        const tokensPerUSDC = parseFloat(formatUnits(out[2], decimals));
        if (tokensPerUSDC > 0 && !priceUSD) {
          priceUSD = Number((1 / tokensPerUSDC).toFixed(6));
        }
      }
    } catch {}
  }

  return {
    address: targetAddress,
    name,
    symbol,
    decimals,
    hasLiquidity: Boolean(bestRoute),
    route: bestRoute,
    priceUSD
  };
}

/**
 * Ensures ERC-20 allowance for Aerodrome Router, sending approve() if required
 */
export async function ensureTokenAllowance(
  walletClient: any,
  publicClient: any,
  tokenAddress: `0x${string}`,
  spender: `0x${string}`,
  requiredAmount: bigint
): Promise<void> {
  const account = walletClient.account;
  if (!account) throw new Error('No account found on walletClient');

  const currentAllowance = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account.address, spender]
  }) as bigint;

  if (currentAllowance < requiredAmount) {
    console.log(`Approving ${spender} on ${tokenAddress}...`);
    const approveTx = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, maxUint256]
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
    console.log(`Approval confirmed: ${approveTx}`);
  }
}

/**
 * Execute 100% Real On-Chain Buy on Aerodrome Router (USDC -> Token)
 */
export async function executeBuyTokenOnAerodrome(
  walletClient: any,
  publicClient: any,
  params: {
    targetTokenOrSymbol: string;
    amountUSD: number;
    slippagePercent?: number;
  }
): Promise<SwapExecutionResult> {
  const account = walletClient.account;
  if (!account) throw new Error('No wallet client account available');

  const { targetTokenOrSymbol, amountUSD } = params;
  const slippage = params.slippagePercent || 1.5; // 1.5% slippage default

  let targetAddress: `0x${string}`;
  let decimals = 18;
  let symbol = targetTokenOrSymbol.toUpperCase().replace(/^[$]/, '');
  let routes: AerodromeRoute[];

  // Check if ticker is in verified registry
  const verified = VERIFIED_BASE_TOKENIZED_STOCKS[symbol];
  if (verified) {
    targetAddress = verified.contractAddress;
    decimals = verified.decimals;
    routes = AERODROME_SWAP_ROUTES[symbol] || [
      {
        from: BASE_USDC.contractAddress,
        to: targetAddress,
        stable: false,
        factory: AERODROME_FACTORY_ADDRESS
      }
    ];
  } else if (targetTokenOrSymbol.startsWith('0x') && targetTokenOrSymbol.length === 42) {
    // Custom Contract Address Discovery
    const discovery = await discoverTokenMetadata(publicClient, targetTokenOrSymbol as `0x${string}`);
    if (!discovery.hasLiquidity || !discovery.route) {
      throw new Error(`Token ${discovery.symbol} (${discovery.address}) does not have an active liquidity pool on Aerodrome.`);
    }
    targetAddress = discovery.address;
    decimals = discovery.decimals;
    symbol = discovery.symbol;
    routes = discovery.route;
  } else {
    throw new Error(`Token ${targetTokenOrSymbol} is neither a recognized symbol nor a valid Base contract address.`);
  }

  const amountInUSDC = parseUnits(amountUSD.toFixed(6), BASE_USDC.decimals);

  // 1. Ensure USDC Allowance for Aerodrome Router
  await ensureTokenAllowance(
    walletClient,
    publicClient,
    BASE_USDC.contractAddress,
    AERODROME_ROUTER_ADDRESS,
    amountInUSDC
  );

  // 2. Query live on-chain quote from Aerodrome
  const amountsOut = await publicClient.readContract({
    address: AERODROME_ROUTER_ADDRESS,
    abi: AERODROME_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [amountInUSDC, routes]
  }) as bigint[];

  const expectedOutRaw = amountsOut[amountsOut.length - 1];
  // Calculate minimum out with slippage tolerance
  const minOutRaw = (expectedOutRaw * BigInt(Math.floor((100 - slippage) * 100))) / BigInt(10000);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes deadline

  // 3. Execute real DEX swap on Base Mainnet
  console.log(`Executing real Aerodrome DEX swap: ${amountUSD} USDC -> ${symbol}...`);
  const txHash = await walletClient.writeContract({
    address: AERODROME_ROUTER_ADDRESS,
    abi: AERODROME_ROUTER_ABI,
    functionName: 'swapExactTokensForTokens',
    args: [amountInUSDC, minOutRaw, routes, account.address, deadline]
  });

  console.log(`DEX Swap broadcasted to Base Mainnet! TX: ${txHash}. Waiting for block confirmation...`);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`DEX Swap confirmed on-chain: https://basescan.org/tx/${txHash}`);

  const receivedTokens = parseFloat(formatUnits(expectedOutRaw, decimals));

  return {
    txHash,
    explorerUrl: `https://basescan.org/tx/${txHash}`,
    amountIn: amountUSD,
    amountOut: receivedTokens,
    symbol,
    tokenAddress: targetAddress,
    timestamp: Date.now()
  };
}

/**
 * Execute 100% Real On-Chain Sell on Aerodrome Router (Token -> USDC)
 */
export async function executeSellTokenOnAerodrome(
  walletClient: any,
  publicClient: any,
  params: {
    tokenAddress: `0x${string}`;
    tokenSymbol: string;
    tokenDecimals: number;
    tokenAmountToSell: number;
    slippagePercent?: number;
  }
): Promise<SwapExecutionResult> {
  const account = walletClient.account;
  if (!account) throw new Error('No wallet client account available');

  const { tokenAddress, tokenSymbol, tokenDecimals, tokenAmountToSell } = params;
  const slippage = params.slippagePercent || 1.5;

  // Build reverse route (Token -> [WETH] -> USDC)
  let routes: AerodromeRoute[];
  if (AERODROME_SWAP_ROUTES[tokenSymbol]) {
    // Reverse configured route
    const forwardRoutes = AERODROME_SWAP_ROUTES[tokenSymbol];
    routes = [...forwardRoutes].reverse().map(r => ({
      from: r.to,
      to: r.from,
      stable: r.stable,
      factory: r.factory
    }));
  } else {
    // Check direct or WETH route for custom token
    const testAmount = parseUnits('1', tokenDecimals);
    let directValid = false;
    try {
      const out = await publicClient.readContract({
        address: AERODROME_ROUTER_ADDRESS,
        abi: AERODROME_ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [testAmount, [{ from: tokenAddress, to: BASE_USDC.contractAddress, stable: false, factory: AERODROME_FACTORY_ADDRESS }]]
      }) as bigint[];
      if (out && out.length > 1) directValid = true;
    } catch {}

    if (directValid) {
      routes = [{ from: tokenAddress, to: BASE_USDC.contractAddress, stable: false, factory: AERODROME_FACTORY_ADDRESS }];
    } else {
      routes = [
        { from: tokenAddress, to: BASE_WETH_ADDRESS, stable: false, factory: AERODROME_FACTORY_ADDRESS },
        { from: BASE_WETH_ADDRESS, to: BASE_USDC.contractAddress, stable: false, factory: AERODROME_FACTORY_ADDRESS }
      ];
    }
  }

  const rawTokenAmount = parseUnits(tokenAmountToSell.toFixed(Math.min(tokenDecimals, 8)), tokenDecimals);

  // 1. Ensure token allowance for Aerodrome Router
  await ensureTokenAllowance(
    walletClient,
    publicClient,
    tokenAddress,
    AERODROME_ROUTER_ADDRESS,
    rawTokenAmount
  );

  // 2. Query quote
  const amountsOut = await publicClient.readContract({
    address: AERODROME_ROUTER_ADDRESS,
    abi: AERODROME_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [rawTokenAmount, routes]
  }) as bigint[];

  const expectedUSDC = amountsOut[amountsOut.length - 1];
  const minUSDC = (expectedUSDC * BigInt(Math.floor((100 - slippage) * 100))) / BigInt(10000);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

  // 3. Execute sell swap on Base Mainnet
  console.log(`Executing real Aerodrome sell swap: ${tokenAmountToSell} ${tokenSymbol} -> USDC...`);
  const txHash = await walletClient.writeContract({
    address: AERODROME_ROUTER_ADDRESS,
    abi: AERODROME_ROUTER_ABI,
    functionName: 'swapExactTokensForTokens',
    args: [rawTokenAmount, minUSDC, routes, account.address, deadline]
  });

  console.log(`Sell swap broadcasted! TX: ${txHash}. Waiting for block confirmation...`);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  const usdcReceived = parseFloat(formatUnits(expectedUSDC, BASE_USDC.decimals));

  return {
    txHash,
    explorerUrl: `https://basescan.org/tx/${txHash}`,
    amountIn: tokenAmountToSell,
    amountOut: usdcReceived,
    symbol: tokenSymbol,
    tokenAddress,
    timestamp: Date.now()
  };
}
