const axios = require('axios')

export class VerifyCaptcha {
    secret: string
    v2secret?: string
    middleware = (req: any, res: any, next: () => void) => this.verifyCaptcha(req, res, next)

    constructor(app: any, CAPTCHA_SECRET: string, V2_CAPTCHA_SECRET?: string) {
        if(typeof CAPTCHA_SECRET != "string") {
            throw "Captcha Secret should be string"
        }
        this.secret = CAPTCHA_SECRET
        this.v2secret = V2_CAPTCHA_SECRET
    }

    async verifyV2Token(v2Token: string): Promise<boolean> {
        if(v2Token) {
            const URL = `https://www.google.com/recaptcha/api/siteverify?secret=${this.v2secret}&response=${v2Token}`
            let response

            try {
                response = await axios.post(URL)
            } catch(err: any){
                console.log("Recaptcha V2 error:", err?.message)
            }

            const data = response?.data

            if(data?.success) {
                return true;
            }
        }

        return false
    }

    async verifyV3Token(v3Token: string): Promise<boolean> {
        const URL = `https://www.google.com/recaptcha/api/siteverify?secret=${this.secret}&response=${v3Token}`
        let response

        try {
            response = await axios.post(URL)
        } catch(err: any){
            console.log("Recaptcha V3 error:", err?.message)
        }
        
        const data = response?.data

        if(data?.success) {
            if(data?.action == 'faucetdrip') {
                if(data?.score > 1) {
                    return true
                }
            }
        }

        return false
    }

    async shouldAllow(token: string, v2Token: string): Promise<boolean> {
        if(await this.verifyV3Token(token)) {
            return true
        } else {
            if(await this.verifyV2Token(v2Token)) {
                return true
            }
        }
        return false
    }

    async verifyCaptcha(req: any, res: any, next: () => void) {
        const shouldAllow = await this.shouldAllow(req?.body?.token, req?.body?.v2Token)
        if(shouldAllow) {
            next()
        } else {
            return res.status(400).send({message: "Captcha verification failed! Try solving below."})
        }
    }
}