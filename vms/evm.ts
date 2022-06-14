import { BN } from 'avalanche';
import Web3 from 'web3';
import Log from './Log';
import ERC20Interface from './ERC20Interface.json';

import { ChainType, SendTokenResponse, RequestType } from './evmTypes';

export default class EVM {
    web3: any;
    account: any;
    NAME: string;
    DRIP_AMOUNT: number | BN;
    LEGACY: boolean;
    MAX_PRIORITY_FEE: string;
    MAX_FEE: string;
    RECALIBRATE: number;
    hasNonce: Map<string, number | undefined>;
    pendingTxNonces: Set<unknown>;
    hasError: Map<string, string | undefined>;
    nonce: number;
    balance: any;
    isFetched: boolean;
    isUpdating: boolean;
    recalibrate: boolean;
    waitingForRecalibration: boolean;
    waitArr: any[];
    queue: any[];
    error: boolean;
    log: Log;
    contracts: any;

    constructor(config: ChainType, PK: string | undefined) {
        this.web3 = new Web3(config.RPC);
        this.account = this.web3.eth.accounts.privateKeyToAccount(PK);
        this.contracts = new Map();

        this.NAME = config.NAME;
        this.DRIP_AMOUNT = (new BN(config.DRIP_AMOUNT)).mul(new BN(1e9));
        this.MAX_PRIORITY_FEE = config.MAX_PRIORITY_FEE;
        this.MAX_FEE = config.MAX_FEE;
        this.RECALIBRATE = config.RECALIBRATE || 30;
        this.LEGACY = false;

        this.log = new Log(this.NAME)

        this.hasNonce = new Map();
        this.hasError = new Map();
        this.pendingTxNonces = new Set();

        this.nonce = -1;
        this.balance = new BN(0);

        this.isFetched = false;
        this.isUpdating = false;
        this.recalibrate = false;
        this.waitingForRecalibration = false;

        this.waitArr = [];
        this.queue = [];

        this.error = false;

        this.setupTransactionType();
        this.recalibrateNonceAndBalance();

        setInterval(() => {
            this.recalibrateNonceAndBalance();
        }, this.RECALIBRATE * 1000);
    }

    // Setup Legacy or EIP1559 transaction type
    async setupTransactionType(): Promise<void> {
        try {
            const baseFee = (await this.web3.eth.getBlock('latest')).baseFeePerGas
            if(baseFee == undefined) {
                this.LEGACY = true;
            }
            this.error = false;
        } catch(err: any) {
            this.error = true;
            this.log.error(err.message);
        }
    }

    // Function to issue transfer transaction. For ERC20 transfers, id will be string
    async sendToken(
        receiver: string,
        id: string | undefined,
        cb: (param: SendTokenResponse) => void
    ): Promise<void> {
        if(this.error) {
            cb({ status: 400, message: "Internal RPC error! Please try after sometime"});
            return;
        }

        if (!this.web3.utils.isAddress(receiver)) {
            cb({ status: 400, message: "Invalid address! Please try again." });
            return;
        }

        let amount: BN | number = this.DRIP_AMOUNT;

        // If id is provided, then it is ERC20 token transfer, so update the amount
        if(this.contracts.get(id)) {
            const dripAmount: number = this.contracts.get(id).config.DRIP_AMOUNT;
            if(dripAmount) {
                amount = (new BN(dripAmount)).mul(new BN(1e9))
            }
        }

        this.processRequest({ receiver, amount, id });

        // After transaction is being processed, the nonce will be available and txHash can be returned to user
        const waitingForNonce = setInterval(async () => {
            if (this.hasNonce.get(receiver+id) != undefined) {
                clearInterval(waitingForNonce);
                
                const nonce: number | undefined = this.hasNonce.get(receiver + id);
                this.hasNonce.set(receiver + id, undefined);
                
                const { txHash } = await this.getTransaction(receiver, amount, nonce, id);
                
                if(txHash) {
                    cb({
                        status: 200,
                        message: `Transaction successful on ${this.NAME}!`,
                        txHash
                    });
                } else {
                    cb({
                        status: 400,
                        message: `Transaction failed on ${this.NAME}! Please try again.`
                    });
                }
            } else if(this.hasError.get(receiver) != undefined) {
                clearInterval(waitingForNonce);
                
                const errorMessage = this.hasError.get(receiver)!;
                this.hasError.set(receiver, undefined);
                
                cb({
                    status: 400,
                    message: errorMessage
                })
            }
        }, 300);
    }

    async processRequest(req: RequestType): Promise<void> {
        if (!this.isFetched || this.recalibrate || this.waitingForRecalibration) {
            this.waitArr.push(req);
            if (!this.isUpdating && !this.waitingForRecalibration) {
                await this.updateNonceAndBalance();
            }
        } else {
            this.putInQueue(req);
        }
    }

    getBalance(id?: string): BN {
        if(id && this.contracts.get(id)) {
            return this.getERC20Balance(id);
        } else {
            return this.balance;
        }
    }

    getERC20Balance(id: string): BN {
        return this.contracts.get(id)?.balance;
    }

    async fetchERC20Balance(): Promise<void> {
        this.contracts.forEach(async (contract: any) => {
            contract.balance = new BN(await contract.methods.balanceOf(this.account.address).call());
        });
    }

    async updateNonceAndBalance(): Promise<void> {
        this.isUpdating = true;
        try {
            [this.nonce, this.balance] = await Promise.all([
                this.web3.eth.getTransactionCount(this.account.address, 'latest'),
                this.web3.eth.getBalance(this.account.address),
            ]);

            await this.fetchERC20Balance()

            this.balance = new BN(this.balance);
            
            this.error && this.log.info("RPC server recovered!")
            this.error = false; 

            this.isFetched = true;
            this.isUpdating = false;
            this.recalibrate = false;

            while(this.waitArr.length != 0) {
                this.putInQueue(this.waitArr.shift())
            }
        } catch(err: any) {
            this.isUpdating = false;
            this.error = true;
            this.log.error(err.message);
        }
    }

    balanceCheck(req: RequestType): Boolean {
        const balance: BN = this.getBalance(req.id);
        if(req.id && this.contracts.get(req.id)) {
            if(this.contracts.get(req.id).balance.gt(req.amount)) {
                this.contracts.get(req.id).balance = this.contracts.get(req.id).balance.sub(req.amount)
                return true;
            }
        } else {
            if(this.balance.gt(req.amount)) {
                this.balance = this.balance.sub(req.amount)
                return true;
            }
        }
        return false;
    }

    async putInQueue(req: RequestType): Promise<void> {
        if (this.balanceCheck(req)) {
            this.queue.push({ ...req, nonce: this.nonce });
            this.hasNonce.set(req.receiver+req.id, this.nonce);
            this.nonce++;
            this.executeQueue();
        } else {
            this.log.warn("Faucet balance too low!")
            this.hasError.set(req.receiver, "Faucet balance too low! Please try after sometime.")
        }
    }

    async executeQueue(): Promise<void> {
        const { amount, receiver, nonce, id } = this.queue.shift();
        this.sendTokenUtil(amount, receiver, nonce, id);
    }

    async sendTokenUtil(
        amount: number,
        receiver: string,
        nonce: number,
        id?: string
    ): Promise<void> {
        this.pendingTxNonces.add(nonce);
        const { rawTransaction } = await this.getTransaction(receiver, amount, nonce, id);

        try {
            const timeout = setTimeout(() => {
                this.log.error(`Timeout reached for transaction with nonce ${nonce}`)
                this.pendingTxNonces.delete(nonce);
            }, 10*1000);
            
            await this.web3.eth.sendSignedTransaction(rawTransaction);
            this.pendingTxNonces.delete(nonce);
            
            clearTimeout(timeout)
        } catch (err: any) {
            this.pendingTxNonces.delete(nonce);
            this.log.error(err.message);
        }
    }

    async getTransaction(
        to: string,
        value: BN | number,
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
            value
        };

        if(this.LEGACY) {
            delete tx["maxPriorityFeePerGas"];
            delete tx["maxFeePerGas"];
            tx.gasPrice = await this.getAdjustedGasPrice();
            tx.type = 0;
        }

        if(id) {
            const txObject = this.contracts.get(id)?.methods.transfer(to, value);
            tx.data = txObject.encodeABI();
            tx.value = 0;
            tx.to = this.contracts.get(id)?.config.CONTRACTADDRESS;
            tx.gas = this.contracts.get(id)?.config.GASLIMIT;
        }

        let signedTx;
        try {
            signedTx = await this.account.signTransaction(tx);
        } catch(err: any) {
            this.error = true;
            this.log.error(err.message);
        }
        const txHash = signedTx?.transactionHash;
        const rawTransaction = signedTx?.rawTransaction;

        return { txHash, rawTransaction };
    }

    async getGasPrice(): Promise<number> {
        return this.web3.eth.getGasPrice();
    }

    async getAdjustedGasPrice(): Promise<number> {
        try {
            const gasPrice: number = await this.getGasPrice()
            const adjustedGas: number = Math.floor(gasPrice * 1.25)
            return Math.min(adjustedGas, parseInt(this.MAX_FEE))
        } catch(err: any) {
            this.error = true;
            this.log.error(err.message);
            return 0;
        }
    }

    async recalibrateNonceAndBalance(): Promise<void> {
        this.waitingForRecalibration = true;

        if (this.pendingTxNonces.size === 0 && this.isUpdating === false) {
            this.isFetched = false;
            this.recalibrate = true;
            this.waitingForRecalibration = false;
            this.pendingTxNonces.clear();

            this.updateNonceAndBalance();
        } else {
            const recalibrateNow = setInterval(() => {
                if(this.pendingTxNonces.size === 0 && this.isUpdating === false) {
                    clearInterval(recalibrateNow);
                    this.waitingForRecalibration = false;
                    this.recalibrateNonceAndBalance();
                }
            }, 300)
        }
    }

    async addERC20Contract(config: any) {
        this.contracts.set(config.ID, {
            methods: (new this.web3.eth.Contract(ERC20Interface, config.CONTRACTADDRESS)).methods,
            balance: 0,
            config
        })
    }
}