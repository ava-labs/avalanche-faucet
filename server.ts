import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { BN } from 'avalanche'

import { RateLimiter, VerifyCaptcha, parseURI } from './middlewares'
import { parseConfig, Storage } from './utilities'
import EVM from './vms/evm'

import {
    SendTokenResponse,
    ChainType,
    EVMInstanceAndConfig,
    ERC20Type
} from './types'

import {
    GLOBAL_RL,
    ADD_FAUCET_RL
} from './config.json'

dotenv.config()

const app: any = express()
const router: any = express.Router()

app.use(express.static(path.join(__dirname, "client")))
app.use(cors())
app.use(parseURI)
app.use(bodyParser.json())

const storage = new Storage(
    process.env.AWS_BUCKET_NAME!,
    process.env.AWS_BUCKET_REGION!,
    process.env.AWS_ACCESS_KEY!,
    process.env.AWS_SECRET_KEY!
)

// address rate limiter
const getAddress = (req: any, res: any) => {
    const addr = req.body?.address

    if(typeof addr == "string" && addr) {
        return addr.toUpperCase()
    }
}

let evmchains: any = [], erc20tokens: any = []

// Rate Limiter setup
new RateLimiter(app, [GLOBAL_RL])
new RateLimiter(app, [ADD_FAUCET_RL])

let evmIPRateLimiter: any = new RateLimiter(app, evmchains)

let evmAddressRateLimiter: any = new RateLimiter(app, evmchains, getAddress)

let captcha: VerifyCaptcha = new VerifyCaptcha(app, process.env.CAPTCHA_SECRET!, process.env.V2_CAPTCHA_SECRET)

let evms: any

let addEVMInstance: any

const initialize = async () => {
    evmchains = []
    erc20tokens = []
    evms = new Map<string, EVMInstanceAndConfig>()

    try {
        evmchains = await storage.download('evmchains.json')
    } catch(err: any) {
        console.log("Error!")
    }

    evmchains.forEach((config: any) => {
        evmIPRateLimiter.addNewConfig(config)
        evmAddressRateLimiter.addNewConfig(config, getAddress)
    })

    // Get the complete config object from the array of config objects (chains) with ID as id
    const getChainByID = (chains: ChainType[], id: string): ChainType | undefined => {
        let reply: ChainType | undefined
        chains.forEach((chain: ChainType): void => {
            if(chain.ID == id) {
                reply = chain
            }
        })
        return reply
    }

    // Populates the missing config keys of the child using the parent's config
    const populateConfig = (child: any, parent: any): any => {
        Object.keys(parent || {}).forEach((key) => {
            if(!child[key]) {
                child[key] = parent[key]
            }
        })
        return child
    }

    // Add evm faucet instance
    addEVMInstance = (chain: ChainType) => {
        const chainInstance: EVM = new EVM(chain, process.env[chain.ID] || process.env.PK)
        
        evms.set(chain.ID, {
            config: chain,
            instance: chainInstance
        })
    }

    // Setting up instance for EVM chains
    evmchains.forEach((chain: ChainType): void => {
        addEVMInstance(chain)
    })

    // Adding ERC20 token contracts to their HOST evm instances
    erc20tokens.forEach((token: ERC20Type, i: number): void => {
        if(token.HOSTID) {
            token = populateConfig(token, getChainByID(evmchains, token.HOSTID))
        }

        erc20tokens[i] = token
        const evm: EVMInstanceAndConfig = evms.get(getChainByID(evmchains, token.HOSTID)?.ID!)!

        evm?.instance.addERC20Contract(token)
    })
}

initialize()

const addNewEVMFaucet = (config: any) => {
    evmchains.push(config)
    
    // Asynchronously update the S3 storage
    storage.update(evmchains, 'evmchains.json')
    
    addEVMInstance(config)
    evmIPRateLimiter.addNewConfig(config)
    evmAddressRateLimiter.addNewConfig(config, getAddress)
}

app.post('/a', async (req: any, res: any) => {
    console.log(await storage.update(req.body.config, "evmchains.json"))
    res.send("OK")
})

router.post('/addFaucet', async (req: any, res: any) => {
    const chainConfig = req.body?.config
    const response = await parseConfig(chainConfig, [...evmchains, ...erc20tokens])

    if(!response.isError) {
        addNewEVMFaucet(response.config)
        res.status(200).send(response)
    } else {
        res.status(500).send(response)
    }
})

// POST request for sending tokens or coins
router.post('/sendToken', captcha.middleware, async (req: any, res: any) => {
    const address: string = req.body?.address
    const chain: string = req.body?.chain
    const erc20: string | undefined = req.body?.erc20

    const evm: EVMInstanceAndConfig = evms.get(chain)!

    if(evm) {
        evm?.instance.sendToken(address, erc20, (data: SendTokenResponse) => {
            const { status, message, txHash } = data
            res.status(status).send({message, txHash})
        })
    } else {
        res.status(400).send({message: "Invalid parameters passed!"})
    }
})

// GET request for fetching all the chain and token configurations
router.get('/getChainConfigs', (req: any, res: any) => {
    const configs: any = [...evmchains, ...erc20tokens]
    res.send({ configs })
})

// GET request for fetching faucet address for the specified chain
router.get('/faucetAddress', (req: any, res: any) => {
    const chain: string = req.query?.chain
    const evm: EVMInstanceAndConfig = evms.get(chain)!

    res.send({
        address: evm?.instance.account.address
    })
})

// GET request for fetching faucet balance for the specified chain or token
router.get('/getBalance', (req: any, res: any) => {
    const chain: string = req.query?.chain
    const erc20: string | undefined = req.query?.erc20

    const evm: EVMInstanceAndConfig = evms.get(chain)!

    let balance: BN = evm?.instance.getBalance(erc20)

    if(balance) {
        balance = balance.div(new BN(1e9))
    } else {
        balance = new BN(0)
    }

    res.status(200).send({
        balance: balance?.toString()
    })
})

app.use('/api', router)

app.get('/health', (req: any, res: any) => {
    res.status(200).send('Server healthy')
})

app.get('/ip', (req: any, res: any) => {
    res.status(200).send({
        ip: req.headers["cf-connecting-ip"] || req.ip
    })
})

app.get('*', async (req: any, res: any) => {
    res.sendFile(path.join(__dirname, "client", "index.html"))
})

app.listen(process.env.PORT || 8000, () => {
    console.log(`Server started at port ${process.env.PORT || 8000}`)
})