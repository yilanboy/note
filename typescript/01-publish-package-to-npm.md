---
layout: default
parent: TypeScript
nav_order: 1
---

# 發佈一個由 TypeScript 寫成的套件

最近用 TypeScript 寫了一個前端套件推送到 NPM 上面，除了自己讓自己使用，也分享給別人使用。

簡單的記錄一下寫前端套件的過程。

## 初始化套件

新增一個空的資料夾。

```bash
mkdir example-package
```

在資料夾內進行套件初始化，並新增一個 `package.json` 檔案。

```bash
cd example-package

npm init
```

執行 `npm init`，需要輸入一些套件的基本資訊。
許多資訊不用一開始就輸入，之後可以在 `package.json` 中設定。

```text
package name: (example-package)
version: (1.0.0) 0.0.1
description: An example npm package
entry point: (index.js) dist/index.js
test command: vitest
git repository: https://github.com/yilanboy/highlight-blade.git
keywords: example
author: yilanboy
license: (ISC) MIT
type: (commonjs) module
```

這裡說明一點，因為我是使用 TypeScript 開發，需要進行編譯才能生成瀏覽器可以執行的 JavaScript 檔案。
這些 JavaScript 檔案我會放在 `dist/` 資料夾底下，所以預設的 `entry point` 我使用 `dist/index.js`。

來看看 `npm init` 生成的 `package.json` 檔案。

```json
{
  "name": "example-package",
  "version": "0.0.1",
  "description": "An example npm package",
  "keywords": ["example"],
  "homepage": "https://github.com/yilanboy/example-package#readme",
  "bugs": {
    "url": "https://github.com/yilanboy/example-package/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yilanboy/example-package.git"
  },
  "license": "MIT",
  "author": "yilanboy",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "test": "vitest"
  }
}
```

## 安裝 TypeScript

有了 `package.json` 之後，就可以來安裝 TypeScript 了。

```bash
npm install --save-dev typescript
```

使用 `tsc` 指令生成 TypeScript 設定檔案 `tsconfig.json`。

```bash
node_modules/.bin/tsc --init
```

以下是我個人的 `tsconfig.json` 設定。你可以根據你的需要進行調整。

```json
{
  "compilerOptions": {
    /* Base Options: */
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "es2022",
    "allowJs": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    /* Strictness */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    /* If transpiling with TypeScript: */
    "module": "NodeNext",
    "outDir": "dist",
    "sourceMap": true,
    /* if you're building for a library: */
    "declaration": true,
    /* If your code run in the DOM: */
    "lib": ["es2022", "dom", "dom.iterable"]
  },
  "include": ["src/**/*"]
}
```

`include` 代表需要編譯哪個目錄下的 TypeScript 檔案，`outDir` 代表會將編譯後的 JavaScript 檔案放在哪裡。

之後就可以新增一個 `src/` 資料夾，開始進行開發。先在 `src/` 底下新增一個檔案 `index.ts`。

```typescript
export function sayHiTo(name: string): string {
  return `Hello, ${name}!`;
}
```

然後輸入 `tsc` 指令進行編譯。

```bash
node_modules/.bin/tsc
```

編譯後你就會發現多出了一個 `dist/` 資料夾，底下會有編譯後的檔案。

```text
dist/
├── index.d.ts
├── index.js
└── index.js.map

1 directory, 3 files
```

編譯出來的檔案會包含**類型定義檔案**，它的主要目的是為 TypeScript 提供有關 JavaScript API 的類型資訊。

我們可以在 `package.json` 中設定類型定義檔案的路徑。

```json
{
  /* ... */
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
  /* ... */
}
```

程式碼修改後要一直輸入 `tsc` 指令進行編譯有點太麻煩了，我們可以在 `package.json` 中加上自己的腳本。

```json
{
  /* ... */
  "scripts": {
    "test": "vitest",
    "build": "tsc",
    "dev": "tsc --watch"
  }
  /* ... */
}
```

這樣就可以使用 `npm run dev` 指令來隨時偵測程式碼的修改並自動產生編譯後的 JavaScript 檔案。

## 使用 Vitest 撰寫測試

你可能發現我在腳本中有一個 `"test": "vitest"`，但卻無法執行，那是因為我們還沒有安裝 Vitest。

Vitest 是一個很好用的測試框架。我們先來安裝它。

```bash
npm install --save-dev vitest
```

新增一個資料夾 `tests/`，並在底下新增一個檔案 `example.test.ts`。

```typescript
import { expect, test } from "vitest";
import { sayHiTo } from "../src/index";

test("say hi to someone", () => {
  expect(sayHiTo("Allen")).toBe("Hello, Allen!");
});
```

這樣就可以開始執行測試並撰寫測試了。

```bash
npm test
```

## 發布到 NPM

發佈套件相當簡單，如果你的套件沒有與其他套件撞名的話，只要申請一個 NPM 的帳號，就能直接發佈你的套件。

申請帳號這裡不多贅述，申請後輸入指令，就能透過瀏覽器登入獲得授權。

```bash
npm login
```

接下來直接發佈就可以了。

```bash
npm publish --access public
```

## 檢查可以發佈的版本

原本推送 1.0.0 版本到 NPM 時，發現被 NPM 的政策擋了下來，理由是之前已經發佈過這個版本了。
我一開始覺得很疑惑，我根本就沒有送過 1.0.0 版本啊！後來才發現原來是之前有退回發布的關係 (Unpublish)。
使用過的版本號碼，即使退回發佈也不能再次使用。

> [!NOTE]
>
> 套件發佈後的 72 小時內，你可以選擇退回發佈。

你可以使用這個指令來查看你目前有發佈過哪些版本號碼。

```bash
npm view --json
```

輸出結果有一個部分會列出你之前使用過的號碼。

```json
{
  /* ... */
  "time": {
    "created": "2025-01-15T08:20:13.194Z",
    "modified": "2025-01-21T03:49:51.769Z",
    "1.0.0": "2025-01-07T10:37:07.072Z",
    "1.0.1": "2025-01-07T10:45:59.308Z",
    "1.0.2": "2025-01-07T13:46:38.976Z",
    "1.0.3": "2025-01-07T14:04:26.164Z",
    "0.0.1": "2025-01-15T08:20:13.369Z",
    "0.0.2": "2025-01-17T04:58:30.219Z",
    "0.0.3": "2025-01-17T05:03:49.809Z"
  }
  /* ... */
}
```

## 參考資料

- [https://www.totaltypescript.com/how-to-create-an-npm-package](https://www.totaltypescript.com/how-to-create-an-npm-package)
- [Unpublishing packages from the registry](https://docs.npmjs.com/unpublishing-packages-from-the-registry)
