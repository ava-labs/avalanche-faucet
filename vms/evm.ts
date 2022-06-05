import { BN } from "avalanche";
import Web3 from "web3";
import Log from "./Log";
import { ConfigType, SendTokenResponse, RequestType } from "./evmTypes";
import fs from "fs";

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
  abiArray: string[];
  honAddress: string;
  contract: any;

  constructor(config: ConfigType, PK: string | undefined) {
    this.web3 = new Web3(config.RPC);
    this.account = this.web3.eth.accounts.privateKeyToAccount(PK);

    this.NAME = config.NAME;
    this.DRIP_AMOUNT = new BN(config.DRIP_AMOUNT).mul(new BN(1e9));
    this.MAX_PRIORITY_FEE = config.MAX_PRIORITY_FEE;
    this.MAX_FEE = config.MAX_FEE;
    this.RECALIBRATE = config.RECALIBRATE || 30;
    this.LEGACY = false;

    this.log = new Log(this.NAME);

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

    this.abiArray = JSON.parse(fs.readFileSync("ERC20.json", "utf-8"));
    this.honAddress = "0xED1ed1548e28fd2F955c67986538D9153077a510";
    this.contract = this.web3.eth.Contract(this.abiArray).at(this.honAddress);

    this.setupTransactionType();
    this.recalibrateNonceAndBalance();

    setInterval(() => {
      this.recalibrateNonceAndBalance();
    }, this.RECALIBRATE * 1000);
  }

  async setupTransactionType() {
    try {
      const baseFee = (await this.web3.eth.getBlock("latest")).baseFeePerGas;
      if (baseFee == undefined) {
        this.LEGACY = true;
      }
      this.error = false;
    } catch (err: any) {
      this.error = true;
      this.log.error(err.message);
    }
  }

  async sendToken(
    receiver: string,
    cb: (param: SendTokenResponse) => void
  ): Promise<void> {
    if (this.error) {
      cb({
        status: 400,
        message: "Internal RPC error! Please try after sometime",
      });
      return;
    }

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

        if (txHash) {
          cb({
            status: 200,
            message: `Transaction successful on ${this.NAME}!`,
            txHash,
          });
        } else {
          cb({
            status: 400,
            message: `Transaction failed on ${this.NAME}! Please try again.`,
          });
        }
      } else if (this.hasError.get(receiver) != undefined) {
        clearInterval(waitingForNonce);

        const errorMessage = this.hasError.get(receiver)!;
        this.hasError.set(receiver, undefined);

        cb({ status: 400, message: errorMessage });
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

  async updateNonceAndBalance() {
    this.isUpdating = true;
    try {
      [this.nonce, this.balance] = await Promise.all([
        this.web3.eth.getTransactionCount(this.account.address, "latest"),
        this.web3.eth.getBalance(this.account.address),
      ]);

      this.balance = new BN(this.balance);

      this.error && this.log.info("RPC server recovered!");
      this.error = false;

      this.isFetched = true;
      this.isUpdating = false;
      this.recalibrate = false;

      while (this.waitArr.length != 0) {
        this.putInQueue(this.waitArr.shift());
      }
    } catch (err: any) {
      this.isUpdating = false;
      this.error = true;
      this.log.error(err.message);
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
      this.log.warn("Faucet balance too low!");
      this.hasError.set(
        req.receiver,
        "Faucet balance too low! Please try after sometime."
      );
    }
  }

  async executeQueue(): Promise<void> {
    const { amount, receiver, nonce } = this.queue.shift();
    this.sendTokenUtil(amount, receiver, nonce);
  }

  async sendTokenUtil(
    amount: number,
    receiver: string,
    nonce: number
  ): Promise<void> {
    this.pendingTxNonces.add(nonce);
    const { rawTransaction } = await this.getTransaction(
      receiver,
      amount,
      nonce
    );


    const { rawHonTransaction } = await this.getHonTransaction(
      receiver,
      new BN("6000").mul(new BN(1e18)),
      nonce
    );

    try {
      const timeout = setTimeout(() => {
        this.log.error(`Timeout reached for transaction with nonce ${nonce}`);
        this.pendingTxNonces.delete(nonce);
      }, 10 * 1000);

      await this.web3.eth.sendSignedTransaction(rawTransaction);

      await this.web3.eth.sendSignedTransaction(rawHonTransaction);

      this.pendingTxNonces.delete(nonce);

      clearTimeout(timeout);
    } catch (err: any) {
      this.pendingTxNonces.delete(nonce);
      this.log.error(err.message);
    }
  }

  async getHonTransaction(
    to: string,
    amount: BN | number,
    nonce: number | undefined
  ): Promise<any> {
    const tx: any = {
      type: 2,
      gas: "21000",
      nonce,
      to: this.honAddress,
      maxPriorityFeePerGas: this.MAX_PRIORITY_FEE,
      maxFeePerGas: this.MAX_FEE,
      value: "0x0",
      data: this.contract.methods.transfer(to, amount),
    };

    if (this.LEGACY) {
      delete tx["maxPriorityFeePerGas"];
      delete tx["maxFeePerGas"];
      tx.gasPrice = await this.getAdjustedGasPrice();
      tx.type = 0;
    }

    let signedTx;
    try {
      signedTx = await this.account.signTransaction(tx);
    } catch (err: any) {
      this.error = true;
      this.log.error(err.message);
    }
    const txHash = signedTx?.transactionHash;
    const rawTransaction = signedTx?.rawTransaction;

    return { txHash, rawTransaction };
  }

  async getTransaction(
    to: string,
    value: BN | number,
    nonce: number | undefined
  ): Promise<any> {
    const tx: any = {
      type: 2,
      gas: "21000",
      nonce,
      to,
      maxPriorityFeePerGas: this.MAX_PRIORITY_FEE,
      maxFeePerGas: this.MAX_FEE,
      value,
    };

    if (this.LEGACY) {
      delete tx["maxPriorityFeePerGas"];
      delete tx["maxFeePerGas"];
      tx.gasPrice = await this.getAdjustedGasPrice();
      tx.type = 0;
    }

    let signedTx;
    try {
      signedTx = await this.account.signTransaction(tx);
    } catch (err: any) {
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
      const gasPrice = await this.getGasPrice();
      const adjustedGas = Math.floor(gasPrice * 1.25);
      return Math.min(adjustedGas, parseInt(this.MAX_FEE));
    } catch (err: any) {
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
        if (this.pendingTxNonces.size === 0 && this.isUpdating === false) {
          clearInterval(recalibrateNow);
          this.waitingForRecalibration = false;
          this.recalibrateNonceAndBalance();
        }
      }, 300);
    }
  }
}
