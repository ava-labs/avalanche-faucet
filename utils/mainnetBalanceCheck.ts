import axios from "axios"

export async function checkMainnetBalance(faucetConfigId: string, rpc: string, address: string, threshold = 0): Promise<boolean> {
    try {
        const response = await axios.post<any, any>(rpc, {
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [address, "latest"],
            id: 1,
        })
        const balance = parseInt(response.data.result)
        if (balance > threshold) {
            console.log("Successful FaucetMainnetBalanceCheck:", {
                chain: faucetConfigId,
                address: address,
                balance: balance,
            })
            return true
        }
    } catch(err) {
        console.error('ERROR: checkMainnetBalance', err)
        return false
    }
    return false
}
