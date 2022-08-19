import { useState } from "react"
import Modal from 'react-modal'

import { UploadFile } from './UploadFile'
import { parseConfiguration } from "./parseConfiguration"

import './styles/AddFaucet.css'

export function AddFaucet() {
    const [modalIsOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(0);

    function openModal() {
        setIsOpen(true);
    }

    function closeModal() {
        setIsOpen(false);
    }

    function handleChangePasteJSON(e: any, elem: any) {
        if(e.target?.value) {
            try {
                const parsedJSON = JSON.parse(e.target?.value)
                console.log("JSON parsed successfully! ID:", parsedJSON.ID)
                elem.innerHTML = ""
            } catch(err: any) {
                elem.innerHTML = "Invalid JSON: " + err.message
            }
        }
    }

    const SimpleForm = () => (
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

    const PasteJSON = () => (
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
                <button className={'submit-button'} style = {{width: "50%"}}>
                    Submit
                </button>
            </div>
        </div>
    )

    const UploadJSON = () => (
        <div>
            <span style={{color: "grey"}}>
                Upload your JSON file here.
                Learn more about the format <a target = "_blank" rel="noreferrer" style={{color: "#eb4034"}} href="https://github.com/ava-labs/avalanche-faucet#adding-a-new-subnet">here</a>.
            </span>   
            <br/> 
            <br/> 
            
            <UploadFile/>
        </div>
    )

    function RenderForm() {
        switch(selected) {
            case 0:
                return (
                    <SimpleForm/>
                )
            case 1:
                return (
                    <PasteJSON/>
                )
            case 2:
                return (
                    <UploadJSON/>
                )
            default:
                return (
                    <SimpleForm/>
                )
        }
    }

    function back() {
        if(selected !== 0) {
            setSelected(0)
        } else {
            closeModal()
        }
    }

    return (
        <div>
            <span onClick={openModal} style={{color: "grey", float: "right", fontSize: "14px", cursor: "pointer"}}>
                Add New Faucet
            </span>
            
            <Modal
                isOpen = { modalIsOpen }
                onRequestClose = { closeModal }
                className = "Content scrollbar"
                overlayClassName = "Overlay"
            >
                <img onClick={back} alt="back" style={{float: "left", cursor: "pointer"}} src="https://img.icons8.com/material-outlined/24/FFFFFF/left.png"/>
                
                <h4 style={{color: "white", textAlign: "center", marginTop: "0px"}}>
                    Add Your Faucet Details
                </h4>
                <br/>

                <span style={{color: "grey"}}>
                    You can even <span style={{color: "#eb4034", cursor: "pointer"}} onClick = {() => {setSelected(1)}}> <u>paste</u> </span> your subnet's JSON configuration, or simply <span style={{color: "#eb4034", cursor: "pointer"}} onClick = {() => {setSelected(2)}}> <u>upload</u> </span> the JSON file.
                </span>
                <br/><br/>

                <RenderForm/>
            </Modal>
        </div>
    );
}