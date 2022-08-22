import { useState } from "react"

export const PasteJSON = (props: any) => {
    const [config, setConfig] = useState({})
    const [canSubmit, setCanSubmit] = useState(false)
    
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

    const handleSubmission = () => {
        if(canSubmit) {
            props.submitJSON(config)
        }
	}

    return (
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

            <div style={{display: "flex"}}>
                <button onClick={handleSubmission} className={canSubmit ? 'submit-button' : "submit-button-disabled"} style = {{width: "50%"}}>
                    Submit
                </button>
            </div>
        </div>
    )
}
