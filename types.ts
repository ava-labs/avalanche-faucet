import EVM from './vms/evm'

export type SendTokenResponse = {
    status: number,
    message: string,
    txHash?: string
}

export type RateLimiterConfig = {
    [key: string]: any,
    RATELIMIT: {
        REVERSE_PROXIES?: number,
        MAX_LIMIT: number,
        WINDOW_SIZE: number,
        PATH?: string,
        SKIP_FAILED_REQUESTS?: boolean,
        [key: string]: any
    }
}

export type EVMInstanceAndConfig = {
    config: ChainType,
    instance: EVM
}

export type ChainType = {
    ID: string,
    NAME: string,
    TOKEN: string,
    RPC: string,
    CHAINID: number,
    EXPLORER: string,
    IMAGE: string,
    DECIMALS?: number,
    MAX_PRIORITY_FEE: string,
    MAX_FEE: string,
    DRIP_AMOUNT: number,
    RECALIBRATE?: number,
    RATELIMIT: {
        WINDOW_SIZE: number,
        MAX_LIMIT: number
    }
}

export type ERC20Type = {
    ID: string,
    NAME: string,
    TOKEN: string,
    HOSTID: string,
    CONTRACTADDRESS: string,
    GASLIMIT: string,
    DRIP_AMOUNT: number,
    DECIMALS: number
    RATELIMIT: {
        WINDOW_SIZE: number,
        MAX_LIMIT: number
    },
    IMAGE: string,
    RECALIBRATE?: number,
    CHAINID?: number,
    EXPLORER?: string,
    MAX_PRIORITY_FEE?: string,
    MAX_FEE?: string,
}

export type ConfigFileType = {
    GLOBAL_RL: RateLimiterConfig,
    evmchains: ChainType[],
    erc20tokens: ERC20Type[]
}