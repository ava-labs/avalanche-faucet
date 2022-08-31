import { useEffect, useState } from 'react';
import { Failure, Loading, Success } from './Loading';
import { ObjectCompare } from './ObjectCompare';

export function UploadJSON(props: any) {
	const [selectedFile, setSelectedFile] = useState<any>()
	const [isSelected, setIsSelected] = useState(false)
    const [config, setConfig] = useState({})
    const [canSubmit, setCanSubmit] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const reader = new FileReader();
    reader.addEventListener("load", () => {
        const cfgStr = (reader.result == null ? "" : reader.result).toString()
        document.getElementById('file-data')!.innerHTML = cfgStr
        
        const elem = document.getElementById('json-error')
        try {
            setConfig(JSON.parse(cfgStr))
            setCanSubmit(true)
            elem!.innerHTML = ""
        } catch(err: any) {
            setCanSubmit(false)
            elem!.innerHTML = "Invalid JSON: " + err.message
        }
    }, false);

	const changeHandler = (event: any) => {
		setSelectedFile(event.target.files[0]);
		setIsSelected(true);
	}

    const getFileName = () => {
        const name = selectedFile.name
        if(name.length > 15) {
            return name.substr(0, 15) + "..."
        } else {
            return name
        }
    }

    useEffect(() => {
        if(selectedFile) {
            reader.readAsText(selectedFile)
        }
    }, [selectedFile])

	const handleSubmission = async (e: any) => {
        e.preventDefault()
        if(selectedFile) {
            if(canSubmit) {
                setIsLoading(true)
                try {
                    await props.submitJSON(config)
                } catch(err: any) {
                    console.log("Error:", err)
                }
                setIsLoading(false)
            }
        }
	}

	return(
        <div>
            {
                ObjectCompare(props.response, {}) || props.response.isError
                ?
                (
                    <form onSubmit={handleSubmission}>
                        <span style={{color: "grey"}}>
                            Upload your JSON file here.
                            Learn more about the format <a target = "_blank" rel="noreferrer" style={{color: "#eb4034"}} href="https://github.com/ava-labs/avalanche-faucet#adding-a-new-subnet">here</a>.
                        </span>   
                        <br/> 
                        <br/> 
        
                        <div style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center"}}>
                            {
                                props.response.isError
                                &&
                                <div style={{display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px"}}>
                                    <Failure/>
                                    {props.response.message}
                                </div>
                            }

                            <label className="file-upload-input">
                                <input id="file-upload" type="file" accept=".json" style={{display: "none"}} onChange={ changeHandler }/>
                                { isSelected ? getFileName() : "Choose File" }
                            </label>
                        </div>
        
                        <br/>
                        
                        {
                            isSelected && (
                                <div>
                                    <span id="json-error"></span>
        
                                    <textarea rows={19} className='file-output scrollbar' id='file-data'/>
        
                                    <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
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
                                            <button type = "submit" className={canSubmit ? 'submit-button' : "submit-button-disabled"} style = {{width: "50%"}}>
                                                Submit
                                            </button>
                                        }
                                    </div>
                                </div>
                            )
                        }
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