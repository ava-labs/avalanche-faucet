import { useState } from "react"
import { Failure, Loading, Success } from "./Loading"
import { ObjectCompare } from "./ObjectCompare"

export const PasteJSON = (props: any) => {
    const [config, setConfig] = useState({})
    const [canSubmit, setCanSubmit] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    
    const handleChangePasteJSON = (e: any, elem: any) => {
        if(e.target?.value) {
            try {
                setConfig(JSON.parse(e.target?.value))
                setCanSubmit(true)
                elem.innerHTML = ""
            } catch(err: any) {
                setCanSubmit(false)
                elem.innerHTML = "Invalid JSON: " + err.message
            }
        }
    }

    const handleSubmission = async () => {
        if(canSubmit) {
            setIsLoading(true)
            try {
                await props.submitJSON(config)
            } catch(err: any) {
                
            }
            setIsLoading(false)
        }
	}

    return (
        <div>
            {
                ObjectCompare(props.response, {}) || props.response.isError
                ?
                (
                    <div>
                        <span style={{color: "grey"}}>
                            Paste JSON configuration.
                            Learn more about the format <a target = "_blank" rel="noreferrer" style={{color: "#eb4034"}} href="https://github.com/ava-labs/avalanche-faucet#adding-a-new-subnet">here</a>.
                        </span>
                        <br/><br/>
        
                        <span id="json-error"></span>
        
                        <textarea
                            rows={19}
                            autoFocus
                            className='textarea-input'
                            onChange={(e) => handleChangePasteJSON(e, document.getElementById('json-error'))}
                        />
                        <br/>
        
                        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                            {
                                props.response.isError
                                &&
                                <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                                    <Failure/>
                                    {props.response.message}
                                </div>
                            }

                            {
                                isLoading
                                ?
                                <div style={{marginTop: "20px"}}>
                                    <Loading/>
                                </div>
                                :
                                <button onClick={handleSubmission} className={canSubmit ? 'submit-button' : "submit-button-disabled"} style = {{width: "50%"}}>
                                    Submit
                                </button>
                            }
                        </div>
                    </div>
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
