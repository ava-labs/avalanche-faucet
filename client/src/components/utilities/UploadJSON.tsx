import { useEffect, useState } from 'react';
import { Failure, Loading, Success } from './Loading';
import { ObjectCompare } from './ObjectCompare';

export function UploadJSON(props: any) {
	const [selectedFile, setSelectedFile] = useState<any>()
	const [isSelected, setIsSelected] = useState(false)
    const [config, setConfig] = useState({})
    const [canSubmit, setCanSubmit] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [response, setResponse] = useState<any>({})

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

	const handleSubmission = async () => {
        if(selectedFile) {
            if(canSubmit) {
                setIsLoading(true)
                try {
                    const res = await props.submitJSON(config)
                    setResponse(res)
                } catch(err: any) {
                    setResponse({isError: true, message: err.message})
                }
                setIsLoading(false)
            }
        }
	}

	return(
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
                    <div>
                        <span style={{color: "grey"}}>
                            Upload your JSON file here.
                            Learn more about the format <a target = "_blank" rel="noreferrer" style={{color: "#eb4034"}} href="https://github.com/ava-labs/avalanche-faucet#adding-a-new-subnet">here</a>.
                        </span>   
                        <br/> 
                        <br/> 
        
                        <div style={{ display: "flex", justifyContent: "center" }}>
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
        
                                    <div style={{display: "flex"}}>
                                        <button onClick={handleSubmission} className={canSubmit ? 'submit-button' : "submit-button-disabled"} style = {{width: "50%"}}>
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                )
                :
                (
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
                )
            }
        </div>
	)
}