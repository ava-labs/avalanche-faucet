import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'

import RateLimiter from './rateLimiter'
import VerifyCaptcha from './verifyCaptcha';
import EVM from './vms/evm'

import { SendTokenResponse } from './types'

import { evmchains, GLOBAL_RL, SEND_TOKEN_RL } from './config.json'

dotenv.config()

const app: any = express()
const router: any = express.Router();

app.use(cors())
app.use(bodyParser.json())

new RateLimiter(app, GLOBAL_RL);
new RateLimiter(app, SEND_TOKEN_RL);
new VerifyCaptcha(app, '/api/sendToken', process.env.CAPTCHA_SECRET);

let evms: any = {};

evmchains.forEach((chain) => {
    const chainInstance = new EVM(chain, process.env[chain.NAME] || process.env.PK);
    
    evms[chain.NAME] = {
        config: chain,
        instance: chainInstance
    }
});

router.post('/sendToken', async (req: any, res: any) => {
    const address = req.body?.address;
    const chain = req.body?.chain;

    evms[chain]?.instance?.sendToken(address, (data: SendTokenResponse) => {
        const { status, message, txHash } = data;
        res.status(status).send({message, txHash})
    });
})

router.get('/getDripAmount', (req: any, res: any) => {
    const chain = req.query?.chain;
    let amt = evms[chain]?.config?.DRIP_AMOUNT / 1e9
    res.send({dripAmount: amt})
})

router.get('/recaliber', (req: any, res: any) => {
    const chain = req.query?.chain;
    evms[chain]?.instance?.recaliberNonceAndBalance();
    res.send("Recalibering now!")
})

router.get('/getChainConfigs', (req: any, res: any) => {
    res.send(evmchains)
})

router.get('/ip', (req: any, res: any) => {
    res.send(req.ip)
})

app.use('/api', router)

app.listen(process.env.PORT || 8000, () => {
    console.log(`Server started at port ${process.env.PORT || 8000}`)
})