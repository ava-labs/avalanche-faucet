export default class Log {
    chain: string;

    constructor(chain: string) {
        this.chain = chain;
    }
    
    error = (message: any) => {
        console.log(`ERROR ${this.chain}: ${message}`);
    }
    warn = (message: any) => {
        console.log(`WARNING ${this.chain}: ${message}`);
    }
    info = (message: any) => {
        console.log(`INFO ${this.chain}: ${message}`);
    }
}