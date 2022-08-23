import { useState } from "react"
import Modal from 'react-modal'

import { AddFaucetForm, PasteJSON, UploadJSON } from "./utilities"

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

    const submitJSON = async (config: any) => {
        await new Promise(resolve => setTimeout(resolve, 5000));

        return {isError: false, message: "Successful!"}

    }

    function RenderForm() {
        switch(selected) {
            case 0:
                return (
                    <PasteJSON submitJSON = {submitJSON}/>
                )
            case 1:
                return (
                    <AddFaucetForm submitJSON = {submitJSON}/>
                )
            case 2:
                return (
                    <UploadJSON submitJSON = {submitJSON}/>
                )
            default:
                return (
                    <PasteJSON submitJSON = {submitJSON}/>
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
            </Modal>
        </div>
    );
}