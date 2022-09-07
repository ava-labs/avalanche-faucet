import { useState } from 'react'
import { Failure, Loading, Success } from './Loading'

import { ObjectCompare } from './ObjectCompare'

export const AddFaucetForm = (props: any) => {
    const [config, setConfig] = useState({
        RATELIMIT: {}
    })
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: any) => {
        const newConfig: any = config
        if(e.target.name === "MAX_LIMIT" || e.target.name === "WINDOW_SIZE") {
            newConfig["RATELIMIT"][e.target.name] = e.target.value
        } else {
            newConfig[e.target.name] = e.target.value
        }
        setConfig(newConfig)
    }

    const handleSubmission = async (e: any) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await props.submitJSON(config)
        } catch(err: any) {
            console.log("Error:", err)
        }
        setIsLoading(false)
	}

    return (
        <div>
            {
                ObjectCompare(props.response, {}) || props.response.isError
                ?
                (
                    <form onSubmit={handleSubmission}>
                        <span style={{color: "grey"}}>
                            Network Name
                        </span>    
                        <div className='address-input'>
                            <input
                                name='NAME'
                                onChange={handleChange}
                                placeholder='Choose human redable name'
                                autoFocus
                                required
                            />
                        </div>
                        <br/> 

                        <span style={{color: "grey"}}>
                            New RPC URL
                        </span>    
                        <div className='address-input'>
                            <input
                                name='RPC'
                                onChange={handleChange}
                                placeholder='Valid HTTP/HTTPs URL'
                                required
                            />
                        </div>
                        <br/> 

                        <span style={{color: "grey"}}>
                            Token Name
                        </span>    
                        <div className='address-input'>
                            <input
                                name='TOKEN'
                                onChange={handleChange}
                                placeholder='Short token name without spaces'
                                required
                            />
                        </div>
                        <br/>

                        <span style={{color: "grey"}}>
                            Token Image URL
                        </span>    
                        <div className='address-input'>
                            <input
                                name='IMAGE'
                                onChange={handleChange}
                                placeholder='Valid HTTP/HTTPS URL'
                                required
                            />
                        </div>
                        <br/>

                        <span style={{color: "grey"}}>
                            Explorer URL
                        </span>    
                        <div className='address-input'>
                            <input
                                name='EXPLORER'
                                onChange={handleChange}
                                placeholder='Valid HTTP/HTTPs URL'
                                required
                            />
                        </div>
                        <br/>

                        <span style={{color: "grey"}}>
                            Max Priority Fee
                        </span>    
                        <div className='address-input'>
                            <input
                                name='MAX_PRIORITY_FEE'
                                onChange={handleChange}
                                type="number"
                                placeholder='in gwei or nano-unit'
                            />
                        </div>
                        <br/>

                        <span style={{color: "grey"}}>
                            Max Fee
                        </span>    
                        <div className='address-input'>
                            <input
                                name='MAX_FEE'
                                onChange={handleChange}
                                type="number"
                                placeholder='in gwei or nano-unit'
                                required
                            />
                        </div>
                        <br/>

                        <span style={{color: "grey"}}>
                            Drop Amount per Request (optional)
                        </span>    
                        <div className='address-input'>
                            <input
                                name='DRIP_AMOUNT'
                                onChange={handleChange}
                                type="number"
                                placeholder='2 UNITS (default)'
                            />
                        </div>
                        <br/>

                        <span style={{color: "grey"}}>
                            Requests in each window (optional)
                        </span>    
                        <div className='address-input'>
                            <input
                                name='MAX_LIMIT'
                                onChange={handleChange}
                                type="number"
                                placeholder='1 (default)'
                            />
                        </div>
                        <br/>

                        <span style={{color: "grey"}}>
                            Window Size in minutes (optional)
                        </span>    
                        <div className='address-input'>
                            <input
                                name='WINDOW_SIZE'
                                onChange={handleChange}
                                type="number"
                                placeholder='24 hours (default)'
                            />
                        </div>

                        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                            {
                                props.response.isError
                                &&
                                <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                                    <Failure/>
                                    {props.response.message}
                                </div>
                            }

                            <div style={{marginTop: "20px"}}>
                                <input required type={"checkbox"} style = {{marginRight: "10px"}}/>Sent 100 coins to faucet address
                            </div>

                            {
                                isLoading
                                ?
                                <div style={{marginTop: "20px"}}>
                                    <Loading/>
                                </div>
                                :
                                <button type="submit" className={'submit-button'} style = {{width: "50%"}}>
                                    Submit
                                </button>
                            }
                        </div>
                    </form>
                )
                :
                (
                    (
                        <div style={{display: "flex", alignItems: "center", flexDirection: "column"}}>
                            {
                                !props.response.isError && <Success/>
                            }

                            {props.response.message}
                        </div>
                    )
                )
            }
        </div>
    )
}