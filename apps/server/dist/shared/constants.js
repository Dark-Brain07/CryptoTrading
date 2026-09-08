"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERC20_ABI = exports.AERODROME_ROUTER_ABI = exports.AERODROME_SWAP_ROUTES = exports.UNISWAP_V3_ROUTER_ADDRESS = exports.AERODROME_FACTORY_ADDRESS = exports.AERODROME_ROUTER_ADDRESS = exports.VERIFIED_BASE_TOKENIZED_STOCKS = exports.BASE_WETH_ADDRESS = exports.BASE_USDC = exports.BASE_EXPLORER_URL = exports.BASE_RPC_URL = exports.BASE_CHAIN_ID = void 0;
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
// Official Base Mainnet Wrapped Ether
exports.BASE_WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
// Verified Base Mainnet Real Liquid Tokens
exports.VERIFIED_BASE_TOKENIZED_STOCKS = {
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
    // Official Base Mainnet Tokenized Equities
    NVDAc: {
        ticker: 'NVDAc',
        name: 'NVIDIA',
        contractAddress: '0xb20000000000000000000078ee7ce2fE4908108C',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'NVDA',
        referencePriceUSD: 128.50,
        iconUrl: 'https://cryptologos.cc/logos/nvidia-logo.png'
    },
    METAc: {
        ticker: 'METAc',
        name: 'Meta',
        contractAddress: '0xb2000000000000000000008bC8786B856E61707C',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'META',
        referencePriceUSD: 512.00,
        iconUrl: 'https://cryptologos.cc/logos/meta-logo.png'
    },
    AAPLc: {
        ticker: 'AAPLc',
        name: 'Apple',
        contractAddress: '0xb200000000000000000000C2e324d24d7eEcd1fb',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'AAPL',
        referencePriceUSD: 228.00,
        iconUrl: 'https://cryptologos.cc/logos/apple-logo.png'
    },
    GOOGLc: {
        ticker: 'GOOGLc',
        name: 'Alphabet',
        contractAddress: '0xb2000000000000000000002D0BA3164cc74f58B7',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'GOOGL',
        referencePriceUSD: 164.00,
        iconUrl: 'https://cryptologos.cc/logos/google-logo.png'
    },
    AMZNc: {
        ticker: 'AMZNc',
        name: 'Amazon',
        contractAddress: '0xb200000000000000000000d9192b6B456483C2E8',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'AMZN',
        referencePriceUSD: 186.00,
        iconUrl: 'https://cryptologos.cc/logos/amazon-logo.png'
    },
    MSFTc: {
        ticker: 'MSFTc',
        name: 'Microsoft',
        contractAddress: '0xB200000000000000000000Ab99cFa739E253872B',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'MSFT',
        referencePriceUSD: 418.00,
        iconUrl: 'https://cryptologos.cc/logos/microsoft-logo.png'
    },
    MSTRc: {
        ticker: 'MSTRc',
        name: 'MicroStrategy',
        contractAddress: '0xb2000000000000000000004884b426556b92883d',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Blue Chip',
        underlyingSymbol: 'MSTR',
        referencePriceUSD: 138.00,
        iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
    },
    SNDKc: {
        ticker: 'SNDKc',
        name: 'SanDisk',
        contractAddress: '0xb200000000000000000000397293Cb8cda9a10c5',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Semiconductors',
        underlyingSymbol: 'SNDK',
        referencePriceUSD: 72.00,
        iconUrl: 'https://cryptologos.cc/logos/sandisk-logo.png'
    },
    SPCXc: {
        ticker: 'SPCXc',
        name: 'SpaceX',
        contractAddress: '0xb2000000000000000000007b9fcbd005511aCBd5',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'SPCX',
        referencePriceUSD: 185.00,
        iconUrl: 'https://cryptologos.cc/logos/spacex-logo.png'
    },
    TSLAc: {
        ticker: 'TSLAc',
        name: 'Tesla',
        contractAddress: '0xb2000000000000000000001e800a7f5189430cD0',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'TSLA',
        referencePriceUSD: 215.00,
        iconUrl: 'https://cryptologos.cc/logos/tesla-logo.png'
    },
    // Direct aliases without trailing 'c'
    NVDA: {
        ticker: 'NVDA',
        name: 'NVIDIA (NVDAc)',
        contractAddress: '0xb20000000000000000000078ee7ce2fE4908108C',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'NVDA',
        referencePriceUSD: 128.50,
        iconUrl: 'https://cryptologos.cc/logos/nvidia-logo.png'
    },
    META: {
        ticker: 'META',
        name: 'Meta (METAc)',
        contractAddress: '0xb2000000000000000000008bC8786B856E61707C',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'META',
        referencePriceUSD: 512.00,
        iconUrl: 'https://cryptologos.cc/logos/meta-logo.png'
    },
    AAPL: {
        ticker: 'AAPL',
        name: 'Apple (AAPLc)',
        contractAddress: '0xb200000000000000000000C2e324d24d7eEcd1fb',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'AAPL',
        referencePriceUSD: 228.00,
        iconUrl: 'https://cryptologos.cc/logos/apple-logo.png'
    },
    GOOGL: {
        ticker: 'GOOGL',
        name: 'Alphabet (GOOGLc)',
        contractAddress: '0xb2000000000000000000002D0BA3164cc74f58B7',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'GOOGL',
        referencePriceUSD: 164.00,
        iconUrl: 'https://cryptologos.cc/logos/google-logo.png'
    },
    AMZN: {
        ticker: 'AMZN',
        name: 'Amazon (AMZNc)',
        contractAddress: '0xb200000000000000000000d9192b6B456483C2E8',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'AMZN',
        referencePriceUSD: 186.00,
        iconUrl: 'https://cryptologos.cc/logos/amazon-logo.png'
    },
    MSFT: {
        ticker: 'MSFT',
        name: 'Microsoft (MSFTc)',
        contractAddress: '0xB200000000000000000000Ab99cFa739E253872B',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'MSFT',
        referencePriceUSD: 418.00,
        iconUrl: 'https://cryptologos.cc/logos/microsoft-logo.png'
    },
    MSTR: {
        ticker: 'MSTR',
        name: 'MicroStrategy (MSTRc)',
        contractAddress: '0xb2000000000000000000004884b426556b92883d',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Blue Chip',
        underlyingSymbol: 'MSTR',
        referencePriceUSD: 138.00,
        iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
    },
    SNDK: {
        ticker: 'SNDK',
        name: 'SanDisk (SNDKc)',
        contractAddress: '0xb200000000000000000000397293Cb8cda9a10c5',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Semiconductors',
        underlyingSymbol: 'SNDK',
        referencePriceUSD: 72.00,
        iconUrl: 'https://cryptologos.cc/logos/sandisk-logo.png'
    },
    SPCX: {
        ticker: 'SPCX',
        name: 'SpaceX (SPCXc)',
        contractAddress: '0xb2000000000000000000007b9fcbd005511aCBd5',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'SPCX',
        referencePriceUSD: 185.00,
        iconUrl: 'https://cryptologos.cc/logos/spacex-logo.png'
    },
    TSLA: {
        ticker: 'TSLA',
        name: 'Tesla (TSLAc)',
        contractAddress: '0xb2000000000000000000001e800a7f5189430cD0',
        decimals: 18,
        issuer: 'Base Tokenized Equities',
        category: 'Tech',
        underlyingSymbol: 'TSLA',
        referencePriceUSD: 215.00,
        iconUrl: 'https://cryptologos.cc/logos/tesla-logo.png'
    }
};
// Verified Base Mainnet Aerodrome Contracts
exports.AERODROME_ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
exports.AERODROME_FACTORY_ADDRESS = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da';
exports.UNISWAP_V3_ROUTER_ADDRESS = '0x2626664c2603336E57B271c5C0b26F421741e481';
// Pre-configured optimal Aerodrome routes from USDC to tokens
exports.AERODROME_SWAP_ROUTES = {
    AERO: [
        {
            from: exports.BASE_USDC.contractAddress,
            to: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
            stable: false,
            factory: exports.AERODROME_FACTORY_ADDRESS
        }
    ],
    WETH: [
        {
            from: exports.BASE_USDC.contractAddress,
            to: exports.BASE_WETH_ADDRESS,
            stable: false,
            factory: exports.AERODROME_FACTORY_ADDRESS
        }
    ],
    ETH: [
        {
            from: exports.BASE_USDC.contractAddress,
            to: exports.BASE_WETH_ADDRESS,
            stable: false,
            factory: exports.AERODROME_FACTORY_ADDRESS
        }
    ],
    cbBTC: [
        {
            from: exports.BASE_USDC.contractAddress,
            to: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
            stable: false,
            factory: exports.AERODROME_FACTORY_ADDRESS
        }
    ],
    CBBTC: [
        {
            from: exports.BASE_USDC.contractAddress,
            to: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
            stable: false,
            factory: exports.AERODROME_FACTORY_ADDRESS
        }
    ],
    VIRTUAL: [
        {
            from: exports.BASE_USDC.contractAddress,
            to: exports.BASE_WETH_ADDRESS,
            stable: false,
            factory: exports.AERODROME_FACTORY_ADDRESS
        },
        {
            from: exports.BASE_WETH_ADDRESS,
            to: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b',
            stable: false,
            factory: exports.AERODROME_FACTORY_ADDRESS
        }
    ],
    DEGEN: [
        {
            from: exports.BASE_USDC.contractAddress,
            to: exports.BASE_WETH_ADDRESS,
            stable: false,
            factory: exports.AERODROME_FACTORY_ADDRESS
        },
        {
            from: exports.BASE_WETH_ADDRESS,
            to: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
            stable: false,
            factory: exports.AERODROME_FACTORY_ADDRESS
        }
    ],
    // Base Tokenized Equities Swap Routes (Aerodrome Router - Direct USDC pairs)
    NVDAc: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb20000000000000000000078ee7ce2fE4908108C', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    NVDAC: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb20000000000000000000078ee7ce2fE4908108C', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    NVDA: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb20000000000000000000078ee7ce2fE4908108C', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    METAc: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000008bC8786B856E61707C', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    METAC: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000008bC8786B856E61707C', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    META: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000008bC8786B856E61707C', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    AAPLc: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb200000000000000000000C2e324d24d7eEcd1fb', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    AAPLC: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb200000000000000000000C2e324d24d7eEcd1fb', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    AAPL: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb200000000000000000000C2e324d24d7eEcd1fb', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    GOOGLc: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000002D0BA3164cc74f58B7', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    GOOGLC: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000002D0BA3164cc74f58B7', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    GOOGL: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000002D0BA3164cc74f58B7', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    AMZNc: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb200000000000000000000d9192b6B456483C2E8', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    AMZNC: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb200000000000000000000d9192b6B456483C2E8', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    AMZN: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb200000000000000000000d9192b6B456483C2E8', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    MSFTc: [
        { from: exports.BASE_USDC.contractAddress, to: '0xB200000000000000000000Ab99cFa739E253872B', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    MSFTC: [
        { from: exports.BASE_USDC.contractAddress, to: '0xB200000000000000000000Ab99cFa739E253872B', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    MSFT: [
        { from: exports.BASE_USDC.contractAddress, to: '0xB200000000000000000000Ab99cFa739E253872B', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    MSTRc: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000004884b426556b92883d', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    MSTRC: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000004884b426556b92883d', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    MSTR: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000004884b426556b92883d', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    SNDKc: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb200000000000000000000397293Cb8cda9a10c5', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    SNDKC: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb200000000000000000000397293Cb8cda9a10c5', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    SNDK: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb200000000000000000000397293Cb8cda9a10c5', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    SPCXc: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000007b9fcbd005511aCBd5', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    SPCXC: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000007b9fcbd005511aCBd5', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    SPCX: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000007b9fcbd005511aCBd5', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    TSLAc: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000001e800a7f5189430cD0', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    TSLAC: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000001e800a7f5189430cD0', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ],
    TSLA: [
        { from: exports.BASE_USDC.contractAddress, to: '0xb2000000000000000000001e800a7f5189430cD0', stable: false, factory: exports.AERODROME_FACTORY_ADDRESS }
    ]
};
// Aerodrome Router ABI
exports.AERODROME_ROUTER_ABI = [
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
];
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
];
