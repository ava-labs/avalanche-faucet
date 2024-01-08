import axios from "axios"

export async function checkMainnetBalance(rpc: string, address: string, threshold = 0): Promise<{isValid: boolean, balance: number}> {
    const response = {isValid: false, balance: 0}
    try {
        const response = await axios.post<any, any>(rpc, {
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [address, "latest"],
            id: 1,
        })
        const balance = parseInt(response.data.result)
        if (balance > threshold) {
            return {isValid: true, balance}
        }
    } catch(err) {
        console.error({
            date: new Date(),
            type: 'MainnetBalanceCheckError',
            item: err
        })
        return response
    }
    return response
}
