import {
  createPublicClient,
  createWalletClient,
  http,
  fallback,
  parseUnits,
  formatUnits,
  maxUint256,
  PublicClient
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { config } from '../config';
import {
  BASE_USDC,
  BASE_WETH_ADDRESS,
  AERODROME_ROUTER_ADDRESS,
  AERODROME_FACTORY_ADDRESS,
  AERODROME_SWAP_ROUTES,
  AERODROME_ROUTER_ABI,
  ERC20_ABI,
  VERIFIED_BASE_TOKENIZED_STOCKS,
  AerodromeRoute
} from '../shared';
import { publicClient, getOnChainTokenBalance, baseTransport } from './blockchain';
import { portfolioStore } from './portfolioStore';

export interface ServerSwapResult {
  success: boolean;
  txHash: `0x${string}`;
  explorerUrl: string;
  amountInUSD: number;
  amountOutTokens: number;
  symbol: string;
  tokenAddress: `0x${string}`;
  gasUsedUSD: number;
  timestamp: number;
}

export const KNOWN_BASE_TOKENS_BY_SYMBOL: Record<string, `0x${string}`> = {
  AERO: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
  WETH: BASE_WETH_ADDRESS,
  ETH: BASE_WETH_ADDRESS,
  CBBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  VIRTUAL: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b',
  DEGEN: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
  USDC: BASE_USDC.contractAddress as `0x${string}`,

  // Base Tokenized Equities (Stocks)
  NVDA: '0xb20000000000000000000078ee7ce2fE4908108C',
  NVDAC: '0xb20000000000000000000078ee7ce2fE4908108C',
  META: '0xb2000000000000000000008bC8786B856E61707C',
  METAC: '0xb2000000000000000000008bC8786B856E61707C',
  AAPL: '0xb200000000000000000000C2e324d24d7eEcd1fb',
  AAPLC: '0xb200000000000000000000C2e324d24d7eEcd1fb',
  GOOGL: '0xb2000000000000000000002D0BA3164cc74f58B7',
  GOOGLC: '0xb2000000000000000000002D0BA3164cc74f58B7',
  AMZN: '0xb200000000000000000000d9192b6B456483C2E8',
  AMZNC: '0xb200000000000000000000d9192b6B456483C2E8',
  MSFT: '0xB200000000000000000000Ab99cFa739E253872B',
  MSFTC: '0xB200000000000000000000Ab99cFa739E253872B',
  MSTR: '0xb2000000000000000000004884b426556b92883d',
  MSTRC: '0xb2000000000000000000004884b426556b92883d',
  SNDK: '0xb200000000000000000000397293Cb8cda9a10c5',
  SNDKC: '0xb200000000000000000000397293Cb8cda9a10c5',
  SPCX: '0xb2000000000000000000007b9fcbd005511aCBd5',
  SPCXC: '0xb2000000000000000000007b9fcbd005511aCBd5',
  TSLA: '0xb2000000000000000000001e800a7f5189430cD0',
  TSLAC: '0xb2000000000000000000001e800a7f5189430cD0'
};

export async function ensureTokenAllowanceServer(
  walletClient: any,
  tokenAddress: `0x${string}`,
  spenderAddress: `0x${string}`,
  requiredAmount: bigint
): Promise<void> {
  const account = walletClient.account;
  const currentAllowance = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account.address, spenderAddress]
  }) as bigint;

  if (currentAllowance < requiredAmount) {
    console.log(`Approving ${spenderAddress} to spend tokens on behalf of ${account.address}...`);
    const approveTx = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, maxUint256],
      gas: 65000n
    });
    console.log(`Approval tx broadcasted: ${approveTx}. Waiting for confirmation...`);
    await publicClient.waitForTransactionReceipt({ hash: approveTx, timeout: 45_000 });
    console.log(`Approval confirmed on Base Mainnet.`);
  }
}

export async function discoverTokenMetadataServer(
  target: string
): Promise<{
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  route?: AerodromeRoute[];
  hasLiquidity: boolean;
}> {
  const upper = target.toUpperCase().replace(/^[$]/, '');
  let resolvedAddress: `0x${string}` | null = null;

  if (KNOWN_BASE_TOKENS_BY_SYMBOL[upper]) {
    resolvedAddress = KNOWN_BASE_TOKENS_BY_SYMBOL[upper];
  } else if ((VERIFIED_BASE_TOKENIZED_STOCKS as any)[target] || (VERIFIED_BASE_TOKENIZED_STOCKS as any)[upper]) {
    const stock = (VERIFIED_BASE_TOKENIZED_STOCKS as any)[target] || (VERIFIED_BASE_TOKENIZED_STOCKS as any)[upper];
    resolvedAddress = stock.contractAddress as `0x${string}`;
  } else if (target.startsWith('0x') && target.length === 42) {
    resolvedAddress = target as `0x${string}`;
  }

  if (!resolvedAddress) {
    throw new Error(`Token ${target} is not recognized and is not a valid Base 0x address.`);
  }

  let symbol = upper;
  let decimals = 18;

  try {
    const [sym, dec] = await Promise.all([
      publicClient.readContract({
        address: resolvedAddress,
        abi: ERC20_ABI,
        functionName: 'symbol'
      }) as Promise<string>,
      publicClient.readContract({
        address: resolvedAddress,
        abi: ERC20_ABI,
        functionName: 'decimals'
      }) as Promise<number>
    ]);
    symbol = sym;
    decimals = Number(dec);
  } catch (e) {
    // Keep defaults if reading fails
  }

  const cleanSym = symbol.toUpperCase();
  const preconfiguredRoute = 
    AERODROME_SWAP_ROUTES[cleanSym] || 
    AERODROME_SWAP_ROUTES[symbol] || 
    Object.entries(AERODROME_SWAP_ROUTES).find(([k]) => k.toUpperCase() === cleanSym)?.[1];

  if (preconfiguredRoute) {
    try {
      const testAmount = parseUnits('0.01', BASE_USDC.decimals);
      const out = await publicClient.readContract({
        address: AERODROME_ROUTER_ADDRESS,
        abi: AERODROME_ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [testAmount, preconfiguredRoute]
      }) as bigint[];

      if (out && out.length > 0 && out[out.length - 1] > 0n) {
        return {
          address: resolvedAddress,
          symbol: cleanSym,
          decimals,
          route: preconfiguredRoute,
          hasLiquidity: true
        };
      }
    } catch (e) {
      // Preconfigured route didn't have liquidity, fall through to discovery
    }
  }

  // Attempt direct USDC -> Token route
  const directRoute: AerodromeRoute[] = [
    {
      from: BASE_USDC.contractAddress as `0x${string}`,
      to: resolvedAddress,
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ];

  try {
    const testAmount = parseUnits('0.1', BASE_USDC.decimals);
    const out = await publicClient.readContract({
      address: AERODROME_ROUTER_ADDRESS,
      abi: AERODROME_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [testAmount, directRoute]
    }) as bigint[];

    if (out && out.length > 0 && out[out.length - 1] > 0n) {
      return {
        address: resolvedAddress,
        symbol: cleanSym,
        decimals,
        route: directRoute,
        hasLiquidity: true
      };
    }
  } catch (e) {
    // Try via WETH
  }

  const wethRoute: AerodromeRoute[] = [
    {
      from: BASE_USDC.contractAddress as `0x${string}`,
      to: BASE_WETH_ADDRESS,
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    },
    {
      from: BASE_WETH_ADDRESS,
      to: resolvedAddress,
      stable: false,
      factory: AERODROME_FACTORY_ADDRESS
    }
  ];

  try {
    const testAmount = parseUnits('0.1', BASE_USDC.decimals);
    const out = await publicClient.readContract({
      address: AERODROME_ROUTER_ADDRESS,
      abi: AERODROME_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [testAmount, wethRoute]
    }) as bigint[];

    if (out && out.length > 0 && out[out.length - 1] > 0n) {
      return {
        address: resolvedAddress,
        symbol: cleanSym,
        decimals,
        route: wethRoute,
        hasLiquidity: true
      };
    }
  } catch (e) {
    // No liquidity via WETH
  }

  return {
    address: resolvedAddress,
    symbol: cleanSym,
    decimals,
    hasLiquidity: false
  };
}

export async function executeServerBuyOnAerodrome(params: {
  privateKey: `0x${string}`;
  targetTokenOrSymbol: string;
  amountUSD: number;
  userId?: string;
  slippagePercent?: number;
}): Promise<ServerSwapResult> {
  const { privateKey, targetTokenOrSymbol, amountUSD, userId } = params;
  const slippage = params.slippagePercent || 2.0;

  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: baseTransport
  });

  // 1. Balance Checks
  const [ethBalanceRaw, usdcBalance] = await Promise.all([
    publicClient.getBalance({ address: account.address }),
    getOnChainTokenBalance(BASE_USDC.contractAddress as `0x${string}`, account.address, BASE_USDC.decimals)
  ]);

  if (usdcBalance < amountUSD) {
    throw new Error(
      `Insufficient USDC balance on Base Mainnet. You have $${usdcBalance.toFixed(2)} USDC, but this trade requires $${amountUSD.toFixed(2)} USDC.`
    );
  }

  const ethBalance = parseFloat(formatUnits(ethBalanceRaw, 18));
  if (ethBalance < 0.00003) {
    throw new Error(
      `Insufficient ETH for gas on Base Mainnet. You have ${ethBalance.toFixed(5)} ETH. Base requires at least ~0.0001 ETH (~$0.001) to pay transaction gas.`
    );
  }

  // 2. Discover token metadata and route
  const discovery = await discoverTokenMetadataServer(targetTokenOrSymbol);
  if (!discovery.hasLiquidity || !discovery.route) {
    throw new Error(`Token ${discovery.symbol} (${discovery.address}) does not have an active liquidity pool on Aerodrome.`);
  }

  const amountInUSDC = parseUnits(amountUSD.toFixed(6), BASE_USDC.decimals);

  // 3. Ensure USDC Allowance
  await ensureTokenAllowanceServer(
    walletClient,
    BASE_USDC.contractAddress as `0x${string}`,
    AERODROME_ROUTER_ADDRESS,
    amountInUSDC
  );

  // 4. Query live quote
  const amountsOut = await publicClient.readContract({
    address: AERODROME_ROUTER_ADDRESS,
    abi: AERODROME_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [amountInUSDC, discovery.route]
  }) as bigint[];

  const expectedOutRaw = amountsOut[amountsOut.length - 1];
  if (!expectedOutRaw || expectedOutRaw <= 0n) {
    throw new Error(`Insufficient liquidity for ${discovery.symbol} on Aerodrome router. Swap returned 0 tokens for this trade amount.`);
  }
  const minOutRaw = (expectedOutRaw * BigInt(Math.floor((100 - slippage) * 100))) / BigInt(10000);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 mins

  // 5. Broadcast real transaction to Base Mainnet
  console.log(`[Telegram DEX Trade] Broadcasting ${amountUSD} USDC -> ${discovery.symbol} for ${account.address}...`);

  let gasEstimate = 350000n;
  try {
    const est = await publicClient.estimateContractGas({
      account: account.address,
      address: AERODROME_ROUTER_ADDRESS,
      abi: AERODROME_ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [amountInUSDC, minOutRaw, discovery.route, account.address, deadline]
    });
    gasEstimate = (est * 125n) / 100n; // 25% safety buffer
  } catch (gasErr) {
    console.warn(`[Telegram DEX Trade] Gas estimation fallback used (${gasEstimate}):`, gasErr);
  }

  const txHash = await walletClient.writeContract({
    address: AERODROME_ROUTER_ADDRESS,
    abi: AERODROME_ROUTER_ABI,
    functionName: 'swapExactTokensForTokens',
    args: [amountInUSDC, minOutRaw, discovery.route, account.address, deadline],
    gas: gasEstimate
  });

  console.log(`[Telegram DEX Trade] Broadcasted! TX: ${txHash}. Awaiting confirmation...`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });

  if (receipt.status !== 'success') {
    throw new Error(`Transaction reverted on Base Mainnet: https://basescan.org/tx/${txHash}`);
  }

  const receivedTokens = parseFloat(formatUnits(expectedOutRaw, discovery.decimals));
  const gasUsedUSD = Number((parseFloat(formatUnits(receipt.gasUsed * (receipt.effectiveGasPrice || 1000000n), 18)) * 2500).toFixed(4));

  if (userId) {
    portfolioStore.recordTrade(userId, discovery.symbol, receivedTokens, amountUSD, txHash);
  }

  return {
    success: true,
    txHash,
    explorerUrl: `https://basescan.org/tx/${txHash}`,
    amountInUSD: amountUSD,
    amountOutTokens: receivedTokens,
    symbol: discovery.symbol,
    tokenAddress: discovery.address,
    gasUsedUSD: gasUsedUSD || 0.001,
    timestamp: Date.now()
  };
}

export async function executeServerSellOrSwapOnAerodrome(params: {
  privateKey: `0x${string}`;
  fromTokenOrSymbol: string;
  toTokenOrSymbol?: string;
  amountToSell?: number;
  isAll?: boolean;
  userId?: string;
  slippagePercent?: number;
}): Promise<{
  success: boolean;
  txHash: `0x${string}`;
  explorerUrl: string;
  amountSold: number;
  fromSymbol: string;
  amountReceived: number;
  toSymbol: string;
  gasUsedUSD: number;
  timestamp: number;
}> {
  const { privateKey, fromTokenOrSymbol, userId } = params;
  const slippage = params.slippagePercent || 2.5;
  const toToken = (params.toTokenOrSymbol || 'ETH').toUpperCase().replace(/^[$]/, '');

  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: baseTransport
  });

  // 1. Discover source token
  const fromMeta = await discoverTokenMetadataServer(fromTokenOrSymbol);
  
  // 2. Query live on-chain balance of source token
  const liveTokenBalance = await getOnChainTokenBalance(
    fromMeta.address,
    account.address,
    fromMeta.decimals
  );

  if (liveTokenBalance <= 0) {
    throw new Error(
      `You do not have any ${fromMeta.symbol} tokens in your wallet (${account.address}) on Base Mainnet.`
    );
  }

  let sellAmount = params.amountToSell && !params.isAll
    ? Math.min(params.amountToSell, liveTokenBalance)
    : liveTokenBalance;

  if (sellAmount <= 0) {
    sellAmount = liveTokenBalance;
  }

  // Check ETH for gas
  const ethBalanceRaw = await publicClient.getBalance({ address: account.address });
  const ethBalance = parseFloat(formatUnits(ethBalanceRaw, 18));
  if (ethBalance < 0.00003) {
    throw new Error(
      `Insufficient ETH for gas on Base Mainnet (${ethBalance.toFixed(5)} ETH). Need at least ~0.0001 ETH.`
    );
  }

  const rawSellAmount = parseUnits(
    sellAmount.toFixed(Math.min(fromMeta.decimals, 6)),
    fromMeta.decimals
  );

  // 3. Ensure allowance for Aerodrome Router
  await ensureTokenAllowanceServer(
    walletClient,
    fromMeta.address,
    AERODROME_ROUTER_ADDRESS,
    rawSellAmount
  );

  // 4. Build Route
  const isTargetETH = toToken === 'ETH' || toToken === 'WETH';
  let routes: AerodromeRoute[];
  let destSymbol = isTargetETH ? 'ETH' : 'USDC';

  if (isTargetETH) {
    routes = [
      {
        from: fromMeta.address,
        to: BASE_WETH_ADDRESS,
        stable: false,
        factory: AERODROME_FACTORY_ADDRESS
      }
    ];
  } else {
    // Invert the token's buy route back to USDC, or use direct
    if (fromMeta.route && fromMeta.route.length > 0) {
      routes = [...fromMeta.route].reverse().map(r => ({
        from: r.to,
        to: r.from,
        stable: r.stable,
        factory: r.factory
      }));
    } else {
      routes = [
        {
          from: fromMeta.address,
          to: BASE_USDC.contractAddress as `0x${string}`,
          stable: false,
          factory: AERODROME_FACTORY_ADDRESS
        }
      ];
    }
  }

  // 5. Query quote
  const amountsOut = await publicClient.readContract({
    address: AERODROME_ROUTER_ADDRESS,
    abi: AERODROME_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [rawSellAmount, routes]
  }) as bigint[];

  const expectedOutRaw = amountsOut[amountsOut.length - 1];
  if (!expectedOutRaw || expectedOutRaw <= 0n) {
    throw new Error(`Insufficient liquidity to swap ${fromMeta.symbol} on Aerodrome router. Swap returned 0 tokens.`);
  }
  const minOutRaw = (expectedOutRaw * BigInt(Math.floor((100 - slippage) * 100))) / BigInt(10000);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

  let txHash: `0x${string}`;

  let gasEstimate = 350000n;

  if (isTargetETH && toToken === 'ETH') {
    try {
      const est = await publicClient.estimateContractGas({
        account: account.address,
        address: AERODROME_ROUTER_ADDRESS,
        abi: AERODROME_ROUTER_ABI,
        functionName: 'swapExactTokensForETH',
        args: [rawSellAmount, minOutRaw, routes, account.address, deadline]
      });
      gasEstimate = (est * 125n) / 100n;
    } catch (e) {}

    console.log(`[Telegram DEX Sell] Swapping ${sellAmount} ${fromMeta.symbol} -> native ETH for ${account.address}...`);
    txHash = await walletClient.writeContract({
      address: AERODROME_ROUTER_ADDRESS,
      abi: AERODROME_ROUTER_ABI,
      functionName: 'swapExactTokensForETH',
      args: [rawSellAmount, minOutRaw, routes, account.address, deadline],
      gas: gasEstimate
    });
  } else {
    try {
      const est = await publicClient.estimateContractGas({
        account: account.address,
        address: AERODROME_ROUTER_ADDRESS,
        abi: AERODROME_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [rawSellAmount, minOutRaw, routes, account.address, deadline]
      });
      gasEstimate = (est * 125n) / 100n;
    } catch (e) {}

    console.log(`[Telegram DEX Sell] Swapping ${sellAmount} ${fromMeta.symbol} -> ${destSymbol} for ${account.address}...`);
    txHash = await walletClient.writeContract({
      address: AERODROME_ROUTER_ADDRESS,
      abi: AERODROME_ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [rawSellAmount, minOutRaw, routes, account.address, deadline],
      gas: gasEstimate
    });
  }

  console.log(`[Telegram DEX Sell] Broadcasted! TX: ${txHash}. Awaiting confirmation...`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });

  if (receipt.status !== 'success') {
    throw new Error(`Transaction reverted on Base Mainnet: https://basescan.org/tx/${txHash}`);
  }

  const outDecimals = isTargetETH ? 18 : 6;
  const receivedAmount = parseFloat(formatUnits(expectedOutRaw, outDecimals));
  const gasUsedUSD = Number((parseFloat(formatUnits(receipt.gasUsed * (receipt.effectiveGasPrice || 1000000n), 18)) * 2500).toFixed(4));

  if (userId) {
    portfolioStore.recordSell(userId, fromMeta.symbol, isTargetETH ? receivedAmount * 2500 : receivedAmount, sellAmount);
  }

  return {
    success: true,
    txHash,
    explorerUrl: `https://basescan.org/tx/${txHash}`,
    amountSold: sellAmount,
    fromSymbol: fromMeta.symbol,
    amountReceived: receivedAmount,
    toSymbol: destSymbol,
    gasUsedUSD: gasUsedUSD || 0.001,
    timestamp: Date.now()
  };
}

