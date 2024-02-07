import { CouponService } from '../CouponService/couponService'
import { MainnetCheckService } from '../mainnetCheckService'
import { checkMainnetBalance } from './mainnetBalanceCheck'

export enum PIPELINE_CHECKS {
    MAINNET_BALANCE = 'mainnet_check',
    COUPON = 'coupon_check'
}

export type PipelineCheckValidity = {
    isValid: boolean,
    checkPassedType?: PIPELINE_CHECKS,
    errorMessage?: string,
    dripAmount: number,
    mainnetBalance?: number,
}

export function pipelineFailureMessage(mainnetBalanceCheckEnabled: boolean | string, couponCheckEnabled: boolean): string {
    if (mainnetBalanceCheckEnabled && couponCheckEnabled) {
        return "Either mainnet balance or a valid coupon is required!"
    } else if (mainnetBalanceCheckEnabled) {
        return "Mainnet balance is required!"
    } else if (couponCheckEnabled) {
        return "A valid coupon is required!"
    }

    return ""
}

export async function checkCouponPipeline(
    couponService: CouponService,
    pipelineCheckValidity: PipelineCheckValidity,
    faucetConfigId: string,
    coupon?: string,
) {
    // if coupon is required but not passed in request
    if (coupon === undefined) {
        return
    }

    const couponValidity = await couponService.consumeCouponAmount(coupon, faucetConfigId, pipelineCheckValidity.dripAmount)
    if (!couponValidity.isValid) {
        pipelineCheckValidity.errorMessage = "Invalid or expired coupon provided. Contact support team on Discord! "
        return
    } else {
        pipelineCheckValidity.isValid = true
        pipelineCheckValidity.dripAmount = couponValidity.amount
        pipelineCheckValidity.checkPassedType = PIPELINE_CHECKS.COUPON
    }
}

export async function checkMainnetBalancePipeline(
    mainnetCheckService: MainnetCheckService,
    pipelineCheckValidity: PipelineCheckValidity,
    rpc: string,
    address: string,
) {
    const {isValid, balance} = await checkMainnetBalance(rpc, address)
    if (isValid) {
        if (await mainnetCheckService.checkAddressValidity(address)) {
            pipelineCheckValidity.isValid = true
            pipelineCheckValidity.checkPassedType = PIPELINE_CHECKS.MAINNET_BALANCE
            pipelineCheckValidity.mainnetBalance = balance
        } else {
            pipelineCheckValidity.errorMessage = "Address has exhausted maximum balance checks! Please do some mainnet transactinos."
        }
    } else {
        pipelineCheckValidity.errorMessage = "Mainnet balance check failed! " 
    }
}
