# 使用 TypeScript 實作防抖函式 (Debounce Function)

使用防抖函式（debounce function）可以有效地控制高頻率事件的觸發次數，例如在使用者調整視窗大小或輸入文字時。

以下是如何使用 TypeScript 實作一個簡單的防抖函式。

```typescript
export default function debounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}
```

使用方式：

```typescript
import debounce from "./debounce";

const handleResize = debounce(() => {
  console.log("Window resized");
}, 300);

handleResize();
handleResize();
handleResize(); // 只有最後一次調用會成功印出 "Window resized"
```

## 說明

首先防抖函式接受兩個參數：一個回調函式 `callback` 和一個延遲時間 `delay`（以毫秒為單位）。它返回一個新的函式，該函式在被調用時會延遲執行 `callback`，直到在指定的延遲時間內沒有再次調用防抖函式，那麼 `callback` 才會被執行。

### 被閉包共享的 `timeoutId` 變數

在函式中，我們會宣告一個 `timeoutId` 變數來儲存 `setTimeout` 的返回值，**這是一個計時器 ID**。

每次調用返回的函式時，會先檢查 `timeoutId` 有沒有儲存計時器 ID，如果值為 `undefined`，就會設置一個新的計時器，如果已經儲存了一個計時器 ID，那麼就會清除之前的計時器，然後重新設置一個新的計時器。這樣就確保了只有在最後一次調用後經過指定的延遲時間後，`callback` 才會被執行。

```typescript
// 第一次調用防抖函式時，timeoutId 是 undefined
let timeoutId: ReturnType<typeof setTimeout>;

return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
  // 如果計時器已經存在，且還沒有被執行，則清除它
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  // 設置一個新的計時器
  timeoutId = setTimeout(() => {
    callback.apply(this, args);
  }, delay);
};
```

回傳值是一個閉包（Closure），它會持有對 `timeoutId` 變數的引用，從而在多次調用中共享這個計時器 ID。

### TypeScript 的 unknown 類型

在這個實作中，我們使用了 `unknown` 類型來表示 `callback` 函式的參數類型。`unknown` 是 TypeScript 中一個安全的頂級類型，與 `any` 類似，表示任何值，**但在使用之前必須進行類型檢查或類型斷言**。

```typescript
let value: unknown;

value = 10; // 數字型別，OK
value = true; // 布林型別，OK
value = "Hello World!"; // 字串型別，OK
value = []; // 陣列型別，OK
value = {}; // 基礎物件型別，OK
```

但要注意，當我們想要對 `unknown` 類型的值進行操作時，必須先進行類型檢查或類型斷言：

```typescript
let value: unknown = "Hello World";

if (typeof value === "string") {
  console.log(value.toUpperCase()); // OK，因為我們已經檢查過 value 是字串
}
```

所以 `unknown` 與 `any` 最大的差別在於，`unknown` 禁止操作屬性與方法，除非先進行類型檢查或類型斷言，從而提高程式的類型安全性。

### TypeScript 的 Utility Types

在這個實作中，我們使用了 TypeScript 的幾個 Utility Types 來確保函式的類型安全：

- `ReturnType<T>`：這個型別會提取函式類型 `T` 的返回值類型。在這裡，我們使用它來確保 `timeoutId` 的類型與 `setTimeout` 返回的類型一致。
- `ThisParameterType<T>`：這個型別會提取函式類型 `T` 的 `this` 參數類型，並將其用於返回的函式中。這樣我們就可以確保在調用 `callback` 時，`this` 的類型是正確的。
- `Parameters<T>`：這個型別會提取函式類型 `T` 的參數類型，並將它們組成一個元組（Tuple）。這樣我們就可以確保返回的函式接受與 `callback` 相同的參數類型。

## 參考資料

- [【Day 16】TypeScript 資料型別 - 特殊型別(下)- Any & Unknown](https://ithelp.ithome.com.tw/articles/10223315)
- [Utility 型別 Ⅱ](https://ithelp.ithome.com.tw/articles/10329357)
