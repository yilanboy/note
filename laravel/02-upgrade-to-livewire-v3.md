---
layout: default
parent: Laravel
nav_order: 2
---

# Livewire 升級到 v3 的筆記

萬眾期待，Livewire 終於在今天推出了 v3 的正式版本，這個版本做了相當多更動，也提供了許多新功能。

而我最期待的就是 v3 提供的新功能 - `wire:navigate`。想做 SPA (Single Page Application)，就得依靠這個新功能了。

但在體驗 v3 的 SPA mode 之前，按照慣例一些坑還是得踩，下面就來分享一下我的升級踩坑筆記 😆。

## 在 SPA Mode 中，事件一註冊就會一直存在

在 v3 的 SPA mode 中，換頁並不會觸發瀏覽器的重新整理頁面，因此要注意的是 ...

**在 SPA mode 中，事件一註冊就會一直存在**。

假設我用 v3 提供的事件 `Livewire.hook("commit")` 來做一些事情。

```js
Livewire.hook("commit", ({ component, commit, respond, succeed, fail }) => {
  succeed(() => {
    // 當 livewire 更新 DOM 之後就會觸發，等同於 v2 的 'message.processed' 事件
    queueMicrotask(() => {
      console.log("hello");
    });
  });
});
```

接下來打開瀏覽器的 dev tools，你會發現每次 livewire 一更新完 DOM，console 都會跟你 say hello。

如果你只想要讓事件只在特定頁面觸發，就要特別處理，例如我只想要在 `say-hello-page` 這個 component 中觸發事件。

```js
Livewire.hook("commit", ({ component, commit, respond, succeed, fail }) => {
  succeed(() => {
    queueMicrotask(() => {
      // 指定只在 say-hello-page 頁面觸發
      if (component.name === "say-hello-page") {
        console.log("hello");
      }
    });
  });
});
```

## JavaScript 的載入與執行

一般來說在 v2 ，我們可能會這樣使用第三方的前端套件。

以 [Tagify](https://github.com/yairEO/tagify) 為例，首先建立一個 `resources/ts/tagify.ts` 檔案。

```ts
// 載入 tagify
import Tagify from "@yaireo/tagify";

// 尋找要套用 tagify 的 input element
let tagsInput: InputElement = document.setElementById("tags");

// 如果 input element 存在，就套用 tagify
if (tagsInput) {
  new Tagify(tagsInput);
}
```

然後在 livewire 的 component 中使用 `@vite('resources/ts/tagify.ts')` 載入 `tagify.ts`。

```html
<div>
  <!-- tagify 會在 input 的前方加上一個新的元素 -->
  <!-- 為了避免 component 更新後刪除新的元素，可以使用 wire:ignore -->
  <div wire:ignore>
    <input type="text" id="tags" />
  </div>

  <!-- 會轉換成 <script> 標籤載入 tagify -->
  @vite('resources/ts/tagify.ts')
</div>
```

很常見的載入方式，但如果換到 v3 的 SPA mode 就會有問題。

**因為在 v3 的機制中，`<body>` 內的 `<script>` 是會重複執行的**。

假設你離開頁面後再重新進入頁面，`tagify.ts` 就會再執行一次。

重新載入一大包 Tagify，這聽起來就不是效能很好的做法 😂。

因此我們應該這麼做，**不在 `tagify.ts` 執行套用的動作，單純只做載入**

```ts
// 載入 tagify
import Tagify from "@yaireo/tagify";

// typescript 比較囉唆點，所以要先宣告一下我們想在 window 物件中放的東西
declare global {
  interface Window {
    Tagify: any;
  }
}

// 因為 @vite 是使用模組化的方式載入，任何變數都無法在外部使用。
// 所以我們要將 tagify 放到 window 物件中
window.Tagify = Tagify;
```

然後將 `@vite('resources/ts/tagify.ts')` 放在 `<head>` 中載入。

**在 v3 的機制中，`<head>` 中的 `<script>` 只會執行一次，除非你用瀏覽器重新整理頁面**。

```html
<head>
  <!-- ... -->
  @vite('resources/ts/tagify.ts')
</head>
```

然後在 component 中進行 Tagify 套用的動作，這樣就不會重複載入整個 Tagify 了。

```html
<div>
  <div wire:ignore>
    <input type="text" id="tags" />
  </div>

  <script>
    let tagsInput: InputElement = document.setElementById("tags");

    if (tagsInput) {
      new Tagify(tagsInput);
    }
  </script>
</div>
```

因為 v3 底層改為使用 [alpine.js](https://alpinejs.dev/)，你也可以考慮使用 alpine.js 的語法

```html
<div x-data x-init="new Tagify($refs.tags);">
  <div wire:ignore>
    <input type="text" x-ref="tags" />
  </div>
</div>
```

## 離開頁面後，按上一頁。有兩個 Tagify 元素 ！？

如剛剛提到的，Tagify 會在你的 `<input>` 前面加上一個新的元素。

```html
<div wire:ignore>
  <!-- tagify.ts 會新增一個新的元素 -->
  <tags class="tagify tagify--noTags tagify--empty" tabindex="-1"> ... </tags>

  <input type="text" x-ref="tags" />
</div>
```

v3 預設會 cache 你訪問過的頁面。假設你離開頁面後再按上一頁，v3 會直接使用 cache 的頁面，
而且 `<body>` 內的 `<script>` 會再執行一次。

**注意！cache 是儲存經過 js 渲染過後的頁面**。

也就是說，如果你離開了有 Tagify 頁面，然後在按上一頁返回。這時候如果 `tagify.ts` 再執行一次會發生什麼事情呢？

沒錯...，你會發現畫面上有兩個 Tagify 元素 😂。

```html
<div wire:ignore>
  <!-- 剛剛 tagify.ts 新增的元素 -->
  <tags class="tagify tagify--noTags tagify--empty" tabindex="-1"> ... </tags>

  <!-- 離開頁面後，點選上一頁重新回來，tagify.ts 又會新增一個新的元素 -->
  <tags class="tagify tagify--noTags tagify--empty" tabindex="-1"> ... </tags>

  <input type="text" x-ref="tags" />
</div>
```

> 如果是重新點擊含有 `wire:navigate` 的連結進入頁面，就不會有這個問題。

這個問題在 beta 版本就有人提出來了。而作者也很快的新增了一個 `livewire:navigating` event 來做處理。

`livewire:navigating` 讓你可以在離開頁面時，對即將要被 cache 的頁面做一些處理。

```js
document.addEventListener("livewire:navigating", () => {
  // Mutate the HTML before the page is navigated away...
});
```

因此我們要做的，就是在離開頁面前，移除掉 `tagify.ts` 新增的元素。讓我們稍微修改一下套用 Tagify 的程式碼。

```js
let tagify = new Tagify(tagsInput);

document.addEventListener("livewire:navigating", () => {
  if (tagify !== null) {
    console.log("destroy tagify before navigating away");
    // 使用 tagify 的 destroy 方法，移除掉 tagify 新增的元素
    tagify.destroy();
    // 在 SPA mode 中，除非你重新整理頁面，否則事件一註冊就會一直存在
    // 這裡將 tagify 變數設為 null，是為了避免之後一離開頁面，就會執行 tagify.destroy() 造成錯誤
    tagify = null;
  }
});
```
