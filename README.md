# node-KakaoLink
KakaoLink library for node

## example
### Login
```typescript
import { KakaoLink } from './';

const kakao = new KakaoLink('app key', 'https://your_domain.com');

async function login(email: string, password: string) {
    await kakao.login(email, password);
}
```
### Send Default Template
```typescript
import { KakaoLink, TemplateBuilder, Button } from './';

const builder = new TemplateBuilder();

builder.setType('feed');
builder.setTitle('제목');
builder.setDescription('설명');

builder.addButton(new Button('버튼 1'));
builder.addButton(new Button('버튼 2'));

const template = builder.build();

const kakao = new KakaoLink('app key', 'https://your_domain.com');

(async function () {
    await kakao.login('example@kakao.com', 'password');
    await kakao.send('ROOM NAME', template, 'default');
})();
```
### Send Custom Template
```typescript
import { KakaoLink, CustomTemplateBuilder } from './';

const builder = new CustomTemplateBuilder();

builder.setTemplateId(12345);

builder.addArgument('name', 'kiri');
builder.addArgument('age', 'NaN');
builder.addArgument('etc', 'test');

const template = builder.build();

const kakao = new KakaoLink('app key', 'https://your_domain.com');

(async function () {
    await kakao.login('example@kakao.com', 'password');
    await kakao.send('ROOM NAME', template, 'custom');
})();
