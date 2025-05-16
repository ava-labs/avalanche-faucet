import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit'
import { searchIP } from 'range_check'
import { RateLimiterConfig } from '../types'
import { CouponService } from '../CouponService/couponService'

export class RateLimiter {
    PATH: string
    type: 'ip' | 'wallet' | 'global'

    constructor(
        app: any,
        configs: RateLimiterConfig[],
        type: 'ip' | 'wallet' | 'global',
        couponService: CouponService,
        keyGenerator?: any,
    ) {
        this.PATH = configs[0].RATELIMIT.PATH || '/api/sendToken'
        this.type = type

        let rateLimiters: any = new Map()
        configs.forEach((config: any) => {
            const { RATELIMIT } = config

            let RL_CONFIG = {
                MAX_LIMIT: RATELIMIT.MAX_LIMIT,
                WINDOW_SIZE: RATELIMIT.WINDOW_SIZE,
                SKIP_FAILED_REQUESTS: RATELIMIT.SKIP_FAILED_REQUESTS || true,
            }
            
            rateLimiters.set(config.ID, this.getLimiter(RL_CONFIG, keyGenerator))
        })

        if(configs[0]?.RATELIMIT?.REVERSE_PROXIES) {
            app.set('trust proxy', configs[0]?.RATELIMIT?.REVERSE_PROXIES)
        }

        app.use(this.PATH, (req: any, res: any, next: any) => {
            // skip rate limit based on coupon - coupon limit verification is done in the request handler
            const couponId = req.body?.couponId
            if (couponId) {
                const coupon = couponService.getCoupon(couponId)
                if (this.type === 'ip' && coupon && coupon.skipIpRateLimit) {
                    return next()
                } else if (this.type === 'wallet' && coupon && coupon.skipWalletRateLimit) {
                    return next()
                }
            }

            if(this.PATH == '/api/sendToken' && req.body.chain) {
                return rateLimiters.get(req.body.erc20 ? req.body.erc20 : req.body.chain)(req, res, next)
            } else {
                return rateLimiters.get(configs[0].ID)(req, res, next)
            }
        })
    }

    getLimiter(config: any, keyGenerator?: any): RateLimitRequestHandler {
        const limiter = rateLimit({
            windowMs: config.WINDOW_SIZE * 60 * 1000,
            max: config.MAX_LIMIT,
            standardHeaders: true,
            legacyHeaders: false,
            skipFailedRequests: config.SKIP_FAILED_REQUESTS,
            message: {
                message: `Too many requests. Please try again after ${config.WINDOW_SIZE} minutes`
            },
            keyGenerator: keyGenerator ? keyGenerator : (req, res) => {
                const ip = this.getIP(req)
                if(ip != null) {
                    return ip
                }
            }
        })

        return limiter
    }

    getIP(req: any) {
        const ip = req.headers['cf-connecting-ip'] || req.ip
        return searchIP(ip)
    }
}