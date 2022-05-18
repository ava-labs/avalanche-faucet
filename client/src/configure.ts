import axios from 'axios';
import configurations from './config.json';

export default axios.create({
    baseURL: process.env.NODE_ENV == "production" ? configurations.apiBaseEndpointProduction : configurations.apiBaseEndpointDevelopment,
    timeout: configurations.apiTimeout,
});

export const config = {
    api: {
        sendToken: '/sendToken',
        getChainConfigs: '/getChainConfigs',
        getBalance: '/getBalance',
        faucetAddress: 'faucetAddress'
    },
    SITE_KEY: configurations.CAPTCHA.siteKey,
    ACTION: configurations.CAPTCHA.action,
    banner: configurations.banner
}