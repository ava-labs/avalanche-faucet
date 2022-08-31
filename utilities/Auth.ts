import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export class Auth {
    adminUsername: string
    passwordHash: string
    jwtTokenKey: string

    constructor(ADMIN_USERNAME: string, ADMIN_PASSWORD_HASH: string, JWT_TOKEN_KEY: string) {
        this.adminUsername = ADMIN_USERNAME
        this.passwordHash = ADMIN_PASSWORD_HASH
        this.jwtTokenKey = JWT_TOKEN_KEY
    }

    getAuthorizedToken = async (username: string, password: string, isAdmin: boolean = false) => {
        let token = undefined
    
        if(isAdmin && await this.isAdminUser(username, password)) {
            token = this.getJWTToken(username, true)
        } else if(await this.isUser(username, password)) {
            token = this.getJWTToken(username)
        }
    
        return token
    }

    auth = (req: any, res: any, next: any) => {
        const token = req.body.token || req.query.token || req.headers["x-access-token"]
    
        if (!token) {
            return res.status(403).send("A token is required for authentication");
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY!);
        } catch (err) {
            return res.status(401).send("Invalid Token:" + err);
        }
        
        return next();
    }

    isAdminUser = async (username: string, password: string) => {
        if(username == this.adminUsername) {
            if(await bcrypt.compare(password, this.passwordHash!)) {
                return true
            }
        }
    
        return false
    }
    
    isUser = async (username: string, password: string) => {
        let users = [
            {
                username: "test",
                password: "abc123"
            }
        ]
    
        for(let i = 0; i < users.length; i++) {
            if(users[i].username == username) {
                if(await bcrypt.compare(password, users[i].password)) {
                    return true
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