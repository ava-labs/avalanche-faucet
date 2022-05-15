import axios from 'axios';
import configurations from './config.json';

export default axios.create({
    baseURL: configurations.apiBaseEndpoint,
    timeout: configurations.apiTimeout,
});

export const config = {
    api: {
        sendToken: '/sendToken',
        getChainConfigs: '/getChainConfigs'
    },
    SITE_KEY: configurations.CAPTCHA.siteKey,
    ACTION: configurations.CAPTCHA.action,
    banner: configurations.banner
}