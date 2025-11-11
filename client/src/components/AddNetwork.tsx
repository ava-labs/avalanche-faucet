import { addNetwork, addAsset } from "./Wallet"

export default function AddNetwork(props: any) {
    return (
        <div className='footer-buttons'>
            <button className="add-network" onClick={() => {addNetwork(props.config)}}>
                <img alt='wallet' style={{width: "22px", height: "22px", marginRight: "5px"}} src="/wallet.svg"/>
                Add Subnet to Wallet
            </button>

            <button className="add-network" onClick={() => {window.open(`${props.config.EXPLORER}${props.token?.CONTRACTADDRESS ? "/address/" + props.token.CONTRACTADDRESS : ""}`, '_blank')}}>
                <img alt="block-explorer" style={{width: "25px", height: "25px"}} src="/avaxblack.webp"/>
                View Block Explorer
            </button>

            {
                props?.token?.CONTRACTADDRESS
                &&
                <button className="add-network" onClick={() => {addAsset(props?.token)}}>
                    <img alt='wallet' style={{width: "25px", height: "25px", marginRight: "5px", borderRadius: "25px"}} src={props?.token?.IMAGE}/>
                    Add Asset to Wallet
                </button>
            }
        </div>
    )
}