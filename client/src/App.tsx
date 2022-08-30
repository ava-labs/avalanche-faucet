import FaucetForm from './components/FaucetForm'
import Contribute from './components/Contribute'

import axios, { config } from './configure'
import './App.css'

function App() {
  return (
    <div className="app">
      <div style={{color: "#bdbdbd", border: "1px solid white", borderRadius: "4px", padding: "10px"}}>
        The community updates the content on this page! We are <b>NOT</b> responsible
        for it but we can remove them when brought to our notice. <a href='https://github.com/ava-labs/avalanche-faucet/blob/community-faucet/DISCLAIMER.md' target={"_blank"} rel="noreferrer">Learn more.</a>
      </div>

      <FaucetForm axios = {axios} config = {config}/>

      <Contribute/>
    </div>
  )
}

export default App