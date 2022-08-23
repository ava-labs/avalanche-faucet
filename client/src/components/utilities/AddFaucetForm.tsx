import { useState } from 'react'
import { Failure, Loading, Success } from './Loading'

import { ObjectCompare } from './ObjectCompare'

export const AddFaucetForm = (props: any) => {
    const [config, setConfig] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [response, setResponse] = useState<any>({})

    const handleChange = (e: any) => {
        const newConfig: any = config
        newConfig[e.target.name] = e.target.value
        setConfig(newConfig)
    }

    const handleSubmission = async (e: any) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await props.submitJSON(config)
            console.log(res)
            setResponse(res)
        } catch(err: any) {
            setResponse({isError: true, message: err.message})
        }
        setIsLoading(false)
        console.log(response, response === "")
	}

    return (
        <div>
            {
                ObjectCompare(response, {})
                ?
                (
                    isLoading
                    ?
                    <div style={{display: "flex", justifyContent: "center", margin: "50px"}}>
                        <Loading/>
                    </div>
                    :
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

                        <div style={{display: "flex"}}>
                            <button type="submit" className={'submit-button'} style = {{width: "50%"}}>
                                Submit
                            </button>
                        </div>
                    </form>
                )
                :
                (
                    <div style={{display: "flex", alignItems: "center", flexDirection: "column"}}>
                        {
                            response.isError
                            ?
                            <Failure/>
                            :
                            <Success/>
                        }

                        {response.message}
                    </div>
                )
            }
        </div>
    )
}