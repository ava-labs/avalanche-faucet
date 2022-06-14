export default function ERC20Switch(props: any) {
    return (
        <div style={{marginTop: "10px", float: "right", display: "flex", alignItems: "center"}}>
            <label>
                <input type = "checkbox" checked={props.isERC20} onChange = {() => {props.setIsERC20(!props.isERC20)}}/>
            </label>

            <span style={{fontSize: "10px", color: "white"}}>ERC20</span>
        </div>
    )
}