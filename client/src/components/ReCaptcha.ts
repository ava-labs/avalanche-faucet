declare global {
    interface Window {
        grecaptcha: any
    }
}

export default class ReCaptcha {
    siteKey: string
    v2siteKey?: string
    action: string
    setWidgetID: any
        
    constructor(SITE_KEY: string, ACTION: string, V2_SITE_KEY: string, setWidgetID: any) {
        this.loadReCaptcha(SITE_KEY)
        
        this.siteKey = SITE_KEY
        this.v2siteKey = V2_SITE_KEY
        this.action = ACTION
        this.setWidgetID = setWidgetID
    }

    async getToken(isV2 = false, widgetID: any, index: number = 0): Promise<{token?: string, v2Token?: string}> {
        let token = "", v2Token = ""
        !isV2 && await window.grecaptcha.execute(this.siteKey, {action: this.action})
            .then((res: string) => {
                token = res
            })
        
        if(isV2){
            v2Token = await window.grecaptcha.getResponse(widgetID.get(index))
        }

        return { token, v2Token }
    }

    resetV2Captcha = (widgetID: any, index: number = 0) => {
        const v2CaptchaContainer = document.getElementsByClassName('v2-recaptcha')[index] as HTMLElement
        if(v2CaptchaContainer) {
            if(widgetID.get(index) || widgetID.get(index) == 0) {
                window.grecaptcha.reset(widgetID.get(index))
            }
            v2CaptchaContainer.style.display = "none"
        }
    }

    loadV2Captcha = (v2siteKey: string, widgetID: any, index: number = 0, reload: boolean = false) => {
        this.resetV2Captcha(widgetID, index)
        const v2CaptchaContainer = document.getElementsByClassName('v2-recaptcha')[index] as HTMLElement
        if((widgetID.get(index) || widgetID.get(index) == "0") && !reload) {
            const v2CaptchaContainer = document.getElementsByClassName('v2-recaptcha')[index] as HTMLElement
            if(v2CaptchaContainer) {
                v2CaptchaContainer.style.display = "block"
            }
        } else {
            v2CaptchaContainer.style.display = "block"
            const newWidgetID = window.grecaptcha.render(v2CaptchaContainer, {
                'sitekey' : v2siteKey,
                'theme': 'dark'
            })
            widgetID.set(index, newWidgetID)
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