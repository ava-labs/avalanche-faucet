import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

import { RateLimiter, VerifyCaptcha, parseBody, parseURI } from './middlewares'
import EVM from './vms/evm'

import {
    SendTokenResponse,
    ChainType,
    EVMInstanceAndConfig,
} from './types'

import {
    evmchains,
    erc20tokens,
    couponConfig,
    GLOBAL_RL,
    NATIVE_CLIENT,
    DEBUG,
} from './config.json'
import { CouponService } from './CouponService/couponService'
import {
    PIPELINE_CHECKS,
    PipelineCheckValidity,
    checkCouponPipeline,
    checkMainnetBalancePipeline,
    pipelineFailureMessage
} from './utils/pipelineChecks'

dotenv.config()

const app: any = express()
const router: any = express.Router()

app.use(cors())
app.use(parseURI)
app.use(parseBody)

if (NATIVE_CLIENT) {
    app.use(express.static(path.join(__dirname, "client")))
}

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

const couponService = new CouponService(couponConfig)

const captcha: VerifyCaptcha = new VerifyCaptcha(app, process.env.CAPTCHA_SECRET!, process.env.V2_CAPTCHA_SECRET!)

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

const separateConfigFields = ['COUPON_REQUIRED', 'MAINNET_BALANCE_CHECK_RPC']

// Populates the missing config keys of the child using the parent's config
const populateConfig = (child: any, parent: any): any => {
    Object.keys(parent || {}).forEach((key) => {
        // Do not copy configs of separateConfigFields (in ERC20 tokens) from host chain
        if(!separateConfigFields.includes(key) && !child[key]) {
            child[key] = parent[key]
        }
    })
    return child
}

// Setting up instance for EVM chains
evmchains.forEach((chain: ChainType): void => {
    const chainInstance: EVM = new EVM(chain, (process.env[chain.ID] || process.env.PK)!)
    
    evms.set(chain.ID, {
        config: chain,
        instance: chainInstance
    })
})

// Adding ERC20 token contracts to their HOST evm instances
erc20tokens.forEach((token: any, i: number): void => {
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
    const coupon: string | undefined = req.body?.couponId

    // initialize instances
    const evm = evms.get(chain)
    const erc20Instance = evm?.instance?.contracts?.get(erc20 ?? "")

    // validate parameters
    if (evm === undefined || (erc20 && erc20Instance === undefined)) {
        res.status(400).send({ message: 'Invalid parameters passed!' })
        return
    }

    // unique id for each token
    const faucetConfigId = erc20Instance?.config.ID ?? evm?.config.ID

    // drip amount (native or erc20 token) for this request as per config
    const dripAmount = erc20Instance?.config.DRIP_AMOUNT ?? evm.config.DRIP_AMOUNT

    /**
     * Pipeline Checks
     * 1. Pipelines are checks or rules that a request goes through before being processed
     * 2. The request should pass at least one pipeline check
     * 3. If no pipeline check is required for a token, then directly process the request
     * 4. Currently, we have 2 pipeline checks: Coupon Check & Mainnet Balance Check
     */
    const mainnetCheckEnabledRPC = (erc20Instance ? erc20Instance.config.MAINNET_BALANCE_CHECK_RPC : evm.config.MAINNET_BALANCE_CHECK_RPC) ?? false
    const couponCheckEnabled = couponConfig.IS_ENABLED && ((erc20Instance ? erc20Instance.config.COUPON_REQUIRED : evm.config.COUPON_REQUIRED) ?? false)

    let pipelineValidity: PipelineCheckValidity = {isValid: false, dripAmount}
    !pipelineValidity.isValid && couponCheckEnabled && await checkCouponPipeline(couponService, pipelineValidity, faucetConfigId, coupon)
    
    // don't check mainnet balance, if coupon is provided
    !pipelineValidity.isValid && !coupon && mainnetCheckEnabledRPC && await checkMainnetBalancePipeline(pipelineValidity, faucetConfigId, mainnetCheckEnabledRPC, address)

    if (
        (mainnetCheckEnabledRPC || couponCheckEnabled) &&
        !pipelineValidity.isValid
    ) {
        // failed
        res.status(400).send({message: pipelineValidity.errorMessage + pipelineFailureMessage(mainnetCheckEnabledRPC, couponCheckEnabled)})
        return
    }

    // logging requests (if enabled)
    DEBUG && console.log(JSON.stringify({
        "type": "NewFaucetRequest",
        "address": address,
        "chain": chain,
        "erc20": erc20,
        "ip": req.headers["cf-connecting-ip"] || req.ip
    }))

    // send request
    evm.instance.sendToken(address, erc20, pipelineValidity.dripAmount, async (data: SendTokenResponse) => {
        const { status, message, txHash } = data

        // reclaim coupon if transaction is failed
        if (pipelineValidity.checkPassedType === PIPELINE_CHECKS.COUPON && coupon && txHash === undefined) {
            await couponService.reclaimCouponAmount(coupon, pipelineValidity.dripAmount)
        }
        res.status(status).send({message, txHash})
    })
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

    let balance: bigint = evm?.instance.getBalance(erc20)

    if(balance) {
        balance = balance
    } else {
        balance = BigInt(0)
    }

    res.status(200).send({
        balance: balance?.toString()
    })
})

router.get('/faucetUsage', (req: any, res: any) => {
    const chain: string = req.query?.chain

    const evm: EVMInstanceAndConfig = evms.get(chain)!

    const usage: number = evm?.instance?.getFaucetUsage()

    res.status(200).send({
        usage
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
    const chain = req.query.subnet;
    const erc20 = req.query.erc20;
    if (NATIVE_CLIENT) {
        res.sendFile(path.join(__dirname, "client", "index.html"))
    } else {
        res.redirect(`https://core.app/tools/testnet-faucet${chain ? "?subnet=" + chain + (erc20 ? "&token=" + erc20 : "") : ""}`);
    }
})

app.listen(process.env.PORT || 8000, () => {
    console.log(`Server started at port ${process.env.PORT || 8000}`)
})
