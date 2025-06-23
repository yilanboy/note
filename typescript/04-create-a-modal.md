---
layout: default
parent: TypeScript
nav_order: 4
---

# 用 TypeScript 來寫個互動視窗

最近常常遇到一些過去曾遇到的技術問題，讓我很常在自己的部落格上翻找過去所寫的文章。次數一多後，我總覺得自己部落格上的程式碼區塊很窄。如果程式碼中某行字數太多，我就需要來回滾動捲軸來查看完整的程式碼，這讓我覺得有點難閱讀。

```css
/* 因為這個 CSS 設定，當某一行程式碼字數太多導致程式碼區塊的寬度超過文章的寬度時，超過出來的部分就會被隱藏起來，需要透過左右滾動捲軸來查看程式碼 */
/* 我故意把上面那一行打得很長，可以感受一下 😉 */
pre code.hljs {
  overflow-x: auto;
}
```

我開始在想要如何改善這個問題。我第一個想到的解法，就是為程式碼區塊加上一個彈跳互動視窗 (Modal)。當用戶想要更方便的查看程式碼時，就可以點開互動視窗，視窗中會顯示一個放大版的程式碼區塊，方便用戶閱讀。

我想要將這個互動視窗拉出來成為一個單獨的類別，視窗的內容會是動態的，除了用來顯示展開的程式碼，我想在未來也幫圖片加上類似的功能。

> 用戶點開圖片後彈出一個互動視窗顯示放大的圖片，這個功能也很常見。

所以我預期程式碼會長這樣 (應該吧？)。

```typescript
// 建立一個 Modal 實例
const modal = new Modal({
  innerHtml: "<pre>我要顯示的程式碼</pre>",
});

// 打開 Modal
modal.open();
```

之前為了好玩曾經用 (TypeScript 幫程式碼區塊寫了一個複製程式碼的按鈕)[https://docfunc.com/posts/64/使用-typescript-寫一個複製程式碼的按鈕-post]。這次我也想用 TypeScript 來寫一個互動視窗。

## 來寫個互動視窗

因為平常都用 Tailwind CSS 來寫前端樣式，這次[互動視窗](https://tailwindui.com/components/application-ui/overlays/modal-dialogs)的樣式，我也打算使用 Tailwind CSS 來設計。

我從 Tailwind UI 上面找了一個互動視窗樣板來使用。這個樣板可以透過改變 Class Name 來顯示或隱藏互動視窗。另外我也在 Bootstrap Icon 中找了一個 [Icon](https://icons.getbootstrap.com/icons/x-circle-fill/) 來做爲關閉互動視窗的按鈕。

廢話不多說，建立一個新檔案 `modal.ts` 開始寫吧。首先先寫好等等會用到的常數。

```typescript
// 設定互動視窗中各個元素的 id
// 待會需要透過這些 id 來達成幾個目的:
// - 調整 Class Name 來顯示與隱藏互動視窗
// - 加上事件監聽，例如按鈕需要加上一個 click 事件來關閉互動視窗
const BACKGROUND_BACKDROP_ID: string = "modal-background-backdrop";
const MODAL_PANEL_ID: string = "modal-panel";
const CLOSE_MODAL_BUTTON_ID: string = "close-modal-button";

// 關閉互動視窗按鈕的 SVG Icon (來自 BootStrap Icon)
const X_CIRCLE_FILL_ICON_SVG: string = `
<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="size-10" viewBox="0 0 16 16">
  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>
</svg>
`;

// Tailwind UI 的互動視窗可以透過新增與移除 Class Name 來顯示與隱藏互動視窗
const SHOW_BACKGROUND_BACKDROP_CLASS_NAME: string[] = [
  "ease-out",
  "duration-300",
  "opacity-100",
];
const HIDE_BACKGROUND_BACKDROP_CLASS_NAME: string[] = [
  "ease-in",
  "duration-200",
  "opacity-0",
];
const SHOW_MODAL_PANEL_CLASS_NAME: string[] = [
  "ease-out",
  "duration-300",
  "opacity-100",
  "translate-y-0",
  "sm:scale-100",
];
const HIDE_MODAL_PANEL_CLASS_NAME: string[] = [
  "ease-in",
  "duration-200",
  "opacity-0",
  "translate-y-4",
  "sm:translate-y-0",
  "sm:scale-95",
];
```

接下來建立一個類別 `Modal`，定義屬性與建構子。在建構子中，可以接收一個參數 `innerHtml`，用來設定要放在互動視窗中的內容，為 HTML 格式的字串。

```typescript
export class Modal {
  public element: HTMLDivElement;

  public constructor({ innerHtml }: { innerHtml: string }) {
    // 建立一個 div 元素，用來放置互動視窗的樣板
    this.element = document.createElement("div");
    this.element.id = "dynamic-content-modal";
    this.element.innerHTML = this.modalInnerHtmlTemplate(innerHtml);
  }

  // ...
}
```

在建構子中的最後一行，我用 `modalInnerHtmlTemplate` 方法來生成一個 HTML 格式的互動視窗內容，接下來根據 Tailwind UI 的樣板來寫 `modalInnerHtmlTemplate` 這個方法。

```typescript
export class Modal {
  // ...

  public modalInnerHtmlTemplate(innerHtml: string): string {
    // 樣板內容來自 Tailwind UI 的 Modal Dialog
    return `<div class="relative z-30">
            <!-- 互動視窗預設為隱藏狀態 -->
            <!-- 將剛剛設定用來隱藏互動視窗的 Class Name 加上去 -->
            <div
                id="${BACKGROUND_BACKDROP_ID}"
                class="fixed inset-0 bg-gray-500/75 backdrop-blur-md transition-opacity ${HIDE_BACKGROUND_BACKDROP_CLASS_NAME.join(
                  " "
                )}"
            ></div>

            <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4 text-center">
                    <div
                        id="${MODAL_PANEL_ID}"
                        class="relative transform overflow-hidden rounded-xl text-left transition-all sm:w-fit sm:max-w-6xl ${HIDE_MODAL_PANEL_CLASS_NAME.join(
                          " "
                        )}"
                    >
                        <!-- 互動視窗的內容 -->
                        ${innerHtml}
                    </div>
                </div>
            </div>

            <!-- 用來關閉互動視窗的按鈕 -->
            <div class="fixed right-10 top-10 z-10">
                <button
                    id="${CLOSE_MODAL_BUTTON_ID}"
                    type="button"
                    class="text-gray-200 transition duration-300 hover:text-gray-50"
                >
                   ${X_CIRCLE_FILL_ICON_SVG}
                </button>
            </div>
        </div>`;
  }
}
```

新增一個剛剛提到的 open 方法來開啟互動視窗。

```typescript
export class Modal {
  // ...

  public open() {
    // 將互動視窗元素塞到 <body> 中
    // 注意此時互動視窗還是看不到的，因為樣式預設是隱藏的狀態
    document.body.appendChild(this.element);
    // 在 body 加上樣式來隱藏捲軸，讓互動視窗打開後無法滾動主視窗的捲軸
    document.body.style.overflow = "hidden";

    // 使用剛剛設定的 id 取得互動視窗中各個元素
    // 利用調整元素 Class Name 的方式來顯示互動視窗
    const backgroundBackdrop = document.getElementById(BACKGROUND_BACKDROP_ID);
    const modalPanel = document.getElementById(MODAL_PANEL_ID);

    if (!backgroundBackdrop || !modalPanel) {
      return;
    }

    // 為了顯示 CSS Transition 的演示效果，這裡需要將其放在 setTimeout 中
    // 確保 Class Name 的調整是在互動視窗放入 body 後過段時間才執行
    setTimeout(() => {
      backgroundBackdrop.classList.remove(
        ...HIDE_BACKGROUND_BACKDROP_CLASS_NAME
      );
      backgroundBackdrop.classList.add(...SHOW_BACKGROUND_BACKDROP_CLASS_NAME);

      modalPanel.classList.remove(...HIDE_MODAL_PANEL_CLASS_NAME);
      modalPanel.classList.add(...SHOW_MODAL_PANEL_CLASS_NAME);
    }, 100);

    // 互動視窗打開後，我們就要來設定如何關閉視窗了
    this.setupCloseHandlers();
  }
}
```

在 `open` 方法中，除了將互動視窗變為可見以外，還會呼叫 `setupCloseHandlers` 方法來註冊如何關閉互動視窗的事件監聽器。

這裡我用兩個事件監聽器來關閉互動視窗，一個是按鈕的 `click` 事件，另外一個是 Esc 按鍵的 `keydown` 事件。

> 在寫 setupCloseHandlers 方法時我忽略了一件事情，導致一個很有趣的錯誤。我先展示我最一開始的寫法。大家可以想想哪邊有問題。😂
>
> P.S. 雖然有錯誤，但是執行是沒有問題的，只能說前端對新手是真的友好。

```typescript
// ❌ 注意！這是含有錯誤的寫法！

export class Modal {
  // ...

  private setupCloseHandlers() {
    // 取得關閉按鈕的元素
    const closeButton = document.getElementById(CLOSE_MODAL_BUTTON_ID);

    // 在按鈕上綁定 click 事件，點擊後就呼叫 close 方法關閉互動視窗
    closeButton?.addEventListener("click", () => this.close(), {
      // 設定事件只能被觸發一次，避免事件繼續留著佔用資源
      once: true,
    });

    // 綁定 Keydown 的事件，透過按下 Esc 按鍵來關閉互動視窗
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          this.close();
        }
      },
      { once: true }
    );
  }
}
```

最後就是關閉互動視窗的方法 `close`。

```typescript
export class Modal {
  // ...

  private close() {
    const backgroundBackdrop = document.getElementById(BACKGROUND_BACKDROP_ID);

    const modalPanel = document.getElementById(MODAL_PANEL_ID);

    if (!backgroundBackdrop || !modalPanel) {
      return;
    }

    backgroundBackdrop.classList.remove(...SHOW_BACKGROUND_BACKDROP_CLASS_NAME);
    backgroundBackdrop.classList.add(...HIDE_BACKGROUND_BACKDROP_CLASS_NAME);

    modalPanel.classList.remove(...SHOW_MODAL_PANEL_CLASS_NAME);
    modalPanel.classList.add(...HIDE_MODAL_PANEL_CLASS_NAME);

    // 將元素從 body 中移除
    // 放在 setTimeout 中執行的原因是為了確保 CSS 的 Transition 有演示效果
    setTimeout(() => {
      document.body.removeChild(this.element);
      document.body.style.overflow = "";
    }, 300);
  }
}
```

大功告成！這個時候我們就可以透過下面的方式來打開這個互動視窗。

```typescript
import { Modal } from "./modal";

const openModalButton = document.getElementById(
  "open-modal"
) as HTMLButtonElement | null;

const modal = new Modal({
  innerHtml: `<div class="w-64 h-40 text-2xl bg-gray-200 text-gray-900 flex items-center justify-center">
        Hello World!
    </div>`,
});

openModalButton?.addEventListener("click", function (this: HTMLButtonElement) {
  modal.open();
});
```

![Modal demo](https://blobs.docfunc.com/images/2024_11_11_21_55_35_46d80096ba01.gif)

## 潛藏的錯誤

剛剛提到，雖然程式碼可以正常運作，但 `setupCloseHandlers` 中其實潛藏了一個錯誤。接下來讓我們嘗試觸發這個錯誤，首先打開瀏覽器的開發人員工具，並重複以下步驟。

1. 開啟互動視窗，然後用關閉按鈕來關閉視窗。
2. 再次開啟互動視窗，然後用 Esc 按鍵關閉視窗。

就會發現主控台顯示下面這個錯誤。

```text
NotFoundError: The object can not be found here
```

這個錯誤來自 `close` 方法中的這行程式碼。

```typescript
document.body.removeChild(this.element);
```

根據錯誤內容，我們知道 `removeChild` 嘗試去移除一個已經不存在的互動視窗。但這是為什麼呢？

其實原因在於我們用了兩個事件監聽來關閉互動視窗，一個是按鈕的 `click` 事件，另外一個是 Esc 按鍵的 `keydown` 事件，那問題來了，因為我只能在同一時間觸發其中一個事件來關閉互動視窗，假設我這次使用按鈕點擊事件來關閉視窗，那麼另外一個 Esc 按鍵的事件監聽會發生什麼事情呢？

答案是會繼續存在。

此時如果我再次打開互動視窗，那麼 `setupCloseHandlers` 就會再次註冊兩個事件，這時候的事件監聽總數就是：

- Esc 按鍵的 `keydown` 事件：2 個
- 按鈕的 `click` 事件：1 個

接下來如果我使用 Esc 按鍵來關閉互動視窗的話，那麼 Esc 按鍵的 `keydown` 事件會被觸發兩次，所以 `close` 方法也將會被執行兩次。

因為第一次執行就已經把互動視窗從 `<body>` 中移除了，第二次執行 `removeChild` 當然就會找不到互動視窗了。

## 使用 AbortController 來清理沒有使用到的事件監聽

如果想要解決這個問題，我們可以使用 `AbortController` 來清理沒有使用到的事件監聽。不論我選擇使用哪一個事件來關閉互動視窗，另外一個事件的監聽都會被一同清除，不會繼續留著。

`AbortController` 主要是用來中止一個或多個網頁請求，例如 Fetch API，但也可以用來取消已經註冊的事件監聽。

> 根據 MDN 文件，AbortController 仍舊為實驗性功能，但目前所有主流瀏覽器都有支援。

首先我們在 Modal 類別中加上一個屬性，用來存放 `AbortController`。

```typescript
export class Modal {
  public element: HTMLDivElement;
  // 加上一個私有屬性，用來存放 AbortController
  private abortController: AbortController;

  public constructor({ innerHtml }: { innerHtml: string }) {
    this.element = document.createElement("div");
    this.element.id = "dynamic-content-modal";
    this.element.innerHTML = this.modalInnerHtmlTemplate(innerHtml);

    // 在建立實例時，建立一個新的 AbortController 物件
    this.abortController = new AbortController();
  }

  // ...
}
```

接下來修改 `setupCloseHandlers` 方法的程式碼。在註冊事件的時候，設定中斷訊號 (signal)。藉由中斷訊號讓 `AbortController` 與事件監聽關聯起來。

```typescript
// ✅ 不會噴出錯誤的寫法

private setupCloseHandlers() {
    const closeButton = document.getElementById(CLOSE_MODAL_BUTTON_ID);

    closeButton?.addEventListener('click', () => this.close(), {
        // ✅ 使用中斷訊號將事件監聽與 AbortController 關聯起來
        signal: this.abortController.signal,
    });

    document.addEventListener(
        'keydown',
        (event) => {
            if (event.key === 'Escape') {
                this.close();
            }
        },
        // ✅ 使用中斷訊號將事件監聽與 AbortController 關聯起來
        { signal: this.abortController.signal },
    );
}
```

接下來在 close 方法中發送中斷訊號。這樣子當事件被觸發並呼叫 close 方法時，另外一個沒有被使用到的事件監聽就會被移除。

```typescript
private close() {
    // 利用中斷訊號清理另外一個沒有使用到的事件監聽
    this.abortController.abort();
    // AbortController 只要呼叫 abort 方法後就無法再使用
    // 因此需要再次建立一個新的 AbortController 給下次打開互動視窗時使用
    this.abortController = new AbortController();


    // ...
}
```

程式碼改寫後，應該就不會在主控台看到 `removeChild` 方法抱怨找不到元素了。

沒想到為了好玩而寫的互動視窗，又讓我學到一個有趣的 API。😂

## 參考資料

- [Web APIs - AbortController](https://developer.mozilla.org/zh-TW/docs/Web/API/AbortController)
- [Using AbortController as an Alternative for Removing Event Listeners](https://css-tricks.com/using-abortcontroller-as-an-alternative-for-removing-event-listeners/)
- [Smarter Code With AbortController!](https://dev.to/parsafarahani84/smarter-code-with-abortcontroller-14g1)
