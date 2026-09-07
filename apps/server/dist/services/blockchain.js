"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicClient = void 0;
exports.getLiveGasMetrics = getLiveGasMetrics;
exports.getOnChainTokenBalance = getOnChainTokenBalance;
exports.formatPreciseAmount = formatPreciseAmount;
exports.scanWalletLiveHoldings = scanWalletLiveHoldings;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const shared_1 = require("../shared");
exports.publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.base,
    transport: (0, viem_1.fallback)([
        (0, viem_1.http)('https://base.llamarpc.com'),
        (0, viem_1.http)('https://1rpc.io/base'),
        (0, viem_1.http)('https://mainnet.base.org')
    ])
});
/**
 * Fetches real-time Base Mainnet gas metrics
 */
async function getLiveGasMetrics() {
    try {
        const block = await exports.publicClient.getBlock({ blockTag: 'latest' });
        const gasPrice = await exports.publicClient.getGasPrice();
        const baseFeeGwei = block.baseFeePerGas ? parseFloat((0, viem_1.formatGwei)(block.baseFeePerGas)) : 0.005;
        const priorityFeeGwei = parseFloat((0, viem_1.formatGwei)(gasPrice)) - baseFeeGwei;
        // Approximate cost of standard ERC-20 approve + Uniswap/Aerodrome swap (~180,000 gas) with ETH at ~$2500
        const ethGasCost = (180000n * gasPrice);
        const ethGasCostInEth = parseFloat((0, viem_1.formatUnits)(ethGasCost, 18));
        const estimatedCostUSD = Number((ethGasCostInEth * 2500).toFixed(4));
        return {
            baseFeeGwei: Number(baseFeeGwei.toFixed(4)),
            priorityFeeGwei: Number(Math.max(0, priorityFeeGwei).toFixed(4)),
            estimatedSwapCostUSD: estimatedCostUSD,
            blockNumber: Number(block.number),
            timestamp: Number(block.timestamp) * 1000
        };
    }
    catch (error) {
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
async function getOnChainTokenBalance(tokenAddress, walletAddress, decimals = 18) {
    try {
        const balanceRaw = await exports.publicClient.readContract({
            address: tokenAddress,
            abi: shared_1.ERC20_ABI,
            functionName: 'balanceOf',
            args: [walletAddress]
        });
        return parseFloat((0, viem_1.formatUnits)(balanceRaw, decimals));
    }
    catch (error) {
        console.warn(`Could not read token balance at ${tokenAddress} for ${walletAddress}:`, error);
        return 0;
    }
}
function formatPreciseAmount(val) {
    if (!val || val === 0)
        return '0.00';
    if (val >= 1000)
        return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1)
        return val.toFixed(4);
    if (val >= 0.0001)
        return val.toFixed(6);
    if (val >= 0.00000001)
        return val.toFixed(8);
    return val.toExponential(4);
}
async function scanWalletLiveHoldings(address) {
    const TOKENS_TO_SCAN = [
        {
            ticker: 'ETH',
            name: 'Ethereum (Base)',
            contractAddress: 'native',
            decimals: 18,
            price: 2524.00,
            change24h: 1.85,
            isNative: true
        },
        {
            ticker: 'USDC',
            name: 'USD Coin',
            contractAddress: shared_1.BASE_USDC.contractAddress,
            decimals: shared_1.BASE_USDC.decimals,
            price: 1.00,
            change24h: 0.01,
            isNative: false
        },
        {
            ticker: 'AERO',
            name: 'Aerodrome Finance',
            contractAddress: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
            decimals: 18,
            price: 0.54,
            change24h: 3.42,
            isNative: false
        },
        {
            ticker: 'WETH',
            name: 'Wrapped Ether',
            contractAddress: '0x4200000000000000000000000000000000000006',
            decimals: 18,
            price: 2524.00,
            change24h: 1.85,
            isNative: false
        },
        {
            ticker: 'cbBTC',
            name: 'Coinbase Wrapped Bitcoin',
            contractAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
            decimals: 8,
            price: 80320.00,
            change24h: 0.95,
            isNative: false
        },
        {
            ticker: 'VIRTUAL',
            name: 'Virtuals Protocol',
            contractAddress: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b',
            decimals: 18,
            price: 0.68,
            change24h: 5.21,
            isNative: false
        },
        {
            ticker: 'DEGEN',
            name: 'Degen Token',
            contractAddress: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
            decimals: 18,
            price: 0.0011,
            change24h: -1.15,
            isNative: false
        },
        // Base Tokenized Equities (Stocks)
        {
            ticker: 'NVDAc',
            name: 'NVIDIA',
            contractAddress: '0xb20000000000000000000078ee7ce2fE4908108C',
            decimals: 18,
            price: 128.50,
            change24h: 3.12,
            isNative: false
        },
        {
            ticker: 'METAc',
            name: 'Meta',
            contractAddress: '0xb2000000000000000000008bC8786B856E61707C',
            decimals: 18,
            price: 512.00,
            change24h: 1.84,
            isNative: false
        },
        {
            ticker: 'AAPLc',
            name: 'Apple',
            contractAddress: '0xb200000000000000000000C2e324d24d7eEcd1fb',
            decimals: 18,
            price: 228.00,
            change24h: 0.95,
            isNative: false
        },
        {
            ticker: 'GOOGLc',
            name: 'Alphabet',
            contractAddress: '0xb2000000000000000000002D0BA3164cc74f58B7',
            decimals: 18,
            price: 164.00,
            change24h: 1.25,
            isNative: false
        },
        {
            ticker: 'AMZNc',
            name: 'Amazon',
            contractAddress: '0xb200000000000000000000d9192b6B456483C2E8',
            decimals: 18,
            price: 186.00,
            change24h: 2.10,
            isNative: false
        },
        {
            ticker: 'MSFTc',
            name: 'Microsoft',
            contractAddress: '0xB200000000000000000000Ab99cFa739E253872B',
            decimals: 18,
            price: 418.00,
            change24h: 1.45,
            isNative: false
        },
        {
            ticker: 'MSTRc',
            name: 'MicroStrategy',
            contractAddress: '0xb2000000000000000000004884b426556b92883d',
            decimals: 18,
            price: 138.00,
            change24h: 5.60,
            isNative: false
        },
        {
            ticker: 'SNDKc',
            name: 'SanDisk',
            contractAddress: '0xb200000000000000000000397293Cb8cda9a10c5',
            decimals: 18,
            price: 72.00,
            change24h: -0.80,
            isNative: false
        },
        {
            ticker: 'SPCXc',
            name: 'SpaceX',
            contractAddress: '0xb2000000000000000000007b9fcbd005511aCBd5',
            decimals: 18,
            price: 185.00,
            change24h: 4.15,
            isNative: false
        },
        {
            ticker: 'TSLAc',
            name: 'Tesla',
            contractAddress: '0xb2000000000000000000001e800a7f5189430cD0',
            decimals: 18,
            price: 215.00,
            change24h: 3.80,
            isNative: false
        }
    ];
    const results = [];
    let ethRaw = 0n;
    try {
        ethRaw = await exports.publicClient.getBalance({ address });
    }
    catch (e) {
        console.warn('Could not read ETH balance for', address, e);
    }
    const ethBalance = parseFloat((0, viem_1.formatUnits)(ethRaw, 18));
    const ethPrice = 2524.00;
    const ethUSD = ethBalance * ethPrice;
    results.push({
        ticker: 'ETH',
        name: 'Ethereum (Base)',
        contractAddress: 'native',
        balance: ethBalance,
        formattedBalance: formatPreciseAmount(ethBalance),
        currentPrice: ethPrice,
        balanceUSD: Number(ethUSD.toFixed(4)),
        change24h: 1.85,
        allocationPercentage: 0,
        explorerUrl: `https://basescan.org/address/${address}`,
        isNative: true
    });
    const erc20Tokens = TOKENS_TO_SCAN.filter(t => !t.isNative);
    const tokenBalances = await Promise.all(erc20Tokens.map(async (tok) => {
        try {
            const bal = await getOnChainTokenBalance(tok.contractAddress, address, tok.decimals);
            return { ...tok, balance: bal };
        }
        catch (e) {
            return { ...tok, balance: 0 };
        }
    }));
    for (const tok of tokenBalances) {
        const balanceUSD = Number((tok.balance * tok.price).toFixed(4));
        results.push({
            ticker: tok.ticker,
            name: tok.name,
            contractAddress: tok.contractAddress,
            balance: tok.balance,
            formattedBalance: formatPreciseAmount(tok.balance),
            currentPrice: tok.price,
            balanceUSD,
            change24h: tok.change24h,
            allocationPercentage: 0,
            explorerUrl: `https://basescan.org/token/${tok.contractAddress}`,
            isNative: false
        });
    }
    const totalUSD = results.reduce((sum, r) => sum + r.balanceUSD, 0);
    for (const r of results) {
        r.allocationPercentage = totalUSD > 0 ? Number(((r.balanceUSD / totalUSD) * 100).toFixed(1)) : 0;
    }
    return {
        totalUSD: Number(totalUSD.toFixed(2)),
        holdings: results
    };
}
