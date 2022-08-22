import { useState } from 'react'

export const AddFaucetForm = (props: any) => {
    interface ConfigType {
        NAME: string,
        TOKEN: string,
        RPC: string,
        EXPLORER: string,
        IMAGE: string,
        MAX_PRIORITY_FEE: string,
        MAX_FEE: string,
        DRIP_AMOUNT: number,
        MAX_LIMIT: number,
        WINDOW_SIZE: number
    }

    const [config, setConfig] = useState<ConfigType | {}>({})

    const handleChange = (key: string, value: string | number) => {
        const newConfig: any = config
        newConfig[key] = value
        setConfig(newConfig)
    }

    return (
        <div>
            <span style={{color: "grey"}}>
                Network Name
            </span>    
            <div className='address-input'>
                <input
                    placeholder='Choose human redable name'
                    autoFocus
                />
            </div>
            <br/> 

            <span style={{color: "grey"}}>
                New RPC URL
            </span>    
            <div className='address-input'>
                <input
                    placeholder='Valid HTTP/HTTPs URL'
                />
            </div>
            <br/> 

            <span style={{color: "grey"}}>
                Token Name
            </span>    
            <div className='address-input'>
                <input
                    placeholder='Short token name without spaces'
                />
            </div>
            <br/>

            <span style={{color: "grey"}}>
                Token Image URL
            </span>    
            <div className='address-input'>
                <input
                    placeholder='Valid HTTP/HTTPS URL'
                />
            </div>
            <br/>

            <span style={{color: "grey"}}>
                Explorer URL
            </span>    
            <div className='address-input'>
                <input
                    placeholder='Valid HTTP/HTTPs URL'
                />
            </div>
            <br/>

            <span style={{color: "grey"}}>
                Max Priority Fee
            </span>    
            <div className='address-input'>
                <input
                    placeholder='in gwei or nano-unit'
                />
            </div>
            <br/>

            <span style={{color: "grey"}}>
                Max Fee
            </span>    
            <div className='address-input'>
                <input
                    placeholder='in gwei or nano-unit'
                />
            </div>
            <br/>

            <span style={{color: "grey"}}>
                Drop Amount per Request (optional)
            </span>    
            <div className='address-input'>
                <input
                    placeholder='2 UNITS (default)'
                />
            </div>
            <br/>

            <span style={{color: "grey"}}>
                Requests in each window (optional)
            </span>    
            <div className='address-input'>
                <input
                    placeholder='1 (default)'
                />
            </div>
            <br/>

            <span style={{color: "grey"}}>
                Window Size in minutes (optional)
            </span>    
            <div className='address-input'>
                <input
                    placeholder='24 hours (default)'
                />
            </div>

            <div style={{display: "flex"}}>
                <button className={'submit-button'} style = {{width: "50%"}}>
                    Submit
                </button>
            </div>
        </div>
    )
}