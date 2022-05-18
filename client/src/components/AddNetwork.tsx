import { ethers } from 'ethers';

declare global {
    interface Window {
        ethereum: any;
    }
}

const addNetwork = async (config: any) => {
    if(!config) {
        return;
    }
    if(window.ethereum == undefined) {
        window.open('https://metamask.io/download', '_blank');
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
    }).catch((error: any) => {
        console.log(error)
    });      
}

export default function AddNetwork(props: any) {
    return (
        <div style={{padding: "20px", display: "flex", justifyContent: "center"}}>
            <button className="add-network" onClick={() => {addNetwork(props.config)}}>
                <img style={{width: "25px", height: "25px", marginRight: "5px"}} src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/800px-MetaMask_Fox.svg.png"/>
                Add Chain to Metamask
            </button>
        </div>
    )
}