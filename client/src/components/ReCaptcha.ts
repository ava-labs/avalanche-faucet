declare global {
    interface Window {
        grecaptcha: any
    }
}

export default class ReCaptcha {
    siteKey: string
    v2siteKey?: string
    action: string
        
    constructor(SITE_KEY: string, ACTION: string, V2_SITE_KEY: string) {
        this.loadReCaptcha(SITE_KEY)
        
        this.siteKey = SITE_KEY
        this.v2siteKey = V2_SITE_KEY
        this.action = ACTION
    }

    async getToken(isV2 = false): Promise<{token?: string, v2Token?: string}> {
        let token = "", v2Token = ""
        !isV2 && await window.grecaptcha.execute(this.siteKey, {action: this.action})
            .then((res: string) => {
                token = res
            })
        
        if(isV2){
            const widgetID = getWidgetID()
            v2Token = await window.grecaptcha.getResponse(widgetID)
        }

        return { token, v2Token }
    }

    loadV2Captcha = (v2siteKey: string) => {
        const v2CaptchaContainer = document.getElementsByClassName('v2-recaptcha')[0]

        const widgetID = window.grecaptcha.render(v2CaptchaContainer, {
            'sitekey' : v2siteKey,
            'theme': 'dark'
        })

        const widgetContainer = document.createElement('div')
        const widgetElem = `<input style='display:none' id='widgetID' value="${widgetID}"/>`
        widgetContainer.innerHTML = widgetElem
                
        document.body.appendChild(widgetContainer)

        return true
    }

    loadReCaptcha = (siteKey: string): boolean => {
        const script = document.createElement('script')
        script.src = `https://www.recaptcha.net/recaptcha/api.js?render=${siteKey}`

        document.body.appendChild(script)
        return true
    }
}

const getWidgetID = () => {
    const elem = <HTMLInputElement>document.getElementById('widgetID');
    return elem!?.value
}