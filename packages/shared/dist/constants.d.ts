import { StockToken } from './types';
export declare const BASE_CHAIN_ID = 8453;
export declare const BASE_RPC_URL = "https://mainnet.base.org";
export declare const BASE_EXPLORER_URL = "https://basescan.org";
export declare const BASE_USDC: StockToken;
export declare const VERIFIED_BASE_TOKENIZED_STOCKS: Record<string, StockToken>;
export declare const AERODROME_ROUTER_ADDRESS: "0xcF77a3Ba9A5CA399B7c97c74884691038574C017";
export declare const UNISWAP_V3_ROUTER_ADDRESS: "0x2626664c2603336E57B271c5C0b26F421741e481";
export declare const UNISWAP_V3_QUOTER_ADDRESS: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
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
    readonly name: "symbol";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
    readonly type: "function";
}];
