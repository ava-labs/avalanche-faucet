import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

import { RateLimiter, VerifyCaptcha, VerifyTOTP } from './middlewares'
import EVM from './vms/evm'

import { SendTokenResponse } from './types'

import { evmchains, GLOBAL_RL } from './config.json'
import { BN } from 'avalanche'

dotenv.config()

const app: any = express()
const router: any = express.Router();

app.use(express.static(path.join(__dirname, "client")));
app.use(cors())
app.use(bodyParser.json())

new RateLimiter(app, [GLOBAL_RL]);
new RateLimiter(app, evmchains);

const captcha = new VerifyCaptcha(app, process.env.CAPTCHA_SECRET!);
const totp = new VerifyTOTP(process.env.TOTPKEY!);

let evms: any = {};

evmchains.forEach((chain) => {
    const chainInstance = new EVM(chain, process.env[chain.ID] || process.env.PK);
    
    evms[chain.ID] = {
        config: chain,
        instance: chainInstance
    }
});

router.post('/sendToken', captcha.middleware, async (req: any, res: any) => {
    const address = req.body?.address;
    const chain = req.body?.chain;

    evms[chain]?.instance?.sendToken(address, (data: SendTokenResponse) => {
        const { status, message, txHash } = data;
        res.status(status).send({message, txHash})
    });
})

router.get('/recalibrate', totp.middleware, (req: any, res: any) => {
    let chain = req.query?.chain;
    evms[chain]?.instance?.recalibrateNonceAndBalance();
    res.send("Recalibrating now.")
})

router.get('/getChainConfigs', (req: any, res: any) => {
    res.send(evmchains)
});

router.get('/faucetAddress', (req: any, res: any) => {
    res.send(evms[req.query?.chain!]?.instance?.account?.address)
})

router.get('/getBalance', (req: any, res: any) => {
    let chain = req.query?.chain;
    let balance = evms[chain]?.instance?.balance?.div(new BN(1e9))?.toString();
    res.send(balance)
})

router.get('/ip', (req: any, res: any) => {
    res.send(req.ip)
})

app.use('/api', router);

app.get('*', async (req: any, res: any) => {
    res.sendFile(path.join(__dirname, "client", "index.html"))
});

app.listen(process.env.PORT || 8000, () => {
    console.log(`Server started at port ${process.env.PORT || 8000}`)
})