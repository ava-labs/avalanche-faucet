declare global {
    interface Window {
        grecaptcha: any
    }
}

export default class ReCaptcha {
    siteKey: string
    v2siteKey?: string
    action: string
    widgetID: string | undefined
    setWidgetID: any
        
    constructor(SITE_KEY: string, ACTION: string, V2_SITE_KEY: string, setWidgetID: any, widgetID: string | undefined) {
        this.loadReCaptcha(SITE_KEY)
        
        this.siteKey = SITE_KEY
        this.v2siteKey = V2_SITE_KEY
        this.action = ACTION
        this.widgetID = widgetID
        this.setWidgetID = setWidgetID
    }

    async getToken(isV2 = false): Promise<{token?: string, v2Token?: string}> {
        let token = "", v2Token = ""
        !isV2 && await window.grecaptcha.execute(this.siteKey, {action: this.action})
            .then((res: string) => {
                token = res
            })
        
        if(isV2){
            v2Token = await window.grecaptcha.getResponse(this.widgetID)
        }

        return { token, v2Token }
    }

    resetV2Captcha = () => {
        const v2CaptchaContainer = <HTMLElement>document.getElementsByClassName('v2-recaptcha')[0]
        if(v2CaptchaContainer) {
            if(this.widgetID) {
                window.grecaptcha.reset(this.widgetID)
            }
            v2CaptchaContainer.style.display = "none"
        }
    }

    loadV2Captcha = (v2siteKey: string) => {
        const v2CaptchaContainer = document.getElementsByClassName('v2-recaptcha')[0]

        if(this.widgetID || this.widgetID == "0") {
            const v2CaptchaContainer = <HTMLElement>document.getElementsByClassName('v2-recaptcha')[0]
            if(v2CaptchaContainer) {
                v2CaptchaContainer.style.display = "block"
            }
        } else {
            const widgetID = window.grecaptcha.render(v2CaptchaContainer, {
                'sitekey' : v2siteKey,
                'theme': 'dark'
            })
            this.setWidgetID(widgetID)
        }

        return true
    }

    loadReCaptcha = (siteKey: string): boolean => {
        const script = document.createElement('script')
        script.src = `https://www.recaptcha.net/recaptcha/api.js?render=${siteKey}`

        document.body.appendChild(script)
        return true
    }
}