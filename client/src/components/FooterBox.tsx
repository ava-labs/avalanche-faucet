import AddNetwork from "./AddNetwork";

import './styles/FooterBox.css';
import './styles/CopyToClipboard.css';

function copyToClipboard() {
    let copyText = document.getElementById("return-address-input") as HTMLInputElement;
    copyText.select();
    copyText.setSelectionRange(0, 100);
    navigator.clipboard.writeText(copyText.value);
    
    let tooltip = document.getElementById("tooltip-text") as HTMLSpanElement;
    tooltip.innerHTML = "Copied";
}

function outFunc() {
    let tooltip = document.getElementById("tooltip-text") as HTMLSpanElement;
    tooltip.innerHTML = "Copy to clipboard";
}

export default function FooterBox(props: any) {
    return (
        <div>
            <div className="footer-box">
                <div style={{fontSize: "13px", padding: "20px"}}>
                    Click the button below to add <b>{props.chainConfigs[props.chain!]?.NAME}</b> to your browser wallet extension.
                    <AddNetwork config={props.chainConfigs[props.chain!]}/>
                </div>
            </div>
            
            <div className='footer-box'>
                <div style={{fontSize: "13px", padding: "20px"}}>
                    Once you are done with the testing, feel free to send the remaining coins
                    to the following faucet address.

                    <div className='return-address' onMouseOut={outFunc} onClick={copyToClipboard} style={{marginTop: "10px", marginBottom: "10px"}}>
                        <div className="tooltip">
                            <span className="tooltiptext" id="tooltip-text">Copy to clipboard</span>
                        </div>
                        
                        <input id="return-address-input" value={props.faucetAddress} disabled/>

                        <span style={{marginRight: "10px", marginTop: "2px"}}>
                            <img style={{width: "20px", height: "20px"}} src="https://img.icons8.com/fluent-systems-regular/48/000000/copy.png"/>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}