import { useState } from "react"
import Modal from 'react-modal'

import { AddFaucetForm } from "./utilities/AddFaucetForm"
import { PasteJSON } from "./utilities/PasteJSON"
import { UploadJSON } from "./utilities/UploadJSON"

import './styles/AddFaucet.css'

export function AddFaucet(props: any) {
    const [modalIsOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(0);
    const [response, setResponse] = useState({})

    function openModal() {
        setIsOpen(true);
    }

    function closeModal() {
        props.back()
        setResponse({})
        setIsOpen(false);
    }

    const submitJSON = async (config: any) => {
        const { token, v2Token } = await props.recaptcha.getCaptchaToken(1)

        let data
        try {
            const response = await props.axios.post('/addFaucet', { config, token, v2Token })
            data = response.data
        } catch(err: any) {
            data = {isError: true, message: err?.response?.data?.message}
        }

        console.log(document.getElementsByClassName('v2-recaptcha')[1])

        let reloadV2Widget = true
        if(document.getElementsByClassName('v2-recaptcha')[1].innerHTML) {
            reloadV2Widget = false
        }

        props.recaptcha.ifCaptchaFailed(data, 1, reloadV2Widget)

        setResponse(data)
    }

    function RenderForm() {
        switch(selected) {
            case 0:
                return (
                    <PasteJSON submitJSON = {submitJSON} response = {response}/>
                )
            case 1:
                return (
                    <AddFaucetForm submitJSON = {submitJSON} response = {response}/>
                )
            case 2:
                return (
                    <UploadJSON submitJSON = {submitJSON} response = {response}/>
                )
            default:
                return (
                    <PasteJSON submitJSON = {submitJSON} response = {response}/>
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
                    You can even <span style={{color: "#eb4034", cursor: "pointer"}} onClick = {() => {setSelected(2)}}> <u>upload</u> </span> the JSON file, or simply fill this <span style={{color: "#eb4034", cursor: "pointer"}} onClick = {() => {setSelected(1)}}> <u>form</u>. </span>
                </span>
                <br/><br/>

                <RenderForm/>

                <div style={{display: "flex", justifyContent: "center"}}>
                    <div className='v2-recaptcha' style={{marginTop: "10px"}}></div>
                </div>
            </Modal>
        </div>
    );
}