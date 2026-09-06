import { StockToken } from './types';
export declare const BASE_CHAIN_ID = 8453;
export declare const BASE_RPC_URL = "https://mainnet.base.org";
export declare const BASE_EXPLORER_URL = "https://basescan.org";
export declare const BASE_USDC: StockToken;
export declare const BASE_WETH_ADDRESS: "0x4200000000000000000000000000000000000006";
export declare const VERIFIED_BASE_TOKENIZED_STOCKS: Record<string, StockToken>;
export declare const AERODROME_ROUTER_ADDRESS: "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
export declare const AERODROME_FACTORY_ADDRESS: "0x420DD381b31aEf6683db6B902084cB0FFECe40Da";
export declare const UNISWAP_V3_ROUTER_ADDRESS: "0x2626664c2603336E57B271c5C0b26F421741e481";
export interface AerodromeRoute {
    from: `0x${string}`;
    to: `0x${string}`;
    stable: boolean;
    factory: `0x${string}`;
}
export declare const AERODROME_SWAP_ROUTES: Record<string, AerodromeRoute[]>;
export declare const AERODROME_ROUTER_ABI: readonly [{
    readonly name: "defaultFactory";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
}, {
    readonly name: "getAmountsOut";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "amountIn";
        readonly type: "uint256";
    }, {
        readonly name: "routes";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly name: "stable";
            readonly type: "bool";
        }, {
            readonly name: "factory";
            readonly type: "address";
        }];
    }];
    readonly outputs: readonly [{
        readonly name: "amounts";
        readonly type: "uint256[]";
    }];
}, {
    readonly name: "swapExactTokensForTokens";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "amountIn";
        readonly type: "uint256";
    }, {
        readonly name: "amountOutMin";
        readonly type: "uint256";
    }, {
        readonly name: "routes";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly name: "stable";
            readonly type: "bool";
        }, {
            readonly name: "factory";
            readonly type: "address";
        }];
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amounts";
        readonly type: "uint256[]";
    }];
}, {
    readonly name: "swapExactETHForTokens";
    readonly type: "function";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "amountOutMin";
        readonly type: "uint256";
    }, {
        readonly name: "routes";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly name: "stable";
            readonly type: "bool";
        }, {
            readonly name: "factory";
            readonly type: "address";
        }];
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amounts";
        readonly type: "uint256[]";
    }];
}, {
    readonly name: "swapExactTokensForETH";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "amountIn";
        readonly type: "uint256";
    }, {
        readonly name: "amountOutMin";
        readonly type: "uint256";
    }, {
        readonly name: "routes";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly name: "stable";
            readonly type: "bool";
        }, {
            readonly name: "factory";
            readonly type: "address";
        }];
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amounts";
        readonly type: "uint256[]";
    }];
}];
export declare const ERC20_ABI: readonly [{
    readonly constant: true;
    readonly inputs: readonly [{
        readonly name: "_owner";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "balance";
        readonly type: "uint256";
    }];
    readonly type: "function";
}, {
    readonly constant: false;
    readonly inputs: readonly [{
        readonly name: "_spender";
        readonly type: "address";
    }, {
        readonly name: "_value";
        readonly type: "uint256";
    }];
    readonly name: "approve";
    readonly outputs: readonly [{
        readonly name: "success";
        readonly type: "bool";
    }];
    readonly type: "function";
}, {
    readonly constant: true;
    readonly inputs: readonly [{
        readonly name: "_owner";
        readonly type: "address";
    }, {
        readonly name: "_spender";
        readonly type: "address";
    }];
    readonly name: "allowance";
    readonly outputs: readonly [{
        readonly name: "remaining";
        readonly type: "uint256";
    }];
    readonly type: "function";
}, {
    readonly constant: true;
    readonly inputs: readonly [];
    readonly name: "decimals";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint8";
    }];
    readonly type: "function";
}, {
    readonly constant: true;
    readonly inputs: readonly [];
    readonly name: "name";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
    readonly type: "function";
}, {
    readonly constant: true;
    readonly inputs: readonly [];
    readonly name: "symbol";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
    readonly type: "function";
}, {
    readonly constant: false;
    readonly inputs: readonly [{
        readonly name: "_to";
        readonly type: "address";
    }, {
        readonly name: "_value";
        readonly type: "uint256";
    }];
    readonly name: "transfer";
    readonly outputs: readonly [{
        readonly name: "success";
        readonly type: "bool";
    }];
    readonly type: "function";
}];
