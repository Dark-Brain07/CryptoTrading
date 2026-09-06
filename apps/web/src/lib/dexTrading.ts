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

/**
 * Inspects any ERC-20 contract address on Base Mainnet and verifies DEX liquidity on Aerodrome
 */
export async function discoverTokenMetadata(
  publicClient: any,
  tokenAddress: `0x${string}`
): Promise<TokenDiscoveryResult> {
  const code = await publicClient.getBytecode({ address: tokenAddress });
  if (!code || code === '0x') {
    throw new Error(`Address ${tokenAddress} is not a deployed contract on Base Mainnet.`);
  }

  // 1. Read standard ERC20 properties
  let symbol = 'UNKNOWN';
  let name = 'Custom Token';
  let decimals = 18;

  try {
    const sym = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'symbol'
    });
    symbol = String(sym);
  } catch {}

  try {
    const nm = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'name'
    });
    name = String(nm);
  } catch {}

  try {
    const dec = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals'
    });
    decimals = Number(dec);
  } catch {}

  // 2. Discover best Aerodrome liquidity route (1 USDC test query)
  const testUSDC = BigInt(1000000); // 1.00 USDC
  let bestRoute: AerodromeRoute[] | undefined;
  let priceUSD: number | undefined;

  // Try direct route: USDC -> Token
  const directRoute: AerodromeRoute[] = [
    {
      from: BASE_USDC.contractAddress,
      to: tokenAddress,
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
      if (tokensPerUSDC > 0) {
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
        to: tokenAddress,
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
        if (tokensPerUSDC > 0) {
          priceUSD = Number((1 / tokensPerUSDC).toFixed(6));
        }
      }
    } catch {}
  }

  return {
    address: tokenAddress,
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
