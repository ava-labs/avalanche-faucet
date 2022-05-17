import totp from "totp-generator";

export class VerifyTOTP {
    KEY: string;
    middleware = (req: any, res: any, next: () => void) => this.verifyTOTP(req, res, next)

    constructor(KEY: string) {
        if(typeof KEY != "string") {
            throw "TOTP key should be a string"
        }
        this.KEY = KEY;
    }

    verifyTOTP(req: any, res: any, next: () => void) {
        const token = totp(this.KEY);
        if(req.query?.token == token) {
            next();
        } else {
            res.status(403).send("Access denied! Invalid token.")
        }
    }
}