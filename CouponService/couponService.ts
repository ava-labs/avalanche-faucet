import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { Mutex, MutexInterface } from 'async-mutex'
import { CouponValidity } from "../types"

type Coupon = {
    id: string,
    faucetConfigId: string,
    maxLimitAmount: number,
    consumedAmount: number,
    expiry: number,
    amountPerCoupon: number,
    reset: boolean,
}

type CouponConfig = {
    IS_ENABLED: boolean,
    MAX_LIMIT_CAP: number,
}

function validateCouponData(coupon: any, couponConfig: CouponConfig): Coupon | undefined {
    if (
        coupon.id &&
        coupon.faucetConfigId &&
        coupon.maxLimitAmount > 0 &&
        coupon.maxLimitAmount <= couponConfig.MAX_LIMIT_CAP &&
        coupon.consumedAmount <= coupon.maxLimitAmount &&
        coupon.expiry > 0
    ) {
        return coupon
    }

    return undefined
}

export class CouponService {
    private readonly mutex: MutexInterface
    private readonly documentClient?: DynamoDBDocumentClient
    private readonly couponConfig: CouponConfig
    coupons: Map<string, Coupon>

    constructor(couponConfig: CouponConfig) {
        this.mutex = new Mutex()
        this.coupons = new Map<string, Coupon>()
        this.couponConfig = couponConfig

        // Return early if coupon system is disabled
        if (!couponConfig.IS_ENABLED) return

        const ddbClient = new DynamoDBClient({ region: 'us-east-1' })
        this.documentClient = DynamoDBDocumentClient.from(ddbClient)

        this.syncCoupons()

        // Syncs coupon between DynamoDB and memory at regular intervals
        setInterval(() => {
            this.syncCoupons()
        }, 10_000)
    }

    /**
     * Syncs coupons in memory with database
     * 1. Fetches new coupons from database into memory
     * 2. Remove coupons which were deleted in database from memory
     * 3. Updates coupon usage limits in database
     * 4. TODO(raj): Delete expired (or few days after expiry) coupons from database
     */
    private async syncCoupons(): Promise<void> {
        const params = new ScanCommand({
            TableName: 'coupons',
        })
    
        const result = await this.documentClient?.send(params)

        // Required for quick lookup of coupons in DB fetched list
        const dbItemSet = new Set<string>()
    
        // Fetches new coupons from database into memory
        result?.Items?.forEach((item: Record<string, any>) => {
            const coupon: Coupon | undefined = validateCouponData(item, this.couponConfig)
            if (coupon) {
                dbItemSet.add(coupon.id)

                // Only load new coupons into memory
                if (this.coupons.get(coupon.id) === undefined || coupon.reset) {
                    coupon.reset = false
                    this.coupons.set(coupon.id, coupon)
                }
            } else {
                console.log("fetched invalid coupon data:", item)
            }
        })

        // Remove coupons which were deleted in database from memory
        for (const [id, _item] of this.coupons.entries()) {
            if (!dbItemSet.has(id)) {
                this.coupons.delete(id)
            }
        }

        // Updates coupon usage limits in database
        await this.batchUpdateCoupons()
    }

    // Iterates over every coupon in memory and updates database with their `consumedAmount`
    async batchUpdateCoupons(): Promise<void> {
        this.coupons.forEach(async (couponItem, _id) => {
            const updateRequest = {
                TableName: 'coupons',
                Key: {
                    id: couponItem.id,
                },
                UpdateExpression: 'SET consumedAmount = :consumedAmount',
                ExpressionAttributeValues: {
                    ':consumedAmount': couponItem.consumedAmount,
                },
            }

            const params = new UpdateCommand(updateRequest)
            await this.documentClient?.send(params)
        })
    }  

    async consumeCouponAmount(id: string, faucetConfigId: string, amount: number): Promise<CouponValidity> {
        // Return `true` early, if coupon system is disabled (for debugging)
        if (!this.couponConfig.IS_ENABLED) return { isValid: true, amount }

        const release = await this.mutex.acquire()
        try {
            const coupon = this.coupons.get(id)
            const couponAmount = coupon?.amountPerCoupon ?? amount
            if (
                coupon &&
                coupon.faucetConfigId === faucetConfigId &&
                coupon.expiry > (Date.now() / 1000) &&
                coupon.consumedAmount + couponAmount < coupon.maxLimitAmount
            ) {
                coupon.consumedAmount += couponAmount
                return { isValid: true, amount: couponAmount}
            }
            return { isValid: false, amount: couponAmount}
        } finally {
            release()
        }
    }

    async reclaimCouponAmount(id: string, amount: number): Promise<void> {
        const release = await this.mutex.acquire()

        try {
            const coupon = this.coupons.get(id)
            if (
                coupon &&
                coupon.expiry > (Date.now() / 1000) &&
                coupon.consumedAmount - amount > 0
            ) {
                coupon.consumedAmount -= amount
            }
        } finally {
            release()
        }
    }
}