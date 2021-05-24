import { KakaoCustomTemplate } from '../kakaolink';

type Arguments = Record<string, string>;

export class CustomTemplateBuilder {

    private template_id: number | undefined;
    private template_args: Arguments = {};

    /**
     * Set Template id
     * @param id template_id
     */
    setTemplateId(id: number) {
        this.template_id = id;
        return this;
    }

    /**
     * Set Arguments
     * @param args entire arguments
     */
    setArguments(args: Arguments) {
        this.template_args = args;
        return this;
    }

    /**
     * Adds arguments by key and value
     * @param key key
     * @param value value
     */
    addArgument(key: string, value: string) {
        this.template_args[key] = value;
        return this;
    }

    /**
     * Assign arguments
     * @param args template arguments
     */
    addArguments(args: Arguments) {
        Object.assign(this.template_args, args);
        return this;
    }

    /**
     * Build template
     * @returns Kakao Template Object
     */
    build(): KakaoCustomTemplate {
        if (!this.template_id) throw new ReferenceError('템플릿 아이디가 설정되지 않았습니다.');

        return {
            link_ver: '4.0',
            template_id: this.template_id,
            template_args: this.template_args
        };
    }
}
