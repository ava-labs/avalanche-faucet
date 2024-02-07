import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { getNonce } from "./utils/mainnetBalanceCheck";

const MAINNET_CHECK_TRACKER_TABLE = "mainnet_check_tracker";
const MAX_ADDRESS_CHECK_COUNT = 3;

type AddressStatus = {
    checkCount: number,
    lastUsedNonce: number,
}

export class MainnetCheckService {
    private readonly documentClient: DynamoDBDocumentClient
    private readonly RPC: string

    constructor(rpc: string) {
        const ddbClient = new DynamoDBClient({ region: 'us-east-1' })
        this.documentClient = DynamoDBDocumentClient.from(ddbClient)
        this.RPC = rpc
    }

    /**
     * 1. Get check count and last used nonce (address status)
     * 2. If checkCount < MAX_ADDRESS_CHECK_COUNT:
     *    a. Asynchronously increment check count and update nonce
     *    b. Return success
     * 3. If checkCount == MAX_ADDRESS_CHECK_COUNT
     *    a. Fetch current nonce from network, and last used nonce from DB
     *    b. diff = currentNonce - lastUsedNonce
     *    c. If diff > 0
     *       i. checkCount = max(0, checkCount - diff)
     *      ii. asynchronously update address status
     *     iii. return success
     *    d. If diff == 0
     *       i. fail
     */
    async checkAddressValidity(address: string): Promise<boolean> {
        let addressStatus = await this.getAddressStatus(address)
        if (!addressStatus) {
            // update address status
            addressStatus = await this.updateAddressStatus(address)
        }

        if (addressStatus.checkCount < MAX_ADDRESS_CHECK_COUNT) {
            this.updateAddressStatus(address, ++addressStatus.checkCount, addressStatus.lastUsedNonce)
            return true
        } else {
            const currentNonce = await getNonce(this.RPC, address)
            if (!currentNonce) {
                throw "Error fetching nonce..."
            }
            const diff = currentNonce - addressStatus.lastUsedNonce
            if (diff > 0) {
                const updatedCheckCount = Math.max(0, addressStatus.checkCount - diff) + 1
                this.updateAddressStatus(address, updatedCheckCount, currentNonce)
                return true
            } else {
                return false
            }
        }
    }

    // Utility

    async getAddressStatus(address: string): Promise<AddressStatus | undefined> {
        const params = {
            TableName: MAINNET_CHECK_TRACKER_TABLE,
            Key: { address }
        };
        const command = new GetCommand(params);
    
        try {
            const data = await this.documentClient.send(command);
            if (!data.Item) {
                return undefined;
            }
            
            return {
                checkCount: data.Item.checkCount,
                lastUsedNonce: data.Item.lastUsedNonce,
            }
        } catch (error) {
            console.error(JSON.stringify({
                date: new Date(),
                type: 'GetAddressStatusError',
                item: error
            }));
        }
    }

    async updateAddressStatus(address: string, checkCount: number = 0, nonce?: number): Promise<AddressStatus> {
        // if nonce is not provided, fetch from network
        if (!nonce) {
            const currentNonce = await getNonce(this.RPC, address)
            if (!currentNonce) {
                throw "Error fetching nonce..."
            }
            nonce = currentNonce
        }

        const params = {
            TableName: MAINNET_CHECK_TRACKER_TABLE,
            Item: {
                address,
                lastUsedNonce: nonce,
                checkCount,
            }
        };
    
        const command = new PutCommand(params);
    
        try {
            await this.documentClient.send(command);
        } catch (error) {
            console.error(JSON.stringify({
                date: new Date(),
                type: 'PuttingAddressTrackerError',
                item: error
            }));
        }

        return {
            checkCount,
            lastUsedNonce: nonce,
        }
    }
}