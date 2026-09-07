import { StockToken } from './types';

export const BASE_CHAIN_ID = 8453;
export const BASE_RPC_URL = 'https://mainnet.base.org';
export const BASE_EXPLORER_URL = 'https://basescan.org';

// Official Base Mainnet Native USDC
export const BASE_USDC: StockToken = {
  ticker: 'USDC',
  name: 'USD Coin',
  contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  decimals: 6,
  issuer: 'Circle',
  category: 'Finance',
  underlyingSymbol: 'USD',
  referencePriceUSD: 1.0,
  iconUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
};

// Official Base Mainnet Wrapped Ether
export const BASE_WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as const;

// Verified Base Mainnet Real Liquid Tokens
export const VERIFIED_BASE_TOKENIZED_STOCKS: Record<string, StockToken> = {
  AERO: {
    ticker: 'AERO',
    name: 'Aerodrome Finance',
    contractAddress: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    decimals: 18,
    issuer: 'Aerodrome DEX',
    category: 'DeFi',
    underlyingSymbol: 'AERO',
    referencePriceUSD: 0.54,
    iconUrl: 'https://aerodrome.finance/favicon.ico'
  },
  WETH: {
    ticker: 'WETH',
    name: 'Wrapped Ether',
    contractAddress: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    issuer: 'Base / Ethereum',
    category: 'Blue Chip',
    underlyingSymbol: 'ETH',
    referencePriceUSD: 2524.00,
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  cbBTC: {
    ticker: 'cbBTC',
    name: 'Coinbase Wrapped Bitcoin',
    contractAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    decimals: 8,
    issuer: 'Coinbase',
    category: 'Blue Chip',
    underlyingSymbol: 'BTC',
    referencePriceUSD: 80320.00,
    iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
  },
  VIRTUAL: {
    ticker: 'VIRTUAL',
    name: 'Virtuals Protocol (AI Agents)',
    contractAddress: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b',
    decimals: 18,
    issuer: 'Virtuals Protocol',
    category: 'AI',
    underlyingSymbol: 'VIRTUAL',
    referencePriceUSD: 0.68,
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b/logo.png'
  },
  DEGEN: {
    ticker: 'DEGEN',
    name: 'Degen Community Token',
    contractAddress: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
    decimals: 18,
    issuer: 'Degen Channel',
    category: 'Social',
    underlyingSymbol: 'DEGEN',
    referencePriceUSD: 0.0011,
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed/logo.png'
  },
  // Legacy aliases for backwards compatibility
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corp Proxy / AERO Pool',
    contractAddress: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    decimals: 18,
    issuer: 'Base Mainnet Liquid Asset',
    category: 'DeFi',
    underlyingSymbol: 'AERO',
    referencePriceUSD: 0.54,
    iconUrl: 'https://aerodrome.finance/favicon.ico'
  },
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla Proxy / WETH Pool',
    contractAddress: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    issuer: 'Base Mainnet Liquid Asset',
    category: 'Blue Chip',
    underlyingSymbol: 'ETH',
    referencePriceUSD: 2524.00,
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  SPY: {
    ticker: 'SPY',
    name: 'SPDR Index Proxy / cbBTC Pool',
    contractAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    decimals: 8,
    issuer: 'Coinbase Blue Chip',
    category: 'Blue Chip',
    underlyingSymbol: 'BTC',
    referencePriceUSD: 80320.00,
    iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
  }
};

// Verified Base Mainnet Aerodrome Contracts
export const AERODROME_ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43' as const;
export const AERODROME_FACTORY_ADDRESS = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da' as const;
export const UNISWAP_V3_ROUTER_ADDRESS = '0x2626664c2603336E57B271c5C0b26F421741e481' as const;

export interface AerodromeRoute {
  from: `0x${string}`;
  to: `0x${string}`;
  stable: boolean;
  factory: `0x${string}`;
}

// Pre-configured optimal Aerodrome routes from USDC to tokens
export const AERODROME_SWAP_ROUTES: Record<string, AerodromeRoute[]> = {
  AERO: [
    {
      from: BASE_USDC.contractAddress,
      to: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ],
  WETH: [
    {
      from: BASE_USDC.contractAddress,
      to: BASE_WETH_ADDRESS,
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ],
  ETH: [
    {
      from: BASE_USDC.contractAddress,
      to: BASE_WETH_ADDRESS,
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ],
  cbBTC: [
    {
      from: BASE_USDC.contractAddress,
      to: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ],
  VIRTUAL: [
    {
      from: BASE_USDC.contractAddress,
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
      from: BASE_USDC.contractAddress,
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
  ]
};

// Aerodrome Router ABI
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

// Standard ERC20 ABI
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: 'remaining', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function'
  }
] as const;
