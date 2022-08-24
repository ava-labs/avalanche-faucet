import axios from 'axios'

const generateID = (baseID: string, evmchains: any): any => {
    const newID = baseID
    for(let i = 0; i < evmchains.length; i++) {
        if(evmchains[i].ID == newID) {
            const randNumber = parseInt((100 * Math.random()).toString())
            return generateID(baseID + randNumber, evmchains)
        }
    }
    
    return newID
}

const getChainID = async (RPC: string, evmchains: any) => {
    const { data } = await axios.post(RPC, {
        "jsonrpc": "2.0",
        "method": "eth_chainId",
        "params": [],
        "id": 1
    })
    const chainID =  parseInt(data.result)

    for(let i = 0; i < evmchains.length; i++) {
        if(evmchains[i].CHAINID == chainID) {
            return {
                isError: true,
                message: `Duplicate Chain ID ${chainID} found!`,
                chainID
            }
        }
    }

    return {
        isError: false,
        message: "",
        chainID
    }
}

const getRateLimit = (config: any) => {
    const rateLimitConfig = {
        MAX_LIMIT: config.MAX_LIMIT || 1, // 1 request
        WINDOW_SIZE: config.WINDOW_SIZE || 1440 // 24 hours
    }

    return rateLimitConfig
}

const getDripAmount = (DRIP_AMOUNT: number) => {
    // base unit to gwei
    if(DRIP_AMOUNT) {
        return DRIP_AMOUNT * 1e9
    } else {
        return 2e9
    }
}

export const parseConfig = async (config: any, evmchains: any) => {
    let response = {
        isError: true,
        message: "Internal error!",
        config
    }

    try {
        // Check ID
        config.ID = generateID(config.TOKEN, evmchains)

        // Chain ID
        const res = await getChainID(config.RPC, evmchains)
        if(res.isError) {
            response.message = res.message
            return response
        } else {
            config.CHAINID = res.chainID
        }

        // Rate limiter
        config.RATELIMIT = getRateLimit(config)

        // Drip amount
        config.DRIP_AMOUNT = getDripAmount(config.AMOUNT)

        response = {
            isError: false,
            message: "Successful!",
            config
        }
    } catch(err: any) {
        response.message = err.message
    }

    return response
}