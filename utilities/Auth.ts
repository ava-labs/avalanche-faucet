import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authenticator } from 'otplib'
import Cryptr from 'cryptr'

export class Auth {
    adminUsername: string
    adminPasswordHash: string
    jwtTokenKey: string
    adminTotpKey: string
    cryptr: any

    constructor(ADMIN_USERNAME: string, ADMIN_PASSWORD_HASH: string, ADMIN_TOTP_KEY: string, ENCRYPTION_KEY: string) {
        this.adminUsername = ADMIN_USERNAME
        this.adminPasswordHash = ADMIN_PASSWORD_HASH
        this.adminTotpKey = ADMIN_TOTP_KEY
        this.jwtTokenKey = ENCRYPTION_KEY
        this.cryptr = new Cryptr(ENCRYPTION_KEY)
    }

    createUser = async (username: string, password: string, users: any) => {
        let response = {
            isError: true,
            message: "Cannot create new user!",
            users,
            totpKey: undefined
        }
        
        for(let i = 0; i < users.length; i++) {
            if(users[i].username == username) {
                response.message = "User already exists!"
                return response
            }
        }

        try {
            const hash = await bcrypt.hash(password, 10)

            const totpKey = authenticator.generateSecret()

            users.push({
                username,
                hash,
                totpKey: this.cryptr.encrypt(totpKey)
            })
    
            return {
                isError: false,
                message: "Successful",
                totpKey,
                users
            }
        } catch(err: any) {
            response.message = "Error: " + err.message
            return response 
        }
    }

    getAuthorizedToken = async (username: string, password: string, totp: string, users: any, isAdmin: boolean = false) => {
        let token = undefined
    
        if(isAdmin && await this.isAdminUser(username, password, totp)) {
            token = this.getJWTToken(username, true)
        } else if(await this.isUser(username, password, totp, users)) {
            token = this.getJWTToken(username)
        }
    
        return token
    }

    verify = (req: any, res: any, next: any) => {
        const token = req.body.token || req.query.token || req.headers["x-access-token"]

        if (!token) {
            return res.status(403).send("A token is required for authentication");
        }

        try {
            const decoded = jwt.verify(token, this.jwtTokenKey);
            req.user = decoded
        } catch (err) {
            return res.status(401).send("Invalid Token:" + err);
        }
        
        return next();
    }

    isAdminUser = async (username: string, password: string, totp: string) => {
        if(username == this.adminUsername) {
            if(await bcrypt.compare(password, this.adminPasswordHash!)) {
                try {
                    return authenticator.check(totp, this.adminTotpKey)
                } catch(err: any) {
                    console.log("Error:", err)
                }
            }
        }
    
        return false
    }
    
    isUser = async (username: string, password: string, totp: string, users: any) => {
        for(let i = 0; i < users.length; i++) {
            if(users[i].username == username) {
                if(await bcrypt.compare(password, users[i].hash)) {
                    try {
                        const totpKey = this.cryptr.decrypt(users[i].totpKey)
                        return authenticator.check(totp, totpKey)
                    } catch(err: any) {
                        console.log("Error:", err)
                    }
                } else {
                    return false
                }
            }
        }
    
        return false
    }
    
    getJWTToken = (username: string, isAdmin: boolean = false) => {
        return jwt.sign({
            username,
            isAdmin
        }, this.jwtTokenKey!, {
            expiresIn: "15m"
        })
    }
}