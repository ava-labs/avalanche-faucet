export function calculateBaseUnit(amount: string, decimals: number): bigint {
    const parsedNumber = parseFloat(amount);

    if (!isFinite(parsedNumber)) {
        throw new Error("Invalid number input for formatting base unit: " + amount);
    }

    const formattedNumber = parsedNumber.toFixed(decimals);
    const [integerPart, decimalPart] = formattedNumber.split('.');

    const bigInteger = BigInt(integerPart);
    const bigDecimal = BigInt(decimalPart || '0');

    const finalAmount = bigInteger * BigInt(10 ** decimals) + bigDecimal;
    return finalAmount
}

export const asyncCallWithTimeout = async (asyncPromise: Promise<any>, timeLimit: number, timeoutMessage: string) => {
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