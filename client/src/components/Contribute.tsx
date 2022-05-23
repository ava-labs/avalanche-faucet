import './styles/Contribute.css'

const Contribute = () => {
    return (
        <div className="contribute-button" onClick={() => {window.open('https://github.com/ava-labs/avalanche-faucet', '_blank')}}>
            <img style={{width: "25px", height: "25px", marginRight: "10px"}} src="/github.png"/>
            Contribute to Github
        </div>
    )
}

export default Contribute;