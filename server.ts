import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { BN } from 'avalanche'

import { RateLimiter, VerifyCaptcha, parseURI } from './middlewares'
import EVM from './vms/evm'

import {
    SendTokenResponse,
    ChainType,
    EVMInstanceAndConfig,
    ERC20Type
} from './types'

import {
    evmchains,
    erc20tokens,
    GLOBAL_RL
} from './config.json'

dotenv.config()

const app: any = express()
const router: any = express.Router()

app.use(express.static(path.join(__dirname, "client")))
app.use(cors())
app.use(parseURI)
app.use(bodyParser.json())

new RateLimiter(app, [GLOBAL_RL])

new RateLimiter(app, [
    ...evmchains,
    ...erc20tokens
])

// address rate limiter
new RateLimiter(app, [
    ...evmchains,
    ...erc20tokens
], (req: any, res: any) => {
    const addr = req.body?.address

    if(typeof addr == "string" && addr) {
        return addr.toUpperCase()
    }
})

const captcha: VerifyCaptcha = new VerifyCaptcha(app, process.env.CAPTCHA_SECRET!, process.env.V2_CAPTCHA_SECRET)

let evms = new Map<string, EVMInstanceAndConfig>()

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

// Setting up instance for EVM chains
evmchains.forEach((chain: ChainType): void => {
    const chainInstance: EVM = new EVM(chain, process.env[chain.ID] || process.env.PK)
    
    evms.set(chain.ID, {
        config: chain,
        instance: chainInstance
    })
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