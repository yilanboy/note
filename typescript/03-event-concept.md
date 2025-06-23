---
layout: default
parent: TypeScript
nav_order: 3
---

# 事件概念

記錄一些網頁事件的基本概念。

## 事件傳遞

當一個事件被觸發時，事件會從 `window` 開始往下傳遞到目標元素，再從目標元素往上冒泡。

簡單舉個例子：

```html
<div id="parent">
  <button id="child">點擊我</button>
</div>

<script>
  const parent = document.getElementById("parent");
  const child = document.getElementById("child");

  parent.addEventListener(
    "click",
    function (event) {
      console.log("父元素捕獲階段");
    },
    { capture: true }
  );

  child.addEventListener(
    "click",
    function (event) {
      console.log("子元素捕獲階段");
    },
    { capture: true }
  );

  parent.addEventListener("click", function (event) {
    console.log("父元素冒泡階段");
  });

  child.addEventListener("click", function (event) {
    console.log("子元素冒泡階段");
  });
</script>
```

當 `id="child"` 的按鈕被點擊時，事件會從 `window` 開始往下傳遞到目標元素，
這個階段稱為「捕獲階段」，你可以在 Event Listener 設定 `{ capture: true }` 來監聽捕獲階段的事件。

但事件到達目標元素，事件又會開始往上冒泡，這個階段稱為「冒泡階段」，
如果你的 Event Listener 沒有設定 `{ capture: true }`，那麼預設就是監聽冒泡階段的事件。

因此當 `id="child"` 的按鈕被點擊時，Console 會依序顯示：

1. 父元素捕獲階段
2. 子元素捕獲階段
3. 子元素冒泡階段
4. 父元素冒泡階段

## 阻止預設行為 (`event.preventDefault()`)

有些 HTML 元素在觸發事件時，會伴隨一個預設的行為。例如：

- 點擊 `<a>` 連結會導航到新的 URL。
- 點擊 `<form>` 表單的提交按鈕會提交表單並重新載入頁面。
- 點擊右鍵會在瀏覽器中彈出上下文選單。

如果您希望阻止這些元素的預設行為發生，可以在事件處理函式中呼叫 `event.preventDefault()` 方法。

```javascript
// 範例：阻止連結的預設導航行為
const link = document.querySelector("a");

link.addEventListener("click", function (event) {
  event.preventDefault(); // 阻止跳轉頁面
  console.log("連結被點擊，但沒有跳轉");
});

// 範例：阻止表單的預設提交行為
const form = document.querySelector("form");

form.addEventListener("submit", function (event) {
  event.preventDefault(); // 阻止表單提交和頁面重新載入
  console.log("表單被提交，但沒有重新載入頁面");
  // 在這裡可以執行 AJAX 提交或其他操作
});
```

## 停止事件傳播 (`event.stopPropagation()`)

前面提到事件會經歷捕獲和冒泡階段在 DOM 樹中傳遞。有時候，您可能希望在某個元素處理完事件後，就停止事件繼續傳播，不讓其到達父元素或子元素的其他監聽器。

`event.stopPropagation()` 方法就是用來達成這個目的。它會阻止事件在 DOM 樹中向上（冒泡階段）或向下（捕獲階段）傳遞。

```html
<div id="parent">
  <button id="child">點擊我</button>
</div>

<script>
  const parent = document.getElementById("parent");
  const child = document.getElementById("child");

  parent.addEventListener(
    "click",
    function (event) {
      console.log("父元素捕獲階段");
    },
    { capture: true }
  );

  child.addEventListener(
    "click",
    function (event) {
      console.log("子元素捕獲階段");
      event.stopPropagation(); // 在捕獲階段停止事件傳播
    },
    { capture: true }
  );

  parent.addEventListener("click", function (event) {
    console.log("父元素冒泡階段"); // 這行不會被執行，因為事件在子元素的捕獲階段就被停止了
  });

  child.addEventListener("click", function (event) {
    console.log("子元素冒泡階段"); // 這行不會被執行
  });
</script>
```

在這個例子中，當點擊子元素時，控制台只會輸出 "父元素捕獲階段" 和 "子元素捕獲階段"，因為在子元素的捕獲階段呼叫了 `event.stopPropagation()`。

## 事件委派 (Event Delegation)

事件委派是一種利用事件冒泡特性的技巧。不是為每個子元素都附加一個事件監聽器，而是將一個單一的監聽器附加到它們的共同父元素上。

當子元素觸發事件並冒泡到父元素時，這個父元素上的監聽器會接收到事件。通過檢查 `event.target` 屬性（它指向實際觸發事件的最底層元素），監聽器可以判斷是哪個子元素觸發了事件，並執行相應的處理邏輯。

事件委派的優點：

- **效能優化**: 減少了事件監聽器的數量，特別是當處理大量列表項目或其他重複元素時。
- **簡化動態內容處理**: 對於後來通過 JavaScript 動態新增到 DOM 的元素，無需手動為每個新元素附加監聽器，因為它們的事件會自動冒泡到父元素。
- **更少的記憶體使用**: 每個監聽器都會佔用記憶體，委派可以顯著減少記憶體開銷。

```html
<ul id="myList">
  <li>項目 1</li>
  <li>項目 2</li>
  <li>項目 3</li>
</ul>

<script>
  const list = document.getElementById("myList");

  // 在父元素上附加一個點擊事件監聽器
  list.addEventListener("click", function (event) {
    // 檢查實際觸發事件的元素是否是 LI
    if (event.target.tagName === "LI") {
      console.log("點擊了:", event.target.textContent);
      // 在這裡可以根據點擊的具體 LI 元素執行不同的操作
    }
  });

  // 動態新增一個 LI 元素
  const newItem = document.createElement("li");
  newItem.textContent = "新增的項目";
  list.appendChild(newItem);
  // 新增的項目也會被父元素上的監聽器處理
</script>
```

在這個例子中，無論點擊哪個 `<li>`，甚至後來新增的 `<li>`，事件都會冒泡到 `<ul>` 元素，由 `<ul>` 上的監聽器統一處理。

## Event 物件的其他重要屬性

當事件發生時，瀏覽器會建立一個 `Event` 物件，並將其作為參數傳遞給事件處理函式。這個 `Event` 物件包含了關於事件的許多有用資訊：

- `event.target`: 指向實際觸發事件的 DOM 元素。在事件冒泡過程中，它始終是最初觸發事件的元素。
- `event.currentTarget`: 指向當前正在處理事件的 DOM 元素，也就是事件監聽器附加到的元素。在捕獲和冒泡的不同階段，`event.currentTarget` 會是不同的元素。
- `event.type`: 一個字串，表示事件的類型（例如 'click', 'mouseover', 'keydown', 'submit' 等）。
- `event.bubbles`: 一個布林值，表示事件是否會冒泡。
- `event.cancelable`: 一個布林值，表示事件的預設行為是否可以被 `preventDefault()` 取消。
- `event.clientX`, `event.clientY`: 對於滑鼠事件，提供鼠標在視口中的水平和垂直座標。
- `event.key`, `event.keyCode` (已棄用): 對於鍵盤事件，提供按下的鍵的資訊。
- `event.timeStamp`: 事件發生的時間戳。

了解這些屬性可以幫助您獲取事件的詳細上下文，以便在處理函式中做出正確的響應。
