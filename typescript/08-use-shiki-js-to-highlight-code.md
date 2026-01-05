---
layout: default
parent: TypeScript
nav_order: 8
---

# 使用 Shiki.js 對程式碼著色

前陣子將自己部落格上面的程式碼語法著色工具換成 Shiki.js，雖然 Highlight.js 使用起來並沒有太大的問題，我甚至還使用 Highlight.js 的 API 自己寫了 Laravel Blade 與 HCL 的語法著色套件，但 Highlight.js 目前看下來已經沒有什麼人在幫忙維護了，而且 Shiki.js 支援的語法、主題、還有功能都比 Highlight.js 多，所幸就換成 Shiki.js 了。

Shiki.js 的作者是 Vue Core Team 的 Anthony Fu 大大，背後使用的是與 VS Code 相同的語法著色引擎，所以著色效果非常好，而且還支援多種主題，你想要自己定義主題也很方便（但我想大部分的人都是直接挑一個喜歡的主題直接用 😆）。

## 開始動工

Highlight.js 本身提供相當方便的函式，讓你可以直接對頁面上的包含程式碼的 `pre` 元素進行著色：

- `hljs.highlightAll()`
- `hljs.highlightElement(element)`

但 Shiki.js 並沒有提供類似的 API，只有一個簡單的 `codeToHtml`。傳一組字串進去，並指定語言和主題，它就會回傳一組著色後的 HTML 字串。

```typescript
import { codeToHtml } from 'shiki'

const code = 'const a = 1' // input code
const html = await codeToHtml(code, {
  lang: 'javascript',
  themes: {
    light: 'one-light',
    dark: 'one-dark-pro',
  },
})

console.log(html) // highlighted html string
```

渲染後的 `html` 字串如下：

```html
<pre style="background-color: rgb(243, 244, 246); --shiki-dark-bg: #282c34; color: rgb(56, 58, 66); --shiki-dark: #abb2bf;" class="shiki">
    <code class="language-javascript">
        <span class="line">
            <span style="color:#A626A4;--shiki-dark:#C678DD">const</span>
            <span style="color:#986801;--shiki-dark:#E5C07B"> a</span>
            <span style="color:#0184BC;--shiki-dark:#56B6C2"> =</span>
            <span style="color:#986801;--shiki-dark:#D19A66"> 1</span>
        </span>
        <span class="line"></span>
    </code>
</pre>
```

可以看到 Shiki.js 是使用 Inline CSS 對程式碼進行著色，所以不需要再額外引入主題的 CSS 檔案。

了解了該怎麼使用 Shiki.js 後，我們就開始來寫扣吧！

首先我們需要建立一個 `Highlighter` 實體。

```typescript
import { createHighlighter, type Highlighter } from 'shiki';

let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
    if (!highlighter) {
        highlighter = await createHighlighter({
            // 指定會使用到的程式語言
            langs: ['javascript', 'typescript', 'php', ...languages],
            // 引入兩種主題，之後可以根據網頁是明亮模式或是暗黑模式來切換主題
            themes: ['one-light', 'one-dark-pro'],
        });
    }

    return highlighter;
}

// ...
```

> 因為 Shiki.js 的 Best Performance Practices 中有提到，`Highlighter` 實體的建立是很耗資源的，所以建立後就應該要留著，並在之後的著色操作中反覆使用（單例模式）。

寫一個 `highlightElement` 函式，用來對包含程式碼的 `pre` 元素進行著色。

```typescript
// ...

async function highlightElement(
    preElement: HTMLPreElement,
    highlighter: Highlighter,
) {
    // 避免重複著色
    if (preElement.classList.contains('shiki-highlighted')) {
        return;
    }

    // 取得 code 元素
    const codeElement = preElement.querySelector('code');

    if (!codeElement) {
        return;
    }

    // 取得 code 元素上標注的語言類型
    const langClass = Array.from(codeElement.classList).find((c) =>
        c.startsWith('language-'),
    );
    const lang = langClass ? langClass.replace('language-', '') : 'text';
    // 取得程式碼
    const code = codeElement.innerText;

    try {
        // 使用 highlighter 對程式碼進行著色
        const html = highlighter.codeToHtml(code, {
            lang,
            // 根據網頁的主題來切換 Shiki.js 的主題
            themes: {
                light: 'one-light',
                dark: 'one-dark-pro',
            },
        });

        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const pre = template.content.firstChild as HTMLElement;

        // 將著色後的程式碼元素替換原本的 pre 元素
        preElement.replaceWith(pre);
        // 添加標記，避免重複著色
        pre.classList.add('shiki-highlighted');
    } catch (e) {
        console.warn(`Failed to highlight language: ${lang}`, e);
        // Fallback or ignore
    }
}
```

利用剛剛寫好的 `highlightElement` 函式，寫一個 `highlightAllInElement` 函式，用來對指定元素下的所有包含程式碼的 `pre` 元素進行著色。

```typescript
async function highlightAllInElement(htmlElement: HTMLElement): Promise<void> {
    const highlighter = await getHighlighter();

    let preElements = htmlElement.querySelectorAll(
        'pre:not(.shiki-highlighted)',
    ) as NodeListOf<HTMLPreElement>;

    for (const preElement of preElements) {
        await highlightElement(preElement, highlighter);
    }
}
```

寫好了就可以將 `highlightAllInElement` 函式掛到 `window` 上，方便之後使用。

```typescript
declare global {
    interface Window {
        highlightAllInElement: (element: HTMLElement) => Promise<void>;
    }
}

window.highlightAllInElement = highlightAllInElement;
```

```html
<script>
    window.highlightAllInElement(document.body);
</script>
```

## 根據網頁的主題來切換 Shiki.js 的主題

我的部落格支援明亮模式和暗黑模式，所以我希望程式碼著色也能夠根據網頁的主題來切換主題。剛剛在程式碼中，我已經引入了兩種明亮主題和暗黑主題，接下來我只要在網頁上加入下面這段 CSS 就可以了。

```css
html.dark .shiki,
html.dark .shiki span:not(.language-label) {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
}

pre.shiki {
    padding: 1rem !important;
    border-radius: 0.75rem !important;
}

pre.shiki code {
    display: block !important;
    font-family: var(--font-jetbrains-mono), sans-serif !important;
    font-size: var(--text-lg) !important;
    line-height: var(--text-lg--line-height) !important;
    font-weight: 600 !important;
    overflow-x: auto !important;
}
```

## 加上行數編號

Shiki.js 本身並沒有行數編號的功能，但是在一串討論串中，有一位大大提供了下面的 CSS，讓你可以在完全不需要 JavaScript 的情況下，幫程式碼加上行數編號。

```css
pre.shiki code {
  counter-reset: step;          /* 1. 建立一個名為 "step" 的計數器，預設歸零 */
  counter-increment: step 0;    /* 2. 在這個容器層級不增加數值 (加 0) */
}

code .line::before {
  content: counter(step);       /* A. 讀取並顯示計數器目前的數字 */
  counter-increment: step;      /* B. 讓計數器 +1 */
  width: 1rem;                  /* C. 設定行號欄位的固定寬度 */
  margin-right: 1.5rem;         /* D. 設定行號與程式碼之間的距離 */
  display: inline-block;        /* E. 讓行號變成區塊，才能設定寬度 */
  text-align: right;            /* F. 讓數字靠右對齊 */
  color: rgba(115,138,148,.4);  /* G. 設定行號顏色 (通常較淡) */
}
```

原來 CSS 還有這種用法？真是太神奇了。
