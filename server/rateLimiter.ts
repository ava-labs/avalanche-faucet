import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { RateLimiterConfig } from './types';

export default class RateLimiter {
    REVERSE_PROXIES: number;
    MAX_LIMIT: number;
    WINDOW_SIZE: number;
    PATH: string;
    SKIP_FAILED_REQUESTS: boolean;

    constructor(app: any, config: RateLimiterConfig) {
        this.REVERSE_PROXIES = config.REVERSE_PROXIES;
        this.MAX_LIMIT = config.MAX_LIMIT;
        this.WINDOW_SIZE = config.WINDOW_SIZE;
        this.PATH = config.PATH;
        this.SKIP_FAILED_REQUESTS = config.SKIP_FAILED_REQUESTS || false

        app.set('trust proxy', this.REVERSE_PROXIES);
        app.use(this.PATH, this.getLimiter());
    }

    getLimiter(): RateLimitRequestHandler {
        const limiter = rateLimit({
            windowMs: this.WINDOW_SIZE * 60 * 1000,
            max: this.MAX_LIMIT,
            standardHeaders: true,
            legacyHeaders: false,
            skipFailedRequests: this.SKIP_FAILED_REQUESTS,
            message: {
                message: `Too many requests. Please try again after ${this.WINDOW_SIZE} minutes`
            }
        });

        return limiter;
    }
}