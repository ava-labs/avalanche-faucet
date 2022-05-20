import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { RateLimiterConfig } from '../types';

export class RateLimiter {
    PATH: string;

    constructor(app: any, configs: RateLimiterConfig[]) {
        this.PATH = configs[0].RATELIMIT.PATH || '/api/sendToken';

        let rateLimiters: any = new Map()
        configs.forEach((config: any) => {
            const { RATELIMIT } = config;

            let RL_CONFIG = {
                MAX_LIMIT: RATELIMIT.MAX_LIMIT,
                WINDOW_SIZE: RATELIMIT.WINDOW_SIZE,
                SKIP_FAILED_REQUESTS: RATELIMIT.SKIP_FAILED_REQUESTS || true,
            }
            
            rateLimiters.set(config.ID, this.getLimiter(RL_CONFIG));

            if(RATELIMIT.REVERSE_PROXIES) {
                app.set('trust proxy', RATELIMIT.REVERSE_PROXIES);
            }
        });

        app.use(this.PATH, (req: any, res: any, next: any) => {
            if(this.PATH == '/api/sendToken' && req.body.chain) {
                return rateLimiters.get(req.body.chain)(req, res, next)
            } else {
                return rateLimiters.get(configs[0].ID)(req, res, next)
            }
        });
    }

    getLimiter(config: any): RateLimitRequestHandler {
        const limiter = rateLimit({
            windowMs: config.WINDOW_SIZE * 60 * 1000,
            max: config.MAX_LIMIT,
            standardHeaders: true,
            legacyHeaders: false,
            skipFailedRequests: config.SKIP_FAILED_REQUESTS,
            message: {
                message: `Too many requests. Please try again after ${config.WINDOW_SIZE} minutes`
            },
            keyGenerator: (req, res) => {
                return req.ip + req.body?.chain
            }
        });

        return limiter;
    }
}