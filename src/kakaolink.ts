import { AES } from 'crypto-js';
import Axios from 'axios';
import cheerio from 'cheerio';

class KakaoLink {

    private ka: string;
    private referer: string = '';
    private cookies: Cookies = {
        _kadu: '',
        _kadub: '',
        _maldive_oauth_webapp_session_key: '',
        TIARA: '',
        _kawlt: '',
        _kawltea: '',
        _karmt: '',
        _karmtea: ''
    }

    private readonly version: string = '1.39.14';
    private readonly language: string = 'ko-KR';
    private readonly device: string = 'Win32';
    private readonly ua: string = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36';

    private readonly PICKER_LINK: string = 'https://sharer.kakao.com/talk/friends/picker/link';
    private readonly TIARA_LINK: string = 'https://track.tiara.kakao.com/queen/footsteps';
    private readonly AUTHENTICATE_LINK: string = 'https://accounts.kakao.com/weblogin/authenticate.json';
    private readonly CHATS_LINK: string = 'https://sharer.kakao.com/api/talk/chats';
    private readonly MESSAGE_LINK: string = 'https://sharer.kakao.com/api/talk/message/link';

    /**
     * 
     * @param key Kakao Developers Javascript key
     * @param platform Web Platform domain
     * @constructor
     */
    constructor (private key: string, private platform: string) {
        this.ka = [
            `sdk/${this.version}`,
            `os/javascript`,
            `lang/${this.language}`,
            `device/${this.device}`,
            `origin/${encodeURIComponent(this.platform)}`
        ].join(' ');
    }

    /**
     * 
     * @param headers Request headers
     * @param action validation action
     * @param params KakaoTemplate
     * @returns AxiosResponse
     * @private
     */
    private async picker(headers: Json<string> = { 'User-Agent': this.ua }, action: 'default' | 'custom' = 'default', params: KakaoCustomTemplate | KakaoDefaultTemplate | {} = {}) {
        return await Axios({
            url: this.PICKER_LINK,
            data: this.toFormData({
                app_key: this.key,
                validation_action: action,
                validation_params: JSON.stringify(params),
                ka: this.ka,
                lcba: ''
            }),
            method: 'POST',
            headers
        });
    }

    /**
     * 
     * @returns TIARA cookie
     * @private
     */
    private async getTiara() {
        const response = await Axios.get(this.TIARA_LINK);
        const cookies = response.headers['set-cookie'];
        return this.cook(cookies)['TIARA'];
    }

    /**
     * Login and add cookies.
     * @param email Kakao Account Email
     * @param password Kakao Account Password
     */
    public async login(email: string, password: string) {
        
        const res = await this.picker();

        if (res.status == 400) throw new ReferenceError('유효하지 않은 API Key입니다.');
        
        this.referer = res.request.res.responseUrl;
        const $ = cheerio.load(res.data);

        const cryptoKey: string = $('input[name=p]').attr('value') ?? '';
        const token: string = $('meta[name=csrf-token]').attr('content') ?? '';

        const { _kadu, _kadub, _maldive_oauth_webapp_session_key } = this.cook(res.headers['set-cookie']);
        const TIARA = await this.getTiara();

        Object.assign(this.cookies, {
            _kadu,
            _kadub,
            _maldive_oauth_webapp_session_key,
            TIARA
        });

        const response = await Axios({
            url: this.AUTHENTICATE_LINK,
            method: 'POST',
            headers: {
                'User-Agent': this.ua,
                'Referer': this.referer,
                'Cookie': this.pickCookies()
            },
            data: this.toFormData({
                os: 'web',
                webview_v: '2',
                email: AES.encrypt(email, cryptoKey).toString(),
                password: AES.encrypt(password, cryptoKey).toString(),
                stay_signed_in: 'true',
                continue: new URL(this.referer).searchParams.get('continue') as string,
                third: 'false',
                k: 'true',
                authenticity_token: token
            })
        });

        switch (response.data.status) {
            case StatusCode.SUCCESS:
                break;
            case StatusCode.INTERNAL_ERROR:
                throw new LoginError('-500: 내부 서버 에러');
            case StatusCode.EXCEED_LOGIN_LIMIT:
                throw new LoginError('-449: 로그인 횟수를 초과하였습니다.');
            case StatusCode.MISMATCH_PASSWORD:
                throw new LoginError('-450: 이메일 또는 비밀번호를 확인해주세요.');
            case StatusCode.NEED_CAPTCHA:
                throw new LoginError('-481: [CAPTCHA] 체크박스를 클릭해주세요.');
            case StatusCode.CRYPTO_ERROR:
                throw new LoginError('-484: 이메일과 비밀번호를 암호화하는 도중 문제가 발생하였습니다.');
            default:
                throw new LoginError(`${response.data.status}: 로그인 도중 알 수 없는 에러가 발생하였습니다.`);
        }

        const { _kawlt, _kawltea, _karmt, _karmtea } = this.cook(response.headers['set-cookie']);

        Object.assign(this.cookies, {
            _kawlt,
            _kawltea,
            _karmt,
            _karmtea
        });
    }

    /**
     * 
     * @param room target room name to send kakaolink
     * @param params KakaoTemplate object
     * @param type KakaoTemplate type
     */
    public async send(room: string, params: KakaoCustomTemplate | KakaoDefaultTemplate, type: 'default' | 'custom' = 'default') {
        const headers =  {
            'User-Agent': this.ua,
            'Referer': this.referer,
            'Cookie': this.pickCookies([ 'TIARA', '_kawlt', '_kawltea', '_karmt', '_karmtea' ])
        };
        const res = await this.picker(headers, type, params);

        if (res.status == 400) throw new ReferenceError('템플릿 객체 또는 웹 플랫폼 도메인을 확인해주세요.');
        if (res.status == 200) {
            const { KSHARER } = this.cook(res.headers['set-cookie']);
            
            Object.assign(this.cookies, {
                KSHARER,
                using: 'true'
            });

            const $ = cheerio.load(res.data);
            const validatedTalkLink = $('#validatedTalkLink').attr('value');
            const csrfToken = $('div').last().attr('ng-init')?.split('\'')[1];

            if (!csrfToken) throw new ReferenceError('로그인되어 있지 않습니다.');

            const chats: Chats = (await Axios({
                url: this.CHATS_LINK,
                headers: {
                    'User-Agent': this.ua,
                    'Referer': this.PICKER_LINK,
                    'Csrf-Token': csrfToken,
                    'App-Key': this.key,
                    'Cookie': this.pickCookies()
                }
            })).data;

            const chat = chats.chats.find(({ title }) => title == room);

            if (!chat) throw new ReferenceError(`방 이름 ${room}을 찾을 수 없습니다.`);

            await Axios({
                url: this.MESSAGE_LINK,
                method: 'POST',
                data: JSON.stringify({
                    receiverChatRoomMemberCount: [1],
                    receiverIds: [chat.id],
                    receiverType: 'chat',
                    securityKey: chats.securityKey,
                    validatedTalkLink: JSON.parse(validatedTalkLink as string)
                }),
                headers: {
                    'User-Agent': this.ua,
                    'Referer': this.PICKER_LINK,
                    'Csrf-Token': csrfToken,
                    'App-Key': this.key,
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Cookie': this.pickCookies([
                        'KSHARER',
                        'TIARA',
                        'using',
                        '_kadu',
                        '_kadub',
                        '_kawlt',
                        '_kawltea',
                        '_karmt',
                        '_karmtea'
                    ])
                }
            });
        } else {
            throw new Error('템플릿 인증 과정 중 알 수 없는 오류가 발생하였습니다.');
        }
    }

    /**
     * 
     * @param rawCookies raw cookies
     * @returns cooked cookies as object
     * @private
     */
    private cook(rawCookies: string[]): any {
        return rawCookies.reduce((r, c: string) => {
            const [k, v] = c.split(';')[0].split('=');
            return {
                ...r,
                [k]: v?.trim() ?? ''
            };
        }, {});
    }

    /**
     * 
     * @param filter filter
     * @returns filtered cookies
     * @private
     */
    private pickCookies(filter: string[] = Object.keys(this.cookies)) {
        // @ts-ignore
        return filter.map(key => `${key}=${this.cookies[key]}`).join('; ');
    }

    /**
     * Converts data object to encoded FormData
     * @param data data object
     * @returns FormData
     * @private
     */
    private toFormData(data: Json<string>) {
        const result = [];

        for (const [k, v] of Object.entries(data)) {
            result.push(`${k}=${encodeURIComponent(v as string)}`);
        }

        return result.join('&');
    }

    /**
     * 
     * @returns Cookies
     */
    public getCookies() {
        return this.cookies;
    }

    /**
     * 
     * @param cookies Kakao Cookies
     */
    public setCookies(cookies: Cookies) {
        this.cookies = cookies;
    }
}

type Json<T extends any> = Record<string, T>

interface Cookies {
    _kadu: string,
    _kadub: string,
    _maldive_oauth_webapp_session_key: string,
    TIARA: string,
    _kawlt: string,
    _kawltea: string,
    _karmt: string,
    _karmtea: string
}

interface Chats {
    securityKey: string,
    chats: Array<{
        id: string,
        title: string,
        membercount: string,
        profileImageURLs: string[]
    }>
}

interface KakaoTemplate {
    link_ver: '4.0'
}

interface KakaoDefaultTemplate extends KakaoTemplate {
    template_object: {
        object_type: 'feed' | 'list' | 'commerce',
        button_title: string,
        content: {
            title: string,
            image_url: string,
            link: {
                web_url?: string,
                mobile_web_url?: string
            },
            description: string
        },
        buttons: Array<{
            title: string,
            link: {
                web_url?: string,
                mobile_web_url?: string
            }
        }>
    }
}

interface KakaoCustomTemplate extends KakaoTemplate {
    template_id: number,
    template_args: Record<string, string>
}

class LoginError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LoginError';
    }
}

enum StatusCode {
    SUCCESS = 0,
    INTERNAL_ERROR = -500,
    EXCEED_LOGIN_LIMIT = -449,
    MISMATCH_PASSWORD = -450,
    NEED_CAPTCHA = -481,
    CRYPTO_ERROR = -484
}

export {
    KakaoLink,
    KakaoDefaultTemplate,
    KakaoCustomTemplate,
    LoginError,
    StatusCode
}