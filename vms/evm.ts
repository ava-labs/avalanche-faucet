import Web3 from 'web3'

import { asyncCallWithTimeout, calculateBaseUnit } from './utils'
import Log from './Log'
import ERC20Interface from './ERC20Interface.json'
import { ChainType, SendTokenResponse, RequestType, ContractType, QueueType } from './evmTypes'
import { ERC20Type } from '../types'

// cannot issue tx if no. of pending requests is > 16
const MEMPOOL_LIMIT = 15

// pending tx timeout should be a function of MEMPOOL_LIMIT
const PENDING_TX_TIMEOUT = 40 * 1000 // 40 seconds

const BLOCK_FAUCET_DRIPS_TIMEOUT = 1 * 1000 // 60 seconds

export default class EVM {
    web3: Web3
    account: any
    NAME: string
    DRIP_AMOUNT: bigint
    DECIMALS: number
    LEGACY: boolean
    MAX_PRIORITY_FEE: string
    MAX_FEE: string
    RECALIBRATE: number
    hasNonce: Map<string, number | undefined>
    pendingTxNonces: Set<unknown>
    hasError: Map<string, string | undefined>
    nonce: number
    balance: bigint
    isFetched: boolean
    isUpdating: boolean
    recalibrate: boolean
    waitingForRecalibration: boolean
    waitArr: any[]
    queue: QueueType[]
    error: boolean
    log: Log
    contracts: Map<string, ContractType>
    requestCount: number
    queuingInProgress: boolean
    blockFaucetDrips: boolean
    recalibrateNowActivated: boolean

    constructor(config: ChainType, PK: string) {
        this.web3 = new Web3(config.RPC)
        this.account = this.web3.eth.accounts.privateKeyToAccount(PK)
        this.contracts = new Map()

        this.NAME = config.NAME
        this.DECIMALS = config.DECIMALS || 18
        this.DRIP_AMOUNT = calculateBaseUnit(config.DRIP_AMOUNT.toString(), this.DECIMALS)
        this.MAX_PRIORITY_FEE = config.MAX_PRIORITY_FEE
        this.MAX_FEE = config.MAX_FEE
        this.RECALIBRATE = config.RECALIBRATE || 30
        this.LEGACY = false

        this.log = new Log(this.NAME)

        this.hasNonce = new Map()
        this.hasError = new Map()
        this.pendingTxNonces = new Set()

        this.nonce = -1
        this.balance = BigInt(0)

        this.isFetched = false
        this.isUpdating = false
        this.recalibrate = false
        this.waitingForRecalibration = false
        this.queuingInProgress = false
        this.recalibrateNowActivated = false

        this.requestCount = 0
        this.waitArr = []
        this.queue = []

        this.error = false
        this.blockFaucetDrips = true

        this.setupTransactionType()
        this.recalibrateNonceAndBalance()

        setInterval(() => {
            this.recalibrateNonceAndBalance()
        }, this.RECALIBRATE * 1000)

        // just a check that requestCount is within the range (will indicate race condition)
        setInterval(() => {
            if (this.requestCount > MEMPOOL_LIMIT || this.requestCount < 0) {
                this.log.error(`request count not in range: ${this.requestCount}`)
            }
        }, 10 * 1000)

        // block requests during restart (to settle any pending txs initiated during shutdown)
        setTimeout(() => {
            this.log.info("starting faucet drips...")
            this.blockFaucetDrips = false
        }, BLOCK_FAUCET_DRIPS_TIMEOUT)
    }

    // Setup Legacy or EIP1559 transaction type
    async setupTransactionType(): Promise<void> {
        try {
            const baseFee = (await this.web3.eth.getBlock('latest')).baseFeePerGas
            if(baseFee == undefined) {
                this.LEGACY = true
            }
            this.error = false
        } catch(err: any) {
            this.error = true
            this.log.error(err.message)
        }
    }

    // Function to issue transfer transaction. For ERC20 transfers, 'id' will be a string representing ERC20 token ID
    async sendToken(
        receiver: string,
        id: string | undefined,
        customAmount: number | undefined,
        cb: (param: SendTokenResponse) => void
    ): Promise<void> {
        if(this.blockFaucetDrips) {
            cb({ status: 400, message: "Faucet is getting started! Please try after sometime"})
            return
        }

        if(this.error) {
            cb({ status: 400, message: "Internal RPC error! Please try after sometime"})
            return
        }

        if (!this.web3.utils.isAddress(receiver)) {
            cb({ status: 400, message: "Invalid address! Please try again." })
            return
        }

        // do not accept any request if mempool limit reached
        if (this.requestCount >= MEMPOOL_LIMIT) {
            cb({ status: 400, message: "High faucet usage! Please try after sometime" })
            return
        }

        // increasing request count before processing request
        this.requestCount++

        let amount = this.DRIP_AMOUNT
        let decimals = this.DECIMALS

        // If id is provided, then it is ERC20 token transfer, so update the amount
        if(id) {
            const contract = this.contracts.get(id)
            if (contract) {
                amount = contract.dripAmount
                decimals = contract.decimals
            }
        }

        // use custom amount
        if(customAmount) {
            amount = calculateBaseUnit(customAmount.toString(), decimals)
        }

        const requestId = receiver + id + Math.random().toString()

        this.processRequest({ receiver, amount, id, requestId })

        // After transaction is being processed, the nonce will be available and txHash can be returned to user
        const waitingForNonce = setInterval(async () => {
            if (this.hasNonce.get(requestId) != undefined) {
                clearInterval(waitingForNonce)
                
                const nonce: number | undefined = this.hasNonce.get(requestId)
                this.hasNonce.set(requestId, undefined)
                
                const { txHash } = await this.getTransaction(receiver, amount, nonce, id)
                
                if(txHash) {
                    cb({
                        status: 200,
                        message: `Transaction successful on ${this.NAME}!`,
                        txHash
                    })
                } else {
                    cb({
                        status: 400,
                        message: `Transaction failed on ${this.NAME}! Please try again.`
                    })
                }
            } else if(this.hasError.get(receiver) != undefined) {
                clearInterval(waitingForNonce)
                
                const errorMessage = this.hasError.get(receiver)!
                this.hasError.set(receiver, undefined)
                
                cb({
                    status: 400,
                    message: errorMessage
                })
            }
        }, 300)
    }

    /*
    * put in waiting array, if:
    * 1. balance/nonce is not fetched yet
    * 2. recalibrate in progress
    * 3. waiting for pending txs to confirm to begin recalibration
    * 
    * else put in execution queue
    */
    async processRequest(req: RequestType): Promise<void> {
        if (!this.isFetched || this.recalibrate || this.waitingForRecalibration) {
            this.waitArr.push(req)
            if (!this.isUpdating && !this.waitingForRecalibration) {
                await this.updateNonceAndBalance()
            }
        } else {
            this.putInQueue(req)
        }
    }

    getBalance(id?: string): bigint {
        if(id && this.contracts.get(id)) {
            return this.getERC20Balance(id)
        } else {
            return this.balance
        }
    }

    getERC20Balance(id: string): bigint {
        return this.contracts.get(id)?.balance ?? BigInt(0)
    }

    async fetchERC20Balance(): Promise<void> {
        this.contracts.forEach(async (contract: ContractType) => {
            contract.balance = BigInt(await contract.methods.balanceOf(this.account.address).call())
        })
    }

    async updateNonceAndBalance(): Promise<void> {
        // skip if already updating
        if (this.isUpdating) {
            return
        }

        this.isUpdating = true
        try {
            const [nonce, balance] = await Promise.all([
                this.web3.eth.getTransactionCount(this.account.address, 'latest'),
                this.web3.eth.getBalance(this.account.address),
            ])

            this.nonce = nonce
            this.balance = BigInt(balance)

            await this.fetchERC20Balance()

            this.error && this.log.info("RPC server recovered!")
            this.error = false 

            this.isFetched = true
            this.isUpdating = false
            this.recalibrate = false

            while(this.waitArr.length != 0) {
                this.putInQueue(this.waitArr.shift())
            }
        } catch(err: any) {
            this.isUpdating = false
            this.error = true
            this.log.error(err.message)
        }
    }

    balanceCheck(req: RequestType): Boolean {
        const contractId = req.id
        const amt = req.amount
        if(contractId) {
            const contract = this.contracts.get(contractId)
            if (contract) {
                if(contract.balance >= amt) {
                    contract.balance -= BigInt(amt)
                    return true
                }
            }
        } else {
            if(this.balance >= amt) {
                this.balance -= BigInt(amt)
                return true
            }
        }
        return false
    }

    /*
    * 1. pushes a request in queue with the last calculated nonce
    * 2. sets `hasNonce` corresponding to `requestId` so users receive expected tx_hash
    * 3. increments the nonce for future request
    * 4. executes the queue
    */
    async putInQueue(req: RequestType): Promise<void> {
        // this will prevent recalibration if it's started after calling putInQueue() function
        this.queuingInProgress = true

        // checking faucet balance before putting request in queue
        if (this.balanceCheck(req)) {
            this.queue.push({ ...req, nonce: this.nonce })
            this.hasNonce.set(req.requestId!, this.nonce)
            this.nonce++
            this.executeQueue()
        } else {
            this.queuingInProgress = false
            this.requestCount--
            this.log.warn("Faucet balance too low! " + req.id + " " + this.getBalance(req.id))
            this.hasError.set(req.receiver, "Faucet balance too low! Please try after sometime.")
        }
    }

    // pops the 1st request in queue, and call the utility function to issue the tx
    async executeQueue(): Promise<void> {
        const { amount, receiver, nonce, id } = this.queue.shift()!
        this.sendTokenUtil(amount, receiver, nonce, id)
    }

    async sendTokenUtil(
        amount: bigint,
        receiver: string,
        nonce: number,
        id?: string
    ): Promise<void> {
        // adding pending tx nonce in a set to prevent recalibration
        this.pendingTxNonces.add(nonce)

        // request from queue is now moved to pending txs list
        this.queuingInProgress = false

        const { rawTransaction } = await this.getTransaction(receiver, amount, nonce, id)

        /*
        * [CRITICAL]
        * If a issued tx fails/timed-out, all succeeding nonce will stuck
        * and we need to cancel/re-issue the tx with higher fee.
        */
        try {
            /*
            * asyncCallWithTimeout function can return
            * 1. successful response
            * 2. throw API error (will be caught by catch block)
            * 3. throw timeout error (will be caught by catch block)
            */
            await asyncCallWithTimeout(
                this.web3.eth.sendSignedTransaction(rawTransaction),
                PENDING_TX_TIMEOUT,
                `Timeout reached for transaction with nonce ${nonce}`,
            )
        } catch (err: any) {
            this.log.error(err.message)
        } finally {
            this.pendingTxNonces.delete(nonce)
            this.requestCount--
        }
    }

    async getTransaction(
        to: string,
        value: bigint,
        nonce: number | undefined,
        id?: string
    ): Promise<any> {
        const tx: any = {
            type: 2,
            gas: "21000",
            nonce,
            to,
            maxPriorityFeePerGas: this.MAX_PRIORITY_FEE,
            maxFeePerGas: this.MAX_FEE,
            value: value.toString()
        }

        if(this.LEGACY) {
            delete tx["maxPriorityFeePerGas"]
            delete tx["maxFeePerGas"]
            tx.gasPrice = await this.getAdjustedGasPrice()
            tx.type = 0
        }


        if(id) {
            const contract = this.contracts.get(id)
            if (contract) {
                const txObject = contract.methods.transfer(to, value.toString())
                tx.data = txObject.encodeABI()
                tx.value = 0
                tx.to = contract.config.CONTRACTADDRESS
                tx.gas = contract.config.GASLIMIT
            }
        }

        let signedTx
        try {
            signedTx = await this.account.signTransaction(tx)
        } catch(err: any) {
            this.error = true
            this.log.error(err.message)
        }
        const txHash = signedTx?.transactionHash
        const rawTransaction = signedTx?.rawTransaction

        return { txHash, rawTransaction }
    }

    async getGasPrice(): Promise<string> {
        return this.web3.eth.getGasPrice()
    }

    // get expected price from the network for legacy txs
    async getAdjustedGasPrice(): Promise<number> {
        try {
            const gasPrice: number = parseInt(await this.getGasPrice())
            const adjustedGas: number = Math.floor(gasPrice * 1.25)
            return Math.min(adjustedGas, parseInt(this.MAX_FEE))
        } catch(err: any) {
            this.error = true
            this.log.error(err.message)
            return 0
        }
    }

    /*
    * This function will trigger the re-calibration of nonce and balance.
    * 1. Sets `waitingForRecalibration` to `true`.
    * 2. Will not trigger re-calibration if:
    *   a. any txs are pending
    *   b. nonce or balance are already getting updated
    *   c. any request is being queued up for execution
    * 3. Checks at regular interval, when all the above conditions are suitable for re-calibration
    * 4. Keeps any new incoming request into `waitArr` until nonce and balance are updated
    */
    async recalibrateNonceAndBalance(): Promise<void> {
        this.waitingForRecalibration = true

        if (this.pendingTxNonces.size === 0 && this.isUpdating === false && this.queuingInProgress === false) {
            this.isFetched = false
            this.recalibrate = true
            this.waitingForRecalibration = false
            this.pendingTxNonces.clear()

            this.updateNonceAndBalance()
        } else if (this.recalibrateNowActivated === false) {
            const recalibrateNow = setInterval(() => {
                this.recalibrateNowActivated = true

                if(this.pendingTxNonces.size === 0 && this.isUpdating === false && this.queuingInProgress === false) {
                    clearInterval(recalibrateNow)
                    this.recalibrateNowActivated = false
                    this.waitingForRecalibration = false
                    this.recalibrateNonceAndBalance()
                }
            }, 300)
        }
    }

    async addERC20Contract(config: ERC20Type) {
        this.contracts.set(config.ID, {
            methods: (new this.web3.eth.Contract(JSON.parse(JSON.stringify(ERC20Interface)), config.CONTRACTADDRESS)).methods,
            balance: BigInt(0),
            config,
            dripAmount: calculateBaseUnit(config.DRIP_AMOUNT.toString(), config.DECIMALS || 18),
            decimals: config.DECIMALS || 18,
        })
    }

    getFaucetUsage(): number {
        return 100 * (this.requestCount / MEMPOOL_LIMIT)
    }
}