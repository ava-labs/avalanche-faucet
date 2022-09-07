import axios from 'axios'

export const parseConfig = async (config: any, configs: any, faucetConfig: any) => {
    let response = {
        isError: true,
        message: "Internal error!",
        config
    }

    try {
        let res

        // Parse token
        res = parseToken(config.TOKEN)
        if(res.isError) {
            response.message = res.message
            return response
        }
        config.TOKEN = res.token

        // Check ID
        config.ID = generateID(config.TOKEN, configs)

        // Check unique name
        res = parseName(config.NAME, configs)
        if(res.isError) {
            response.message = res.message
            return response
        }

        // RPC and Chain ID check
        res = await getChainID(config.RPC, configs)
        if(res.isError) {
            response.message = res.message
            return response
        }
        config.CHAINID = res.chainID

        // Validate Explorer URL
        res = await validateURL(config.EXPLORER, "Explorer")
        if(res.isError) {
            response.message = res.message
            return response
        }

        // Validate Image URL
        res = await validateURL(config.IMAGE, "Image")
        if(res.isError) {
            response.message = res.message
            return response
        }

        // Parse fee configs
        res = parseFee(config)
        if(res.isError) {
            response.message = res.message
            return response
        }
        config.MAX_FEE = res.MAX_FEE
        config.MAX_PRIORITY_FEE = res.MAX_PRIORITY_FEE

        // Rate limiter
        res = getRateLimit(config)
        if(res.isError) {
            response.message = res.message
            return response
        }
        config.RATELIMIT = res.rateLimitConfig

        // Drip amount
        res = getDripAmount(config.DRIP_AMOUNT)
        if(res.isError) {
            response.message = res.message
            return response
        }
        config.DRIP_AMOUNT = res.DRIP_AMOUNT

        const expectedBalance = Math.max(faucetConfig.minFaucetDrops * config.DRIP_AMOUNT / 1e9, faucetConfig.expectedBalance)

        if(faucetConfig.shouldCheckBalance) {
            res = await checkBalance(config.RPC, config.TOKEN, faucetConfig.faucetAddress, expectedBalance)
            if(res.isError) {
                response.message = res.message
                return response
            }
        }

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

// Generates unique all-caps ID from the list of configs provided
const generateID = (baseID: string, configs: any): any => {
    const newID = baseID.toUpperCase()
    for(let i = 0; i < configs.length; i++) {
        if(configs[i].ID == newID) {
            const randNumber = parseInt((100 * Math.random()).toString())
            return generateID(baseID + randNumber, configs)
        }
    }
    
    return newID
}

// Check name should be unique withing configs
const parseName = (name: string, configs: any) => {
    for(let i = 0; i < configs.length; i++) {
        if(configs[i].NAME == name) {
            return {
                isError: true,
                message: "Should have a unique name!"
            }
        }
    }

    return {
        isError: false,
        message: ""
    }
}

// parse tokens to all-caps and less than 10 characters
const parseToken = (token: string) => {
    try{
        token = token.toUpperCase()
    } catch(err: any) {
        return {
            isError: true,
            message: "Invalid token name!",
            token
        }
    }

    if(token.length > 10 || token.length == 0) {
        return {
            isError: true,
            message: "Invalid token name!",
            token
        }
    }

    return {
        isError: false,
        message: "",
        token
    }
}

const checkBalance = async (RPC: string, token: string, faucetAddress: string, expectedBalance: number) => {
    try {
        const { data } = await axios.post(RPC, {
            "jsonrpc": "2.0",
            "method": "eth_getBalance",
            "params": [
                faucetAddress,
                "latest"
            ],
            "id": 1
        })

        const balance =  parseInt(data.result)

        if(isNaN(balance) || balance / 1e18 < expectedBalance) {
            return {
                isError: true,
                message: `Please send at least ${expectedBalance} ${token} to the faucet address.`
            }
        }

    } catch(err: any) {
        return {
            isError: true,
            message: "Error fetching balance. Invalid RPC!"
        }
    }

    return {
        isError: false,
        message: ""
    }
}

// Validates RPC by fetching ChainID. ChainID should be unique within the configs passed
const getChainID = async (RPC: string, configs: any) => {
    let chainID
    try {
        const { data } = await axios.post(RPC, {
            "jsonrpc": "2.0",
            "method": "eth_chainId",
            "params": [],
            "id": 1
        })
        chainID =  parseInt(data.result)

        if(isNaN(chainID)) {
            return {
                isError: true,
                message: `Invalid chain ID found!`,
                chainID
            }
        }

        for(let i = 0; i < configs.length; i++) {
            if(configs[i].CHAINID == chainID) {
                return {
                    isError: true,
                    message: `Duplicate Chain ID ${chainID} found!`,
                    chainID
                }
            }
        }
    } catch(err: any) {
        return {
            isError: true,
            message: "Error fetching chain ID. Invalid RPC!"
        }
    }

    return {
        isError: false,
        message: "",
        chainID
    }
}

const validateURL = async (url: string, type: string) => {
    let resp = {
        isError: true,
        message: `Invalid ${type} URL`
    }
    try {
        const res = await axios.get(url)
        if(res.status < 400) {
            return {
                isError: false,
                message: ""
            }
        } else {
            return resp
        }
    } catch(err: any) {
        return resp
    }
}

// Parse Rate limiting config
const getRateLimit = (config: any) => {
    const maxLimit = parseInt(config.RATELIMIT.MAX_LIMIT) || 1
    const windowSize = parseInt(config.RATELIMIT.WINDOW_SIZE) || 1440

    const rateLimitConfig = {
        MAX_LIMIT: maxLimit, // 1 request
        WINDOW_SIZE: windowSize // 24 hours
    }

    if(maxLimit < 1 || maxLimit > 100 || windowSize < 60 || windowSize > 1440) {
        return {isError: true, message: "Invalid rate limit config!", rateLimitConfig}
    }

    return {isError: false, message: "", rateLimitConfig}
}

const parseFee = (config: any) => {
    let { MAX_FEE, MAX_PRIORITY_FEE } = config

    const response = {
        isError: true,
        message: "Invalid max fee or max priority fee!",
        MAX_FEE,
        MAX_PRIORITY_FEE
    }

    try {
        MAX_FEE = parseInt(MAX_FEE)
        MAX_PRIORITY_FEE = parseInt(MAX_PRIORITY_FEE)
    } catch(err: any) {
        response.message = "Fee configs should be a number!"
        return response
    }

    if(MAX_FEE < MAX_PRIORITY_FEE) {
        response.message = "Max priority fee cannot be greater than max fee!"
        return response
    }

    if(MAX_FEE > 1e4 || MAX_FEE <= 0) {
        response.message = "Max fee is in invalid range!"
        return response
    }

    if(MAX_PRIORITY_FEE > 1e4 || MAX_PRIORITY_FEE <= 0) {
        response.message = "Max priority fee is in invalid range!"
        return response
    }

    MAX_FEE = (MAX_FEE * 1e9).toString()
    MAX_PRIORITY_FEE = (MAX_PRIORITY_FEE * 1e9).toString()

    return {
        isError: false,
        message: "",
        MAX_FEE,
        MAX_PRIORITY_FEE
    }
}

const getDripAmount = (DRIP_AMOUNT: number) => {
    const response = {
        isError: true,
        message: "Invalid drop amount!",
        DRIP_AMOUNT
    }

    if(DRIP_AMOUNT) {
        if(DRIP_AMOUNT <= 0 || DRIP_AMOUNT > 1000) {
            response.message = "Drop amount out of range!"
        } else {
            DRIP_AMOUNT *= 1e9
            return {
                isError: false,
                message: "",
                DRIP_AMOUNT
            }
        }
    }

    return response
}