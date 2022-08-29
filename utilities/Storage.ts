const { Readable } = require('stream');
const S3 = require('aws-sdk/clients/s3')

export class Storage {
    bucketName: string | undefined;
    region: string | undefined;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    isUploading: boolean;
    config: any;
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
        
        this.isUploading = false
        this.config = undefined
    }

    update = async (newConfig: any, fileName: string) => {
        if(this.isUploading) {
            this.config = newConfig
            return
        }
    
        this.isUploading = true
        await this.upload(newConfig, fileName)
        this.isUploading = false
    
        if(this.config) {
            this.update(this.config, fileName)
            return
        }
        this.config = undefined
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