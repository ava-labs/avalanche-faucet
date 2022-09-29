import { BN } from 'avalanche'

export function calculateBaseUnit(amount: string, decimals: number): BN {
    for(let i = 0; i < decimals; i++) {
        amount += "0"
    }

    return new BN(amount)
}