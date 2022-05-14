import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

import './styles/FaucetForm.css'
import ReCaptcha from './ReCaptcha';

const FaucetForm = (props: any) => {
    const [chain, setChain] = useState<number | null>(null)
    const [chainConfigs, setChainConfigs] = useState<any>([])
    const [address, setAddress] = useState<string | null>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [sendTokenResponse, setSendTokenResponse] = useState<any>({
        txHash: null,
        message: null
    })

    const recaptcha = new ReCaptcha(props.config.SITE_KEY, props.config.ACTION);

    useEffect(() => {
        updateChainConfigs();
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

    async function updateChainConfigs() {
        const response = await props.axios.get(props.config.api.getChainConfigs);
        console.log(response?.data)
        setChainConfigs(response?.data);
        setChain(0);
    }

    async function updateChain(chain: number) {
        if(chain >= 0 &&  chain < chainConfigs.length) {
            setChain(chain)
        }
    }

    async function sendToken() {
        if(!address) {
            return;
        } 
        let data: any;
        try {
            const response = await props.axios.post(props.config.api.sendToken, {
                address: address,
                token: captchaToken,
                chain: chainConfigs[chain || 0].NAME
            });
            data = response?.data;
        } catch(err: any) {
            console.log(err?.response?.data || err?.message)
            data = err?.response?.data || err
        }

        setSendTokenResponse({
            txHash: data?.txHash,
            message: data?.message
        })
    }

    const GelElement = () => {
        let elements: any = [];
        chainConfigs.forEach((chain: any, i: number) => {
            elements.push(
                <option value={i}>{chain.NAME}</option>
            )
        })
        return elements;
    }

    return (
        <div className = "box">
            <div className='banner' style={{backgroundImage: `url(${props.config.banner})`}}/>

            <div className='box-content'>
                <div className='box-header'>
                    <div className='card-title'>
                        AVAX Fuji Testnet Faucet
                    </div>

                    <select value={chain || 0} onChange={(e) => updateChain(parseInt(e.target.value))}>
                        <GelElement/>
                    </select>
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
                            <input placeholder='Hexadecimal Address (0x...)' onChange={(e) => updateAddress(e.target.value)} autoFocus/>
                        </div>
                        <span className='rate-limit-text' style={{color: "red"}}>{sendTokenResponse?.message}</span>

                        <div className="beta-alert">
                            <p>This is a beta faucet. Funds are not real.</p>
                        </div>
                    
                        <button className={address ? 'send-button' : 'send-button-disabled'} onClick={sendToken}>
                            <span>Request {chainConfigs[chain || 0]?.DRIP_AMOUNT / 1e9} {chainConfigs[chain || 0]?.TOKEN}</span>
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