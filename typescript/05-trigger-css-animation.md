---
layout: default
parent: TypeScript
nav_order: 5
---

# 觸發互動視窗的 CSS 轉場動畫

之前因為好玩，還有想讓自己在部落格上看程式碼可以舒服點，[所以自己寫了一個簡單的互動視窗](https://docfunc.com/posts/158/用-typescript-來寫個互動視窗-post)，用來放大文章中的程式碼區塊。

雖然功能一切正常，但我還是會嘗試去改善互動視窗的程式碼。前幾天改了一個版本，讓互動視窗在頁面初始化後就塞入頁面中，只不過 `display` 預設為 `none`，所以用戶一開始是看不到的，只有當用戶開啟互動視窗後，才會將 `display` 改成 `block` 來顯示互動視窗。

```html
<!-- 互動視窗預設的 display 是 none -->
<div id="zoom-in-modal" style="display: none;">
  <!-- ... -->
</div>

<!-- 用戶開啟互動視窗，在互動視窗上將 display 改成 block -->
<div id="zoom-in-modal" style="display: block;">
  <!-- ... -->
</div>
```

這種方式雖然也能讓互動視窗正常運作，但我遇到了一個問題。

## 沒有 CSS 轉場動畫

我發現修改一個元素的 `display` 樣式，會導致子元素的 CSS 轉場動畫無法被正確觸發。研究問題後找到了很有趣的解決辦法，接下來就來說明如何解決這個問題。

下面是互動視窗的 HTML 範例：

```html
<!-- 用戶開啟互動視窗，在互動視窗上將 `display` 改成 `block` -->
<div id="zoom-in-modal" style="display: none;">
  <!-- 用戶開啟動視窗，將背景從透明改成不透明 -->
  <!-- 也就是將 opacity-0 改成 opacity-100 -->
  <!-- 這裡有使用 transition-opacity 來做 CSS 轉場動畫 -->
  <div
    id="modal-background-backdrop"
    class="transition-opacity ease-out duration-300 opacity-0 ..."
  ></div>

  <!-- ... -->
</div>
```

當用戶開啟互動視窗，程式碼會依下列順序修改互動視窗與背景的樣式。

- 將 `id` 為 `zoom-in-modal` 元素的 `display` 改為 `block`。
- 修改 `id` 為 `modal-background-backdrop` 元素的 `class`，將 `opacity-0` 改為 `opacity-100`。

下面是範例程式碼：

```typescript
let modal = document.getElementById("zoom-in-modal") as HTMLDivElement;
let backdrop = document.getElementById(
  "modal-background-backdrop"
) as HTMLDivElement;

// 將互動視窗的 display 改為 block
modal.style.display = "block";

// 將背景的 Class Name 從 opacity-0 改為 opacity-100
backdrop.classList.remove("opacity-0");
backdrop.classList.add("opacity-100");
```

原本我以為將互動視窗的 `display` 改為 `block` 後，後續對背景 Class Name 的修改會有完整的 CSS 轉場動畫，然而實際上並沒有，互動視窗會像是突然出現一樣直接顯示在畫面上，並不會有一個從透明變成不透明的漸變動畫。

這是因為瀏覽器的渲染引擎將互動視窗的 `display` 改為 `block` 之後，**此時渲染引擎還沒有執行回流（Reflow），因此互動視窗在畫面上仍舊是不佔空間的，所以也不會觸發 CSS 轉場動畫**。

> 回流（Reflow）是指渲染引擎根據元素的尺寸、位置與樣式來重新計算頁面佈局和排版的步驟。

這個時候你可以使用一個方式來觸發回流，讀取元素的 `offsetHeight`。

```typescript
let modal = document.getElementById("zoom-in-modal") as HTMLDivElement;
let backdrop = document.getElementById(
  "modal-background-backdrop"
) as HTMLDivElement;

modal.style.display = "block";

// 利用讀取 modal 的 offsetHeight 來觸發回流;
modal.offsetHeight;

// 後續 Class Name 的變化就會有完整的轉場動畫
backdrop.classList.remove("opacity-0");
backdrop.classList.add("opacity-100");
```

使用 `offsetHeight` 觸發回流後，背景的 CSS 轉場動畫能夠正常演示了，還真是意想不到的一招。

## 在轉場動畫結束後隱藏元素

與開啟互動視窗一樣，我希望關掉互動視窗也能有 CSS 轉場動畫，但是這同樣需要做一些額外的步驟。

關掉的程式碼與開啟的程式碼相比，順序是反過來的，下面是簡單的範例程式碼。

```typescript
let modal = document.getElementById("zoom-in-modal") as HTMLDivElement;
let backdrop = document.getElementById(
  "modal-background-backdrop"
) as HTMLDivElement;

// 將背景的 Class Name 從 opacity-100 改為 opacity-0
backdrop.classList.remove("opacity-100");
backdrop.classList.add("opacity-0");

// 將互動視窗的 display 改為 none
modal.style.display = "none";
```

這段程式碼也不會觸發 CSS 轉場動畫，或者應該說，**在觸發動畫後就立刻被隱藏了**，畫面上根本看不出來背景漸變成透明的效果。

我想要在背景 CSS 轉場動畫結束後才隱藏互動視窗，可以怎麼做呢？這時候就要介紹一個神奇的事件 `transitionend`。沒錯！轉場動畫結束也會觸發事件，所以我們就可以透過監聽 `transitionend` 事件來隱藏互動視窗。

```typescript
let modal = document.getElementById("zoom-in-modal") as HTMLDivElement;
let backdrop = document.getElementById(
  "modal-background-backdrop"
) as HTMLDivElement;

backdrop.addEventListener("transitionend", (event: TransitionEvent) => {
  if (event.propertyName === "opacity") {
    // 將互動視窗的 display 改為 none
    modal.style.display = "none";
  }
});

// 將背景的 Class Name 從 opacity-100 改為 opacity-0
backdrop.classList.remove("opacity-100");
backdrop.classList.add("opacity-0");
```

如此一來，互動視窗的開啟與關閉都會有一個完整的 CSS 轉場動畫。

想不到寫個互動視窗，不只能了解渲染引擎的渲染畫面的流程，還能認識一個新的事件，真是收穫頗豐啊！

## 參考資料

- [Element: transitionend event](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitionend_event)
- [Force browser to trigger reflow while changing CSS](https://stackoverflow.com/questions/21664940/force-browser-to-trigger-reflow-while-changing-css)
- [What forces layout / reflow](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
- [回流 (Reflow) 和重繪 (Repaint) 是什麼？以及如何優化？](https://www.explainthis.io/zh-hant/swe/repaint-and-reflow)
