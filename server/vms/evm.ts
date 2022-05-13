import { BN } from 'avalanche';
import Web3 from 'web3';
import { ConfigType, SendTokenResponse, RequestType } from './evmTypes';

export default class EVM {
    web3: any;
    account: any;
    DRIP_AMOUNT: number | BN;
    MAX_PRIORITY_FEE: string;
    MAX_FEE: string;
    hasNonce: Map<string, number | undefined>;
    pendingTxNonces: Set<unknown>;
    hasError: Map<string, string | undefined>;
    nonce: number;
    balance: any;
    isFetched: boolean;
    isUpdating: boolean;
    recaliber: boolean;
    waitingForRecaliber: boolean;
    waitArr: any[];
    queue: any[];

    constructor(config: ConfigType, PK: string | undefined) {
        this.web3 = new Web3(config.RPC);
        this.account = this.web3.eth.accounts.privateKeyToAccount(PK);

        this.DRIP_AMOUNT = (new BN(config.DRIP_AMOUNT)).mul(new BN(1e9));
        this.MAX_PRIORITY_FEE = config.MAX_PRIORITY_FEE;
        this.MAX_FEE = config.MAX_FEE;

        this.hasNonce = new Map();
        this.hasError = new Map();
        this.pendingTxNonces = new Set();

        this.nonce = -1;
        this.balance = new BN(0);

        this.isFetched = false;
        this.isUpdating = false;
        this.recaliber = false;
        this.waitingForRecaliber = false;

        this.waitArr = [];
        this.queue = [];

        setInterval(() => {
            this.recaliberNonceAndBalance();
        }, 60 * 60 * 1000);
    }

    async sendToken(receiver: string, cb: (param: SendTokenResponse) => void): Promise<void> {
        if (!this.web3.utils.isAddress(receiver)) {
            cb({ status: 400, message: "Invalid address! Please try again." });
            return;
        }

        const amount: BN | number = this.DRIP_AMOUNT;

        this.processRequest({ receiver, amount });

        const waitingForNonce = setInterval(async () => {
            if (this.hasNonce.get(receiver) != undefined) {
                clearInterval(waitingForNonce);
                const nonce = this.hasNonce.get(receiver);
                this.hasNonce.set(receiver, undefined);
                const { txHash } = await this.getTransaction(receiver, amount, nonce);
                cb({ status: 200, message: "Transaction successful!", txHash });
            } else if(this.hasError.get(receiver) != undefined) {
                clearInterval(waitingForNonce);
                const errorMessage = this.hasError.get(receiver)!;
                this.hasError.set(receiver, undefined);
                cb({ status: 400, message: errorMessage })
            }
        }, 300);
    }

    async processRequest(req: RequestType): Promise<void> {
        if (!this.isFetched || this.recaliber || this.waitingForRecaliber) {
            this.waitArr.push(req);
            if (!this.isUpdating && !this.waitingForRecaliber) {
                await this.updateNonceAndBalance();
            }
        } else {
            this.putInQueue(req);
        }
    }

    async updateNonceAndBalance() {
        this.isUpdating = true;
        this.nonce = await this.web3.eth.getTransactionCount(this.account.address, 'latest');
        this.balance = new BN(await this.web3.eth.getBalance(this.account.address));
        this.isFetched = true;
        this.isUpdating = false;

        while(this.waitArr.length != 0) {
            this.putInQueue(this.waitArr.shift())
        }
    }

    async putInQueue(req: RequestType): Promise<void> {
        if (this.balance.gt(req.amount)) {
            this.queue.push({ ...req, nonce: this.nonce });
            this.hasNonce.set(req.receiver, this.nonce);
            this.nonce++;
            this.balance = this.balance.sub(req.amount);
            this.executeQueue();
        } else {
            console.log("Error: Faucet balance too low!");
            this.hasError.set(req.receiver, "Faucet balance too low! Please try after sometime.")
        }
    }

    async executeQueue(): Promise<void> {
        const { amount, receiver, nonce } = this.queue.shift();
        this.sendTokenUtil(amount, receiver, nonce);
    }

    async sendTokenUtil(amount: number, receiver: string, nonce: number): Promise<void> {
        this.pendingTxNonces.add(nonce);
        const { rawTransaction } = await this.getTransaction(receiver, amount, nonce);

        try {
            await this.web3.eth.sendSignedTransaction(rawTransaction);
            this.pendingTxNonces.delete(nonce);
        } catch (err: any) {
            console.log(err.message);
            console.log(`Error with nonce ${nonce}`);
        }
    }

    async getTransaction(to: string, value: BN | number, nonce: number | undefined): Promise<any> {
        const tx: any = {
            type: 2,
            gas: "21000",
            nonce,
            to,
            maxPriorityFeePerGas: this.MAX_PRIORITY_FEE,
            maxFeePerGas: this.MAX_FEE,
            value
        };

        const signedTx = await this.account.signTransaction(tx);
        const txHash = signedTx.transactionHash;
        const rawTransaction = signedTx.rawTransaction;

        return { txHash, rawTransaction };
    }

    async recaliberNonceAndBalance(): Promise<void> {
        this.waitingForRecaliber = true;

        if (this.pendingTxNonces.size === 0 && this.isUpdating === false) {
            this.isFetched = false;
            this.recaliber = true;
            this.waitingForRecaliber = false;
            this.pendingTxNonces.clear();
            this.updateNonceAndBalance();
        } else {
            const recaliberNow = setInterval(() => {
                if(this.pendingTxNonces.size === 0 && this.isUpdating === false) {
                    clearInterval(recaliberNow);
                    this.waitingForRecaliber = false;
                    this.recaliberNonceAndBalance();
                }
            }, 300)
        }
    }
}