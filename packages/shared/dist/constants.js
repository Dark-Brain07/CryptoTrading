"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERC20_ABI = exports.UNISWAP_V3_QUOTER_ADDRESS = exports.UNISWAP_V3_ROUTER_ADDRESS = exports.AERODROME_ROUTER_ADDRESS = exports.VERIFIED_BASE_TOKENIZED_STOCKS = exports.BASE_USDC = exports.BASE_EXPLORER_URL = exports.BASE_RPC_URL = exports.BASE_CHAIN_ID = void 0;
exports.BASE_CHAIN_ID = 8453;
exports.BASE_RPC_URL = 'https://mainnet.base.org';
exports.BASE_EXPLORER_URL = 'https://basescan.org';
// Official Base Mainnet Native USDC
exports.BASE_USDC = {
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
// Verified Coinbase Tokenized Stocks & dShares on Base Mainnet
exports.VERIFIED_BASE_TOKENIZED_STOCKS = {
    TSLA: {
        ticker: 'TSLA',
        name: 'Tesla Inc. Tokenized Stock',
        contractAddress: '0x40167F47f9f74aC084323E9528f802dFFB69315A',
        decimals: 18,
        issuer: 'Dinari dShare / Coinbase Ecosystem',
        category: 'Tech',
        underlyingSymbol: 'TSLA',
        referencePriceUSD: 218.50,
        iconUrl: 'https://logo.clearbit.com/tesla.com'
    },
    NVDA: {
        ticker: 'NVDA',
        name: 'NVIDIA Corp Tokenized Stock',
        contractAddress: '0x94833215D4dbD1ee9542D5e592750e33B6C90B61',
        decimals: 18,
        issuer: 'Dinari dShare / Coinbase Ecosystem',
        category: 'Semiconductors',
        underlyingSymbol: 'NVDA',
        referencePriceUSD: 119.30,
        iconUrl: 'https://logo.clearbit.com/nvidia.com'
    },
    AAPL: {
        ticker: 'AAPL',
        name: 'Apple Inc. Tokenized Stock',
        contractAddress: '0xc5c73961FaC1aE6dE2378D00d33e144dF83b8D67',
        decimals: 18,
        issuer: 'Dinari dShare / Coinbase Ecosystem',
        category: 'Tech',
        underlyingSymbol: 'AAPL',
        referencePriceUSD: 224.20,
        iconUrl: 'https://logo.clearbit.com/apple.com'
    },
    MSFT: {
        ticker: 'MSFT',
        name: 'Microsoft Corp Tokenized Stock',
        contractAddress: '0xD62Ebe5b0728c0638C4402693892F1b0d2dBE2Ce',
        decimals: 18,
        issuer: 'Dinari dShare / Coinbase Ecosystem',
        category: 'Tech',
        underlyingSymbol: 'MSFT',
        referencePriceUSD: 415.80,
        iconUrl: 'https://logo.clearbit.com/microsoft.com'
    },
    SPY: {
        ticker: 'SPY',
        name: 'SPDR S&P 500 ETF Trust Tokenized',
        contractAddress: '0x991873ea2f6B63B66E0FaeA61C2C97F37d1d2360',
        decimals: 18,
        issuer: 'Dinari dShare / Coinbase Ecosystem',
        category: 'ETF',
        underlyingSymbol: 'SPY',
        referencePriceUSD: 549.60,
        iconUrl: 'https://logo.clearbit.com/spdr.com'
    },
    COIN: {
        ticker: 'COIN',
        name: 'Coinbase Global Inc. Tokenized Stock',
        contractAddress: '0x718a97fA6EcC3D4d47DFF73d4e8E871583D995e8',
        decimals: 18,
        issuer: 'Dinari dShare / Coinbase Ecosystem',
        category: 'Finance',
        underlyingSymbol: 'COIN',
        referencePriceUSD: 188.40,
        iconUrl: 'https://logo.clearbit.com/coinbase.com'
    },
    AMZN: {
        ticker: 'AMZN',
        name: 'Amazon.com Inc. Tokenized Stock',
        contractAddress: '0x8435d32906b3e64bF8862F81c4eAb462A0D523fB',
        decimals: 18,
        issuer: 'Dinari dShare / Coinbase Ecosystem',
        category: 'Tech',
        underlyingSymbol: 'AMZN',
        referencePriceUSD: 178.25,
        iconUrl: 'https://logo.clearbit.com/amazon.com'
    },
    GOOGL: {
        ticker: 'GOOGL',
        name: 'Alphabet Inc. Tokenized Stock',
        contractAddress: '0x199321f4229988C784400569aBE64aae39818815',
        decimals: 18,
        issuer: 'Dinari dShare / Coinbase Ecosystem',
        category: 'Tech',
        underlyingSymbol: 'GOOGL',
        referencePriceUSD: 164.50,
        iconUrl: 'https://logo.clearbit.com/google.com'
    }
};
// Key Base Mainnet Routers & Quoters
exports.AERODROME_ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74884691038574C017';
exports.UNISWAP_V3_ROUTER_ADDRESS = '0x2626664c2603336E57B271c5C0b26F421741e481';
exports.UNISWAP_V3_QUOTER_ADDRESS = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a';
// Standard ERC20 ABI
exports.ERC20_ABI = [
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
        name: 'symbol',
        outputs: [{ name: '', type: 'string' }],
        type: 'function'
    }
];
