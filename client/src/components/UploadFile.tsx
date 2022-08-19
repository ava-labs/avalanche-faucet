import { useEffect, useState } from 'react';

export function UploadFile() {
	const [selectedFile, setSelectedFile] = useState<any>();
	const [isSelected, setIsSelected] = useState(false);

    const reader = new FileReader();
    reader.addEventListener("load", () => {
        document.getElementById('file-data')!.innerHTML = (reader.result == null ? "" : reader.result).toString()
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

	const handleSubmission = () => {
		const formData = new FormData();

		formData.append('File', selectedFile!);

		// fetch(
		// 	'https://freeimage.host/api/1/upload?key=<YOUR_API_KEY>',
		// 	{
		// 		method: 'POST',
		// 		body: formData,
		// 	}
		// )
        // .then((response) => response.json())
        // .then((result) => {
        //     console.log('Success:', result);
        // })
        // .catch((error) => {
        //     console.error('Error:', error);
        // });
	}

	return(
        <div>
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
                        <textarea rows={19} className='file-output scrollbar' id='file-data'/>

                        <div style={{display: "flex"}}>
                            <button className={'submit-button'} style = {{width: "50%"}}>
                                Submit
                            </button>
                        </div>
                    </div>
                )
            }
        </div>
	)
}