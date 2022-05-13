import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

import './styles/FaucetForm.css'
import ReCaptcha from './ReCaptcha';

const FaucetForm = (props: any) => {
    const [address, setAddress] = useState<string | null>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [dripAmount, setDripAmount] = useState<number>(0);
    const [sendTokenResponse, setSendTokenResponse] = useState<any>({
        txHash: null,
        message: null
    })

    const recaptcha = new ReCaptcha(props.config.SITE_KEY, props.config.ACTION);

    useEffect(() => {
        getDripAmount();
    }, [])

    function updateAddress(addr: string | null): void {
        if (addr) {
            if (ethers.utils.isAddress(addr)) {
                setAddress(addr);
                updateCaptchaToken();
            } else {
                setAddress(null);
            }
        } else if (address != null) {
            setAddress(null);
        }
    }

    async function updateCaptchaToken() {
        const token = await recaptcha.getToken()
        setCaptchaToken(token)
    }

    async function getDripAmount() {
        const response = await props.axios.get(props.config.api.getDripAmount);
        const amt = response.data.dripAmount;
        setDripAmount(amt);
    }

    async function sendToken() {
        if(!address) {
            return;
        } 
        let data: any;
        try {
            const response = await props.axios.post(props.config.api.sendToken, {
                address: address,
                token: captchaToken
            });
            data = response?.data;
        } catch(err: any) {
            data = err?.response?.data;            
        }

        setSendTokenResponse({
            txHash: data?.txHash,
            message: data?.message
        })
    }

    return (
        <div className = "box">
            <div className='banner' style={{backgroundImage: `url(${props.config.banner})`}}/>

            <div className='box-content'>
                <div className='card-title'>
                    AVAX Fuji Testnet Faucet
                </div>

                {
                    !sendTokenResponse.txHash
                    ?
                    <div>
                        <p className='rate-limit-text'>
                            Drops are limited to 
                            <span>
                                1 request per hour.
                            </span>
                        </p>

                        <div className='address-input'>
                            <input placeholder='Address (C-Chain)' onChange={(e) => updateAddress(e.target.value)} autoFocus/>
                        </div>
                        <span className='rate-limit-text' style={{color: "red"}}>{sendTokenResponse?.message}</span>

                        <div className="beta-alert">
                            <p>This is a beta faucet. Funds are not real.</p>
                        </div>
                    
                        <button className={address ? 'send-button' : 'send-button-disabled'} onClick={sendToken}>
                            <span>Request {dripAmount} AVAX</span>
                        </button>
                    </div>
                    :
                    <div>
                        <p className='rate-limit-text'>
                            {sendTokenResponse.message}
                        </p>

                        <div>
                            <span className='bold-text'>Transaction ID</span>
                            <p className='rate-limit-text'>
                                {sendTokenResponse.txHash}
                            </p>
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}

export default FaucetForm;