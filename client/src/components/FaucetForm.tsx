import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ClipLoader } from "react-spinners"
import Select from 'react-select';

import './styles/FaucetForm.css'
import ReCaptcha from './ReCaptcha';
import FooterBox from './FooterBox';
import queryString from 'query-string';

const FaucetForm = (props: any) => {
    const [chain, setChain] = useState<number | null>(null);
    const [chainConfigs, setChainConfigs] = useState<any>([]);
    const [inputAddress, setInputAddress] = useState("");
    const [address, setAddress] = useState<string | null>(null);
    const [faucetAddress, setFaucetAddress] = useState(null);
    const [options, setOptions] = useState([]);
    const [balance, setBalance] = useState(0);
    const [shouldAllowSend, setShouldAllowSend] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [sendTokenResponse, setSendTokenResponse] = useState<any>({
        txHash: null,
        message: null
    });

    const recaptcha = new ReCaptcha(props.config.SITE_KEY, props.config.ACTION);

    // Update chain configs
    useEffect(() => {
        updateChainConfigs();
    }, []);

    useEffect(() => {
        updateBalance()
    }, [chain, sendTokenResponse, chainConfigs]);

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
        
        chainConfigs?.forEach((chain: any, i: number) => {
            let item =  <div className='select-dropdown'>
                <img src = { chain.IMAGE } />
                { chain.NAME }
                { chain.CONTRACTADDRESS && <span style={{color: 'rgb(180, 180, 183)', fontSize: "12px", marginLeft: "5px"}}>ERC20</span>}
            </div>

            newOptions.push({label: item, value: i});
        });

        setOptions(newOptions)
    }, [chainConfigs]);

    useEffect(() => {
        updateFaucetAddress()
    }, [chain, chainConfigs]);

    useEffect(() => {
        const query = queryString.parse(window.location.search);
        if(typeof query?.address == "string") {
            updateAddress(query?.address);
        }

        if(typeof query?.erc20 == "string") {
            setChain(chainToIndex(query.erc20))
        } else if(typeof query?.subnet == "string") {
            setChain(chainToIndex(query.subnet))
        } else {
            setChain(0)
        }
    }, [window.location.search, chainConfigs]);

    // API calls
    async function updateChainConfigs() {
        const response = await props.axios.get(props.config.api.getChainConfigs);
        setChainConfigs(response?.data);
    }

    function getChainParams() {
        let params = {
            chain: "",
            erc20: "" 
        };
        if(chainConfigs[chain!]?.HOSTID) {
            params.chain = chainConfigs[chain!]?.HOSTID;
            params.erc20 = chainConfigs[chain!]?.ID;
        } else {
            params.chain = chainConfigs[chain!]?.ID;
        }
        return params;
    }

    async function updateBalance() {
        if((chain || chain == 0) && chainConfigs.length > 0) {
            let { chain, erc20 } = getChainParams()
            const response = await props.axios.get(props.config.api.getBalance, { params: {chain, erc20} });
        
            if(response?.data || response?.data == 0) {
                setBalance(response?.data);
            }
        }
    }

    async function updateFaucetAddress() {
        if((chain || chain == 0) && chainConfigs.length > 0) {
            let { chain } = getChainParams();
            const response = await props.axios.get(props.config.api.faucetAddress, {params: { chain }});
            
            if(response?.data) {
                setFaucetAddress(response?.data);
            }
        }
    }

    function chainToIndex(id: any) {
        if(chainConfigs?.length > 0) {
            if(typeof id == "string") {
                id = id.toUpperCase();
            }
            let index = 0;
            chainConfigs.forEach((chain: any, i: number) => {
                if(id == chain.ID) {
                    index = i;
                }
            });
            return index;
        } else {
            return null;
        }
    }

    function updateAddress(addr: any): void {
        setInputAddress(addr!)
        
        if (addr) {
            if (ethers.utils.isAddress(addr)) {
                setAddress(addr);
            } else {
                setAddress(null);
            }
        } else if (address != null) {
            setAddress(null);
        }
    }

    async function getCaptchaToken() {
        const token = await recaptcha.getToken();
        return token;
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

            const token = await getCaptchaToken();

            let { chain, erc20 } = getChainParams()

            const response = await props.axios.post(props.config.api.sendToken, {
                address,
                token,
                chain,
                erc20
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

    const customStyles = {
        control: (base: any, state: { isFocused: any; }) => ({
            ...base,
            background: "#333",
            borderRadius: state.isFocused ? "5px 5px 0 0" : 5,
            borderColor: state.isFocused ? "white" : "#333",
            boxShadow: null,
            "&:hover": {
                borderColor: "white"
            }
        }),
        menu: (base: any) => ({
        ...base,
        borderRadius: 0,
                    marginTop: 0,
                    background: "rgb(45, 45, 45)",
                    color: "white"
        }),
        menuList: (base: any) => ({
            ...base,
            padding: 0
        }),
        option: (styles: any, {isFocused, isSelected}: any) => ({
            ...styles,
            background: isFocused
                    ?
                    'black'
                    :
                    isSelected
                    ?
                    '#333'
                    :
                    undefined,
            zIndex: 1
        }),
        singleValue: (base: any) => ({
            ...base,
            color: "white"
        })
    }

    const ChainDropdown = () => (
        <div style={{width: "100%", marginTop: "5px"}}>
            <Select
                options={options}
                value={options[chain!]}
                onChange={updateChain}
                styles={customStyles}
            />
        </div>
    )

    const back = () => {
        setSendTokenResponse({
            txHash: null,
            message: null
        });
    }

    const toString = (mins: number): string => {
        if(mins < 60) {
            return `${mins} minute${mins > 1 ? 's' : ''}`
        } else {
            const hour = ~~(mins / 60);
            const minute = mins % 60;

            if(minute == 0) {
                return `${hour} hour${hour > 1 ? 's' : ''}`
            } else {
                return `${hour} hour${hour > 1 ? 's' : ''} and ${minute} minute${minute > 1 ? 's' : ''}`
            }
        }
    }

    return (
        <div className='container'>
            <div className = "box">
                <div className='banner' style={{backgroundImage: `url(${props.config.banner})`}}/>

                <div className='box-content'>
                    <div className='box-header'>
                        <span>
                            <span style={{color: "grey"}}>Select Network</span>
                            <span style={{color: "grey"}}>Faucet balance: {Math.round(balance/1e9 * 100) / 100} {chainConfigs[chain!]?.TOKEN}</span>
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
                                    {chainConfigs[chain!]?.RATELIMIT?.MAX_LIMIT} request in {toString(chainConfigs[chain!]?.RATELIMIT?.WINDOW_SIZE)}.
                                </span>
                            </p>

														<br/>

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
                                    <a target={'_blank'} href={chainConfigs[chain!].EXPLORER + '/tx/' + sendTokenResponse.txHash}>{sendTokenResponse.txHash}</a>
                                </p>
                            </div>

                            <button className='back-button' onClick={back}>Back</button>
                        </div>
                    }
                </div>
            </div>

            <FooterBox chain={chain} chainConfigs={chainConfigs} faucetAddress={faucetAddress}/>
        </div>


    )
}

export default FaucetForm;