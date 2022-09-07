const { Readable } = require('stream');
const S3 = require('aws-sdk/clients/s3')

export class Storage {
    bucketName: string | undefined;
    region: string | undefined;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    isUploading: Map<string, boolean>;
    config: Map<string, any>;
    s3: any;

    constructor(bucketName: string, region: string, accessKeyId: string, secretAccessKey: string) {
        this.bucketName = bucketName
        this.region = region
        this.accessKeyId = accessKeyId
        this.secretAccessKey = secretAccessKey

        this.s3 = typeof accessKeyId == "string" && accessKeyId.length > 0 ? new S3({
            region,
            accessKeyId,
            secretAccessKey
        }) : new S3({
            region
        })
        
        this.isUploading = new Map<string, boolean>()
        this.config = new Map<string, any>()
    }

    update = async (newConfig: any, fileName: string) => {
        if(this.isUploading.get(fileName)) {
            this.config.set(fileName, newConfig)
            return
        }
    
        this.isUploading.set(fileName, true)
        await this.upload(newConfig, fileName)
        this.isUploading.set(fileName, false)
    
        if(this.config.get(fileName)) {
            this.update(this.config.get(fileName), fileName)
            return
        }
        this.config.set(fileName, undefined)
    }

    upload = (config: any, fileName: string) => {
        const data = JSON.stringify(config)
        const stream = Readable.from(Buffer.from(data))
    
        const uploadParams = {
            Bucket: this.bucketName,
            Body: stream,
            Key: fileName
        }
        
        return this.s3.upload(uploadParams).promise()
    }

    download = async (fileName: string) => {
        const downloadParams = {
            Key: fileName,
            Bucket: this.bucketName
        }
    
        try {
            const data = await new Promise((resolve, reject) => {
                const obj = this.s3.getObject(downloadParams).createReadStream()
    
                let data: any = ""
                obj.on('data', (chunk: any) => {
                    data += chunk
                }).on('end', () => {
                    resolve(JSON.parse(data))
                }).on('error', (err: any) => {
                    reject(err)
                })
            })
    
            return data
        } catch(err: any) {
            console.log(err.message)
            return []
        }
    }
}