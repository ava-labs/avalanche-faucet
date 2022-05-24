import { BN } from 'avalanche';

export type ConfigType = {
    ID: string,
    NAME: string,
    RPC: string,
    LEGACY?: boolean,
    MAX_PRIORITY_FEE: string,
    MAX_FEE: string,
    DRIP_AMOUNT: number,
    RECALIBRATE?: number
}

export type SendTokenResponse = {
    status: number,
    message: string,
    txHash?: string
}

export type RequestType = {
    receiver: string,
    amount: BN | number 
}