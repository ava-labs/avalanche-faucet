declare global {
    interface Window {
        grecaptcha: any;
    }
}

export default class ReCaptcha {
    siteKey: string;
    action: string;
    constructor(SITE_KEY: string, ACTION: string) {
        loadReCaptcha(SITE_KEY);
        this.siteKey = SITE_KEY
        this.action = ACTION
    }

    async getToken(): Promise<string> {
        let token = "";
        await window.grecaptcha.execute(this.siteKey, {action: this.action})
            .then((res: string) => {
                token = res;
            })
        return token;
    }
}

const loadReCaptcha = (siteKey: string): boolean => {
    const script = document.createElement('script')
    script.src = `https://www.recaptcha.net/recaptcha/api.js?render=${siteKey}`
    document.body.appendChild(script)
    return true;
}