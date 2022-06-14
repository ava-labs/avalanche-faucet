import { BN } from 'avalanche'

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
    amount: BN | number,
    id?: string
}