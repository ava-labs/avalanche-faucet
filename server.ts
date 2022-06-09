import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

import { RateLimiter, VerifyCaptcha } from './middlewares'
import EVM from './vms/evm'

import { SendTokenResponse } from './types'

import { evmchains, erc20tokens, GLOBAL_RL } from './config.json'
import { BN } from 'avalanche'

dotenv.config()

const app: any = express()
const router: any = express.Router();

app.use(express.static(path.join(__dirname, "client")));
app.use(cors())
app.use(bodyParser.json())

new RateLimiter(app, [GLOBAL_RL]);

new RateLimiter(app, [
    ...evmchains,
    ...erc20tokens
]);

const captcha = new VerifyCaptcha(app, process.env.CAPTCHA_SECRET!);

let evms: any = {};

const getChainByID = (chains: any, id: string): any => {
    let reply;
    chains.forEach((chain: any) => {
        if(chain.ID == id) {
            reply = chain;
        }
    });
    return reply;
}

const populateConfig = (child: any, parent: any) => {
    Object.keys(parent || {}).forEach((key) => {
        if(!child[key]) {
            child[key] = parent[key];
        }
    })
    return child;
}

evmchains.forEach((chain) => {
    const chainInstance = new EVM(chain, process.env[chain.ID] || process.env.PK);
    
    evms[chain.ID] = {
        config: chain,
        instance: chainInstance
    }
});

erc20tokens.forEach((token, i) => {
    if(token.HOSTID) {
        token = populateConfig(token, getChainByID(evmchains, token.HOSTID))
    }

    erc20tokens[i] = token;
    evms[getChainByID(evmchains, token.HOSTID).ID].instance.addERC20Contract(token);
});

router.post('/sendToken', captcha.middleware, async (req: any, res: any) => {
    const address = req.body?.address;
    const chain = req.body?.chain;
    const erc20 = req.body?.erc20

    evms[chain]?.instance?.sendToken(address, erc20, (data: SendTokenResponse) => {
        const { status, message, txHash } = data;
        res.status(status).send({message, txHash})
    });
});

router.get('/getChainConfigs', (req: any, res: any) => {
    const configs = [...evmchains, ...erc20tokens]
    res.send(configs)
});

router.get('/faucetAddress', (req: any, res: any) => {
    res.send(evms[req.query?.chain!]?.instance?.account?.address)
})

router.get('/getBalance', (req: any, res: any) => {
    let chain = req.query?.chain;
    let erc20 = req.query?.erc20;
    let balance = evms[chain]?.instance?.getBalance(erc20)?.div(new BN(1e9))?.toString();
    res.send(balance)
})

app.use('/api', router);

app.get('/health', (req: any, res: any) => {
    res.status(200).send('Server healthy')
});

app.get('/ip', (req: any, res: any) => {
    res.status(200).send({
        ip: req.headers["cf-connecting-ip"] || req.ip
    });
})

app.get('*', async (req: any, res: any) => {
    res.sendFile(path.join(__dirname, "client", "index.html"))
});

app.listen(process.env.PORT || 8000, () => {
    console.log(`Server started at port ${process.env.PORT || 8000}`)
})