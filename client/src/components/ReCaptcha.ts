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
        this.loadReCaptcha(SITE_KEY, V2_SITE_KEY)
        
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

    loadV2Captcha = () => {
        window.grecaptcha = null
    
        const script = document.createElement('script')
        script.src = `https://www.google.com/recaptcha/api.js?onload=onloadCallback&render=explicit`
        script.setAttribute('async', '')
        script.setAttribute('defer', '')

        const elem = document.createElement('div')
        elem.id = "v2CaptchaContainer"
                
        document.body.appendChild(elem)
        document.body.appendChild(script)

        return true
    }

    loadReCaptcha = (siteKey: string, v2SiteKey: string): boolean => {
        window.grecaptcha = null

        const script = document.createElement('script')
        script.src = `https://www.recaptcha.net/recaptcha/api.js?render=${siteKey}`

        // script for loading v2 captcha when required
        const oncallbackscript = document.createElement('script')

        oncallbackscript.innerHTML = `var onloadCallback = function() {
            console.log("loading ${v2SiteKey}")
            const elem = document.getElementsByClassName('v2-recaptcha')[0];
            elem.innerHTML = ""
            const v2CaptchaContainer = document.getElementById('v2CaptchaContainer');
            const widgetID = window.grecaptcha.render(elem, {
                'sitekey' : "${v2SiteKey}",
                'theme': 'dark'
            })
            const widgetElem = \`<input style='display:none' id='widgetID' value="\${widgetID}"/>\`
            v2CaptchaContainer.innerHTML = widgetElem
        };`

        document.body.appendChild(oncallbackscript)
        document.body.appendChild(script)
        return true
    }
}

const getWidgetID = () => {
    const elem = <HTMLInputElement>document.getElementById('widgetID');
    return elem!.value
}