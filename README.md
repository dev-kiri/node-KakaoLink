# node-KakaoLink
KakaoLink library for node

## example
```typescript
import { KakaoLink, KakaoDefaultTemplate, TemplateBuilder, Button } from './';

const builder = new TemplateBuilder();

builder.setType('feed');
builder.setTitle('제목');
builder.setDescription('설명');

builder.addButton(new Button('버튼 1'));
builder.addButton(new Button('버튼 2'));

const template: KakaoDefaultTemplate = builder.build();

const kakao = new KakaoLink('app key', 'https://google.com');

async function main() {
    await kakao.login('example@kakao.com', 'password');
    await kakao.send('ROOM NAME', template, 'default');
}

main();
```
