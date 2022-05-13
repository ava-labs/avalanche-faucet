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

const captcha = new VerifyCaptcha(process.env.CAPTCHA_SECRET);

const cchain = new EVM(evmchains.C, process.env.PK);

router.post('/sendToken', captcha.middleware, async (req: any, res: any) => {
    cchain.sendToken(req.body?.address, (data: SendTokenResponse) => {
        const { status, message, txHash } = data;
        res.status(status).send({message, txHash})
    })
})

router.get('/getDripAmount', (req: any, res: any) => {
    let amt = evmchains.C.DRIP_AMOUNT / 1e9
    res.send({dripAmount: amt})
})

router.get('/recaliber', (req: any, res: any) => {
    cchain.recaliberNonceAndBalance();
    res.send("Recalibering now!")
})

router.get('/ip', (req: any, res: any) => {
    res.send(req.ip)
})

app.use('/api', router)

app.listen(process.env.PORT || 8000, () => {
    console.log(`Server started at port ${process.env.PORT || 8000}`)
})
