import FaucetForm from './components/FaucetForm'

import axios, { config } from './configure';
import './App.css';

function App() {
  return (
    <div className="app">
      <FaucetForm axios = {axios} config = {config}/>
    </div>
  );
}

export default App;