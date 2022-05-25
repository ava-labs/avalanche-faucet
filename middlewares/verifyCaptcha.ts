const axios = require('axios');

export class VerifyCaptcha {
    secret: string;
    middleware = (req: any, res: any, next: () => void) => this.verifyCaptcha(req, res, next)

    constructor(app: any, CAPTCHA_SECRET: string) {
        if(typeof CAPTCHA_SECRET != "string") {
            throw "Captcha Secret should be string";
        }
        this.secret = CAPTCHA_SECRET
    }

    async shouldAllow(token: string): Promise<boolean> {
        const URL = `https://www.google.com/recaptcha/api/siteverify?secret=${this.secret}&response=${token}`
        const response = await axios.post(URL);
        const data = response?.data;

        if(data?.success) {
            console.log("score:", data?.score)
            if(data?.score >= 0.3) {
                return true;
            }
        }

        return false;
    }

    async verifyCaptcha(req: any, res: any, next: () => void) {
        const shouldAllow = await this.shouldAllow(req?.body?.token);
        if(shouldAllow) {
            next();
        } else {
            return res.status(400).send({message: "Captcha verification failed! Try refreshing."})
        }
    }
}