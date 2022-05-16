import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ClipLoader } from "react-spinners"
import Select from 'react-select';

import './styles/FaucetForm.css'
import ReCaptcha from './ReCaptcha';

const FaucetForm = (props: any) => {
    const [chain, setChain] = useState<number | null>(null)
    const [chainConfigs, setChainConfigs] = useState<any>([])
    const [inputAddress, setInputAddress] = useState("")
    const [address, setAddress] = useState<string | null>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [options, setOptions] = useState([])
    const [balance, setBalance] = useState(0);
    const [shouldAllowSend, setShouldAllowSend] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [sendTokenResponse, setSendTokenResponse] = useState<any>({
        txHash: null,
        message: null
    })

    const recaptcha = new ReCaptcha(props.config.SITE_KEY, props.config.ACTION);

    useEffect(() => {
        updateChainConfigs();
    }, [])

    useEffect(() => {
        updateBalance()
    }, [chain, sendTokenResponse]);

    useEffect(() => {
        if(address) {
            if(balance > chainConfigs[chain!]?.DRIP_AMOUNT) {
                setShouldAllowSend(true);
                return;
            }
        }
        
        setShouldAllowSend(false);
    }, [address, balance]);

    useEffect(() => {
        let newOptions: any = []
        
        chainConfigs.forEach((chain: any, i: number) => {
            let item =  <div className='select-dropdown'>
                <img src = { chain.IMAGE } />
                { chain.NAME }
            </div>

            newOptions.push({label: item, value: i});
        });

        setOptions(newOptions)
    }, [chainConfigs]);

    function updateAddress(addr: string | null): void {
        setInputAddress(addr!)
        
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

    async function updateBalance() {
        const response = await props.axios.get(props.config.api.getBalance, {params: {chain: chainConfigs[chain!]?.ID}});
        
        if(response?.data) {
            let fetchedBalance = response?.data;
            fetchedBalance = fetchedBalance / 1e9
            setBalance(response?.data);
        }
    }

    async function updateCaptchaToken() {
        const token = await recaptcha.getToken()
        setCaptchaToken(token)
    }

    async function updateChainConfigs() {
        const response = await props.axios.get(props.config.api.getChainConfigs);
        setChainConfigs(response?.data);
        setChain(0);
    }

    async function updateChain(option: any) {
        let chainNum = option.value
        
        if(chainNum >= 0 &&  chainNum < chainConfigs.length) {
            setChain(chainNum);
            back();
        }
    }

    async function sendToken() {
        if(!shouldAllowSend) {
            return;
        } 
        let data: any;
        try {
            setIsLoading(true);

            const response = await props.axios.post(props.config.api.sendToken, {
                address: address,
                token: captchaToken,
                chain: chainConfigs[chain || 0].ID
            });
            data = response?.data;
        } catch(err: any) {
            data = err?.response?.data || err
        }

        setSendTokenResponse({
            txHash: data?.txHash,
            message: data?.message
        })

        setIsLoading(false);
    }

    const ChainDropdown = () => (
        <div style={{width: "100%", marginTop: "5px"}}>
            <Select options={options} value={options[chain || 0]} onChange={updateChain}/>
        </div>
    )

    const back = () => {
        setSendTokenResponse({
            txHash: null,
            message: null
        });
        updateCaptchaToken();
    }

    return (
        <div className = "box">
            <div className='banner' style={{backgroundImage: `url(${props.config.banner})`}}/>

            <div className='box-content'>
                <div className='box-header'>
                    <span>
                        <span>Select chain</span>
                        <span style={{color: "grey"}}>Balance: {Math.round(balance/1e9 * 100) / 100} {chainConfigs[chain!]?.TOKEN}</span>
                    </span>

                    <ChainDropdown />
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
                            <input placeholder='Hexadecimal Address (0x...)' value={inputAddress || ""} onChange={(e) => updateAddress(e.target.value)} autoFocus/>
                        </div>
                        <span className='rate-limit-text' style={{color: "red"}}>{sendTokenResponse?.message}</span>

                        <div className="beta-alert">
                            <p>This is a testnet faucet. Funds are not real.</p>
                        </div>
                    
                        <button className={shouldAllowSend ? 'send-button' : 'send-button-disabled'} onClick={sendToken}>
                            {
                                isLoading
                                ?
                                <ClipLoader size="20px" speedMultiplier={0.3} color="403F40"/>
                                :
                                <span>Request {chainConfigs[chain || 0]?.DRIP_AMOUNT / 1e9} {chainConfigs[chain || 0]?.TOKEN}</span>
                            }
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

                        <button onClick={back}>Back</button>
                    </div>
                }
            </div>
        </div>
    )
}

export default FaucetForm;