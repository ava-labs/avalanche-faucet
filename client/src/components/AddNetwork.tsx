declare global {
    interface Window {
        ethereum: any
    }
}

const addNetwork = async (config: any): Promise<void> => {
    if(!config) {
        return
    }
    if(window.ethereum == undefined) {
        window.open('https://metamask.io/download', '_blank')
    }

    await window?.ethereum?.request({
        method: 'wallet_addEthereumChain',
        params: [{
            chainId: `0x${config.CHAINID?.toString(16)}`,
            chainName: config.NAME,
            nativeCurrency: {
                name: config.NAME,
                symbol: config.TOKEN,
                decimals: 18
            },
            rpcUrls: [config.RPC],
            blockExplorerUrls: config.EXPLORER ? [config.EXPLORER] : null
        }]
    }).catch((error: any): void => {
        console.log(error)
    })      
}

const addAsset = async (config: any): Promise<void> => {
    if(!config) {
        return
    }
    if(window.ethereum == undefined) {
        window.open('https://metamask.io/download', '_blank')
    }

    await window?.ethereum?.request({
        method: 'wallet_watchAsset',
        params: {
            type: 'ERC20',
            options: {
                address: config.CONTRACTADDRESS,
                symbol: config.TOKEN,
                decimals: config.DECIMALS || 18
            }
        }
    }).catch((error: any): void => {
        console.log(error)
    })  
}

export default function AddNetwork(props: any) {
    return (
        <div className='footer-buttons'>
            <button className="add-network" onClick={() => {addNetwork(props.config)}}>
                <img alt='metamask' style={{width: "25px", height: "25px", marginRight: "5px"}} src="/memtamask.webp"/>
                Add Subnet to Metamask
            </button>

            <button className="add-network" onClick={() => {window.open(`${props.config.EXPLORER}`, '_blank')}}>
                <img alt="block-explorer" style={{width: "25px", height: "25px"}} src="/avaxblack.webp"/>
                View Block Explorer
            </button>

            {
                props?.token?.CONTRACTADDRESS
                &&
                <button className="add-network" onClick={() => {addAsset(props?.token)}}>
                    <img alt='asset' style={{width: "25px", height: "25px", marginRight: "5px", borderRadius: "25px"}} src={props?.token?.IMAGE}/>
                    Add Asset to Metamask
                </button>
            }
        </div>
    )
}