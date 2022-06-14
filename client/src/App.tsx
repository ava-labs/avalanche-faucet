import FaucetForm from './components/FaucetForm'
import Contribute from './components/Contribute'

import axios, { config } from './configure'
import './App.css'

function App() {
  return (
    <div className="app">
      <FaucetForm axios = {axios} config = {config}/>

      <Contribute/>
    </div>
  )
}

export default App