import { ERC20Type } from '../types'

export type ChainType = {
    ID: string,
    NAME: string,
    TOKEN: string,
    RPC: string,
    CHAINID: number,
    EXPLORER: string,
    IMAGE: string,
    MAX_PRIORITY_FEE: string,
    MAX_FEE: string,
    DECIMALS?: number,
    DRIP_AMOUNT: number,
    RECALIBRATE?: number,
    RATELIMIT: {
        WINDOW_SIZE: number,
        MAX_LIMIT: number
    }
}
export type SendTokenResponse = {
    status: number,
    message: string,
    txHash?: string
}

export type RequestType = {
    receiver: string,
    amount: bigint,
    id?: string,
    requestId?: string,
}

export type QueueType = RequestType & {
    nonce: number,
}

export type ContractType = {
    methods: any,
    balance: bigint,
    config: ERC20Type,
    dripAmount: bigint,
    decimals: number,
}
