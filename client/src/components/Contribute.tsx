import { useState } from 'react' 
import './styles/Contribute.css'

const Contribute = () => {
    const [hiddenClass, setHiddenClass] = useState('')

    setTimeout(() => {
        setHiddenClass("hide-button")
    }, 2000)

    return (
        <div
            className = {`contribute-button ${hiddenClass}`}
            onClick={
                () => {
                    window.open('https://github.com/ava-labs/avalanche-faucet', '_blank')
                }
            }>
            <img alt='github' src="/github.png"/>
            Contribute on Github
        </div>
    )
}

export default Contribute