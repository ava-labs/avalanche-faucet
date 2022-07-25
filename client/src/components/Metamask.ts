declare global {
    interface Window {
        ethereum: any
    }
}

export const addNetwork = async (config: any): Promise<void> => {
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

export const addAsset = async (config: any): Promise<void> => {
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

export const connectAccount = async (updateAddress: any, showPopup = true) => {
    if(window.ethereum == undefined) {
        showPopup && window.open('https://metamask.io/download', '_blank')
        return
    }

    try {
        window.ethereum.request({ method: 'eth_accounts' }).then(
            async (accounts: any) => {
                accounts = await handleConnection(accounts, showPopup)
                updateAddress(accounts[0])
            }
        ).catch(
            console.error
        )

        window.ethereum.on('accountsChanged', async function () {
            const accounts = await window.ethereum.enable()
            updateAddress(accounts[0]);
        })
    } catch {
        alert("Request denied!")
    }
}

async function handleConnection(accounts: any, showPopup: boolean) {
    if(accounts.length === 0) {
        if(showPopup) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
                return accounts
            } catch(err) {
                console.log("Request denied!")
            }
        }
    } else {
        return accounts
    }
}