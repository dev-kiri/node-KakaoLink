import { KakaoDefaultTemplate } from '../kakaolink';

export class TemplateBuilder {
    
    private object_type: 'feed' | 'list' | 'commerce' = 'feed';
    private title: string = '';
    private image_url: string = '';
    private web_url: string = '';
    private mobile_web_url: string = '';
    private description: string = '';

    private buttons: Button[] = [];

    /**
     * Set Type
     * @param type type
     */
    setType(type: 'feed' | 'list' | 'commerce') {
        this.object_type = type;
        return this;
    }

    /**
     * Set Buttons
     * @param buttons Buttons
     */
    setButtons(buttons: Button[]) {
        this.buttons = buttons;
        return this;
    }

    /**
     * Add Buttons
     * @param buttons Buttons
     */
    addButtons(buttons: Button[]) {
        this.buttons = [...this.buttons, ...buttons];
        return this;
    }

    /**
     * Add Button
     * @param button Button
     */
    addButton(button: Button) {
        this.buttons.push(button);
        return this;
    }

    /**
     * Set Title
     * @param title Title
     */
    setTitle(title: string) {
        this.title = title;
        return this;
    }

    /**
     * Set image_url
     * @param url URL
     */
    setImageUrl(url: string) {
        this.image_url = url;
        return this;
    }

    /**
     * Set web_url
     * @param url URL
     * @param mobile_url Mobile URL
     */
    setWebUrl(url: string, mobile_url ?: string) {
        this.web_url = url;
        if ( mobile_url ) {
            this.mobile_web_url = mobile_url;
        }
        return this;
    }

    /**
     * Set Description
     * @param description Description
     */
    setDescription(description: string) {
        this.description = description;
        return this;
    }

    /**
     * Build Template
     * @returns Kakao Template Object
     */
    build(): KakaoDefaultTemplate {
        return {
            link_ver: '4.0',
            template_object: {
                object_type: this.object_type,
                button_title: this.buttons[0].title,
                content: {
                    title: this.title,
                    image_url: this.image_url,
                    link: {
                        web_url: this.web_url,
                        mobile_web_url: this.mobile_web_url
                    },
                    description: this.description
                },
                buttons: (this.buttons.length == 0 ? [new Button('')] : this.buttons).map(({ title, web_url, mobile_web_url }: Button) => ({
                    title,
                    link: {
                        web_url,
                        mobile_web_url
                    }
                }))
            }
        }
    }
}

export class Button {
    constructor(
        public title: string,
        public web_url ?: string,
        public mobile_web_url ?: string
    ) {}
}