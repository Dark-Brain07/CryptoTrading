"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureTokenAllowanceServer = ensureTokenAllowanceServer;
exports.discoverTokenMetadataServer = discoverTokenMetadataServer;
exports.executeServerBuyOnAerodrome = executeServerBuyOnAerodrome;
exports.executeServerSellOrSwapOnAerodrome = executeServerSellOrSwapOnAerodrome;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const shared_1 = require("../shared");
const blockchain_1 = require("./blockchain");
const portfolioStore_1 = require("./portfolioStore");
const KNOWN_BASE_TOKENS_BY_SYMBOL = {
    AERO: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    WETH: shared_1.BASE_WETH_ADDRESS,
    CBBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    VIRTUAL: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b',
    DEGEN: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
    USDC: shared_1.BASE_USDC.contractAddress
};
async function ensureTokenAllowanceServer(walletClient, tokenAddress, spenderAddress, requiredAmount) {
    const account = walletClient.account;
    const currentAllowance = await blockchain_1.publicClient.readContract({
        address: tokenAddress,
        abi: shared_1.ERC20_ABI,
        functionName: 'allowance',
        args: [account.address, spenderAddress]
    });
    if (currentAllowance < requiredAmount) {
        console.log(`Approving ${spenderAddress} to spend tokens on behalf of ${account.address}...`);
        const approveTx = await walletClient.writeContract({
            address: tokenAddress,
            abi: shared_1.ERC20_ABI,
            functionName: 'approve',
            args: [spenderAddress, viem_1.maxUint256]
        });
        console.log(`Approval tx broadcasted: ${approveTx}. Waiting for confirmation...`);
        await blockchain_1.publicClient.waitForTransactionReceipt({ hash: approveTx });
        console.log(`Approval confirmed on Base Mainnet.`);
    }
}
async function discoverTokenMetadataServer(target) {
    const upper = target.toUpperCase().replace(/^[$]/, '');
    let resolvedAddress = null;
    if (KNOWN_BASE_TOKENS_BY_SYMBOL[upper]) {
        resolvedAddress = KNOWN_BASE_TOKENS_BY_SYMBOL[upper];
    }
    else if (target.startsWith('0x') && target.length === 42) {
        resolvedAddress = target;
    }
    if (!resolvedAddress) {
        throw new Error(`Token ${target} is not recognized and is not a valid Base 0x address.`);
    }
    let symbol = upper;
    let decimals = 18;
    try {
        const [sym, dec] = await Promise.all([
            blockchain_1.publicClient.readContract({
                address: resolvedAddress,
                abi: shared_1.ERC20_ABI,
                functionName: 'symbol'
            }),
            blockchain_1.publicClient.readContract({
                address: resolvedAddress,
                abi: shared_1.ERC20_ABI,
                functionName: 'decimals'
            })
        ]);
        symbol = sym;
        decimals = Number(dec);
    }
    catch (e) {
        // Keep defaults if reading fails
    }
    const cleanSym = symbol.toUpperCase();
    if (shared_1.AERODROME_SWAP_ROUTES[cleanSym]) {
        return {
            address: resolvedAddress,
            symbol: cleanSym,
            decimals,
            route: shared_1.AERODROME_SWAP_ROUTES[cleanSym],
            hasLiquidity: true
        };
    }
    // Attempt direct USDC -> Token route
    const directRoute = [
        {
            from: shared_1.BASE_USDC.contractAddress,
            to: resolvedAddress,
            stable: false,
            factory: shared_1.AERODROME_FACTORY_ADDRESS
        }
    ];
    try {
        const testAmount = (0, viem_1.parseUnits)('0.1', shared_1.BASE_USDC.decimals);
        const out = await blockchain_1.publicClient.readContract({
            address: shared_1.AERODROME_ROUTER_ADDRESS,
            abi: shared_1.AERODROME_ROUTER_ABI,
            functionName: 'getAmountsOut',
            args: [testAmount, directRoute]
        });
        if (out && out.length > 0 && out[out.length - 1] > 0n) {
            return {
                address: resolvedAddress,
                symbol: cleanSym,
                decimals,
                route: directRoute,
                hasLiquidity: true
            };
        }
    }
    catch (e) {
        // Try via WETH
    }
    const wethRoute = [
        {
            from: shared_1.BASE_USDC.contractAddress,
            to: shared_1.BASE_WETH_ADDRESS,
            stable: false,
            factory: shared_1.AERODROME_FACTORY_ADDRESS
        },
        {
            from: shared_1.BASE_WETH_ADDRESS,
            to: resolvedAddress,
            stable: false,
            factory: shared_1.AERODROME_FACTORY_ADDRESS
        }
    ];
    try {
        const testAmount = (0, viem_1.parseUnits)('0.1', shared_1.BASE_USDC.decimals);
        const out = await blockchain_1.publicClient.readContract({
            address: shared_1.AERODROME_ROUTER_ADDRESS,
            abi: shared_1.AERODROME_ROUTER_ABI,
            functionName: 'getAmountsOut',
            args: [testAmount, wethRoute]
        });
        if (out && out.length > 0 && out[out.length - 1] > 0n) {
            return {
                address: resolvedAddress,
                symbol: cleanSym,
                decimals,
                route: wethRoute,
                hasLiquidity: true
            };
        }
    }
    catch (e) {
        // No liquidity via WETH
    }
    return {
        address: resolvedAddress,
        symbol: cleanSym,
        decimals,
        hasLiquidity: false
    };
}
async function executeServerBuyOnAerodrome(params) {
    const { privateKey, targetTokenOrSymbol, amountUSD, userId } = params;
    const slippage = params.slippagePercent || 2.0;
    const account = (0, accounts_1.privateKeyToAccount)(privateKey);
    const walletClient = (0, viem_1.createWalletClient)({
        account,
        chain: chains_1.base,
        transport: (0, viem_1.fallback)([
            (0, viem_1.http)('https://base.llamarpc.com'),
            (0, viem_1.http)('https://1rpc.io/base'),
            (0, viem_1.http)('https://mainnet.base.org')
        ])
    });
    // 1. Balance Checks
    const [ethBalanceRaw, usdcBalance] = await Promise.all([
        blockchain_1.publicClient.getBalance({ address: account.address }),
        (0, blockchain_1.getOnChainTokenBalance)(shared_1.BASE_USDC.contractAddress, account.address, shared_1.BASE_USDC.decimals)
    ]);
    if (usdcBalance < amountUSD) {
        throw new Error(`Insufficient USDC balance on Base Mainnet. You have $${usdcBalance.toFixed(2)} USDC, but this trade requires $${amountUSD.toFixed(2)} USDC.`);
    }
    const ethBalance = parseFloat((0, viem_1.formatUnits)(ethBalanceRaw, 18));
    if (ethBalance < 0.00003) {
        throw new Error(`Insufficient ETH for gas on Base Mainnet. You have ${ethBalance.toFixed(5)} ETH. Base requires at least ~0.0001 ETH (~$0.001) to pay transaction gas.`);
    }
    // 2. Discover token metadata and route
    const discovery = await discoverTokenMetadataServer(targetTokenOrSymbol);
    if (!discovery.hasLiquidity || !discovery.route) {
        throw new Error(`Token ${discovery.symbol} (${discovery.address}) does not have an active liquidity pool on Aerodrome.`);
    }
    const amountInUSDC = (0, viem_1.parseUnits)(amountUSD.toFixed(6), shared_1.BASE_USDC.decimals);
    // 3. Ensure USDC Allowance
    await ensureTokenAllowanceServer(walletClient, shared_1.BASE_USDC.contractAddress, shared_1.AERODROME_ROUTER_ADDRESS, amountInUSDC);
    // 4. Query live quote
    const amountsOut = await blockchain_1.publicClient.readContract({
        address: shared_1.AERODROME_ROUTER_ADDRESS,
        abi: shared_1.AERODROME_ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [amountInUSDC, discovery.route]
    });
    const expectedOutRaw = amountsOut[amountsOut.length - 1];
    const minOutRaw = (expectedOutRaw * BigInt(Math.floor((100 - slippage) * 100))) / BigInt(10000);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 mins
    // 5. Broadcast real transaction to Base Mainnet
    console.log(`[Telegram DEX Trade] Broadcasting ${amountUSD} USDC -> ${discovery.symbol} for ${account.address}...`);
    const txHash = await walletClient.writeContract({
        address: shared_1.AERODROME_ROUTER_ADDRESS,
        abi: shared_1.AERODROME_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [amountInUSDC, minOutRaw, discovery.route, account.address, deadline]
    });
    console.log(`[Telegram DEX Trade] Broadcasted! TX: ${txHash}. Awaiting confirmation...`);
    const receipt = await blockchain_1.publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== 'success') {
        throw new Error(`Transaction reverted on Base Mainnet: https://basescan.org/tx/${txHash}`);
    }
    const receivedTokens = parseFloat((0, viem_1.formatUnits)(expectedOutRaw, discovery.decimals));
    const gasUsedUSD = Number((parseFloat((0, viem_1.formatUnits)(receipt.gasUsed * (receipt.effectiveGasPrice || 1000000n), 18)) * 2500).toFixed(4));
    if (userId) {
        portfolioStore_1.portfolioStore.recordTrade(userId, discovery.symbol, receivedTokens, amountUSD, txHash);
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
async function executeServerSellOrSwapOnAerodrome(params) {
    const { privateKey, fromTokenOrSymbol, userId } = params;
    const slippage = params.slippagePercent || 2.5;
    const toToken = (params.toTokenOrSymbol || 'ETH').toUpperCase().replace(/^[$]/, '');
    const account = (0, accounts_1.privateKeyToAccount)(privateKey);
    const walletClient = (0, viem_1.createWalletClient)({
        account,
        chain: chains_1.base,
        transport: (0, viem_1.fallback)([
            (0, viem_1.http)('https://base.llamarpc.com'),
            (0, viem_1.http)('https://1rpc.io/base'),
            (0, viem_1.http)('https://mainnet.base.org')
        ])
    });
    // 1. Discover source token
    const fromMeta = await discoverTokenMetadataServer(fromTokenOrSymbol);
    // 2. Query live on-chain balance of source token
    const liveTokenBalance = await (0, blockchain_1.getOnChainTokenBalance)(fromMeta.address, account.address, fromMeta.decimals);
    if (liveTokenBalance <= 0) {
        throw new Error(`You do not have any ${fromMeta.symbol} tokens in your wallet (${account.address}) on Base Mainnet.`);
    }
    let sellAmount = params.amountToSell && !params.isAll
        ? Math.min(params.amountToSell, liveTokenBalance)
        : liveTokenBalance;
    if (sellAmount <= 0) {
        sellAmount = liveTokenBalance;
    }
    // Check ETH for gas
    const ethBalanceRaw = await blockchain_1.publicClient.getBalance({ address: account.address });
    const ethBalance = parseFloat((0, viem_1.formatUnits)(ethBalanceRaw, 18));
    if (ethBalance < 0.00003) {
        throw new Error(`Insufficient ETH for gas on Base Mainnet (${ethBalance.toFixed(5)} ETH). Need at least ~0.0001 ETH.`);
    }
    const rawSellAmount = (0, viem_1.parseUnits)(sellAmount.toFixed(Math.min(fromMeta.decimals, 6)), fromMeta.decimals);
    // 3. Ensure allowance for Aerodrome Router
    await ensureTokenAllowanceServer(walletClient, fromMeta.address, shared_1.AERODROME_ROUTER_ADDRESS, rawSellAmount);
    // 4. Build Route
    const isTargetETH = toToken === 'ETH' || toToken === 'WETH';
    let routes;
    let destSymbol = isTargetETH ? 'ETH' : 'USDC';
    if (isTargetETH) {
        routes = [
            {
                from: fromMeta.address,
                to: shared_1.BASE_WETH_ADDRESS,
                stable: false,
                factory: shared_1.AERODROME_FACTORY_ADDRESS
            }
        ];
    }
    else {
        if (fromMeta.symbol === 'AERO') {
            routes = [
                {
                    from: fromMeta.address,
                    to: shared_1.BASE_USDC.contractAddress,
                    stable: false,
                    factory: shared_1.AERODROME_FACTORY_ADDRESS
                }
            ];
        }
        else {
            routes = [
                {
                    from: fromMeta.address,
                    to: shared_1.BASE_WETH_ADDRESS,
                    stable: false,
                    factory: shared_1.AERODROME_FACTORY_ADDRESS
                },
                {
                    from: shared_1.BASE_WETH_ADDRESS,
                    to: shared_1.BASE_USDC.contractAddress,
                    stable: false,
                    factory: shared_1.AERODROME_FACTORY_ADDRESS
                }
            ];
        }
    }
    // 5. Query quote
    const amountsOut = await blockchain_1.publicClient.readContract({
        address: shared_1.AERODROME_ROUTER_ADDRESS,
        abi: shared_1.AERODROME_ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [rawSellAmount, routes]
    });
    const expectedOutRaw = amountsOut[amountsOut.length - 1];
    const minOutRaw = (expectedOutRaw * BigInt(Math.floor((100 - slippage) * 100))) / BigInt(10000);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
    let txHash;
    if (isTargetETH && toToken === 'ETH') {
        console.log(`[Telegram DEX Sell] Swapping ${sellAmount} ${fromMeta.symbol} -> native ETH for ${account.address}...`);
        txHash = await walletClient.writeContract({
            address: shared_1.AERODROME_ROUTER_ADDRESS,
            abi: shared_1.AERODROME_ROUTER_ABI,
            functionName: 'swapExactTokensForETH',
            args: [rawSellAmount, minOutRaw, routes, account.address, deadline]
        });
    }
    else {
        console.log(`[Telegram DEX Sell] Swapping ${sellAmount} ${fromMeta.symbol} -> ${destSymbol} for ${account.address}...`);
        txHash = await walletClient.writeContract({
            address: shared_1.AERODROME_ROUTER_ADDRESS,
            abi: shared_1.AERODROME_ROUTER_ABI,
            functionName: 'swapExactTokensForTokens',
            args: [rawSellAmount, minOutRaw, routes, account.address, deadline]
        });
    }
    console.log(`[Telegram DEX Sell] Broadcasted! TX: ${txHash}. Awaiting confirmation...`);
    const receipt = await blockchain_1.publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== 'success') {
        throw new Error(`Transaction reverted on Base Mainnet: https://basescan.org/tx/${txHash}`);
    }
    const outDecimals = isTargetETH ? 18 : 6;
    const receivedAmount = parseFloat((0, viem_1.formatUnits)(expectedOutRaw, outDecimals));
    const gasUsedUSD = Number((parseFloat((0, viem_1.formatUnits)(receipt.gasUsed * (receipt.effectiveGasPrice || 1000000n), 18)) * 2500).toFixed(4));
    if (userId) {
        portfolioStore_1.portfolioStore.recordSell(userId, fromMeta.symbol, isTargetETH ? receivedAmount * 2500 : receivedAmount, sellAmount);
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
