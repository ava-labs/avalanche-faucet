import { BN } from 'avalanche'

export function calculateBaseUnit(amount: string, decimals: number): BN {
    for(let i = 0; i < decimals; i++) {
        amount += "0"
    }

    return new BN(amount)
}

export const asyncCallWithTimeout = async (asyncPromise: Promise<void>, timeLimit: number, timeoutMessage: string) => {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise((_resolve, reject) => {
        timeoutHandle = setTimeout(
            () => reject(new Error(timeoutMessage)),
            timeLimit
        );
    });

    return Promise.race([asyncPromise, timeoutPromise]).then(result => {
        clearTimeout(timeoutHandle);
        return result;
    })
}