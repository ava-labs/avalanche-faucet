const axios = require('axios');

export default class VerifyCaptcha {
    secret: string;
    middleware = (req: any, res: any, next: () => void) => this.verifyCaptcha(req, res, next)

    constructor(app: any, path: string, CAPTCHA_SECRET: any) {
        this.secret = CAPTCHA_SECRET
        app.use(path, this.middleware)
    }

    async shouldAllow(token: string): Promise<boolean> {
        const URL = `https://www.google.com/recaptcha/api/siteverify?secret=${this.secret}&response=${token}`
        const response = await axios.post(URL);
        const data = response?.data;

        if(data?.success) {
            if(data?.score > 0.5) {
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