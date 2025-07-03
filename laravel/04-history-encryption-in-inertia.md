---
layout: default
parent: Laravel
nav_order: 4
---

# 在 Inertia.js 中防止登出後返回敏感頁面

最近開始在用 [Inertia.js](https://inertiajs.com/) 搭配 Laravel 與 Svelte 寫網頁。不用不知道，一用嚇一跳，有了 Inertia.js 當做前後端的粘合劑，我除了不用寫 API 以外，還可以在前後端都使用自己喜歡具工具，開發起來真的非常舒服。

不過開發沒多久我就遇到了一個問題，那就是用戶在登出後，可以透過返回上一頁回到需要登入的頁面，這個 …

妥妥的資安漏洞啊！

## 存在已久的問題

這個問題在 Inertia.js V1 實際上就已經被討論很久了，很多人也希望 Inertia.js 能想辦法解決這個問題，然而這個看似簡單的問題，想要解決卻不是這麼容易。

主要原因是 Inertia.js 會將用戶訪問的頁面紀錄儲存在瀏覽器的歷史狀態（History State）中，基本上瀏覽器都允許用戶透過歷史狀態回去訪問之前的頁面，而瀏覽器並沒有提供任何 API 可以清除歷史狀態，這才讓阻擋用戶在登出後返回上一頁變得有些困難。

## Inertia.js 的解決方案 - History Encryption

Inertia.js 的作者想了不少解決方案，例如將頁面訪問紀錄儲存在 `localStorage`、`sessionStorage` 或是 `indexedDB` 中，雖然這些方案都提供清除紀錄的功能，但這些解決方案都有存儲上限的限制。

最後作者想到了一個很精妙的辦法 - History Encryption。使用 Crypto API 產生一個金鑰來加密頁面紀錄，並把這個金鑰儲存在 `sessionStorage` 中，當用戶登出後，後端可以透過回應（Response）指示前端輪換一個新的金鑰。如此一來，當用戶返回上一頁時，就會因為無法解密歷史狀態中的頁面訪問紀錄而停留在當前頁面。

真的是相當厲害的解決辦法。😮😮

## 在 Laravel 中開啟 History Encryption

想要開啟 History Encryption 功能有很多種方式，最簡單的方式就是設定環境變數。

```conf
INERTIA_ENCRYPT_HISTORY=true
```

或是在 `bootstrap/app.php` 中，將 ` EncryptHistoryMiddleware::class` 設定為全局中介軟體（Global Middleware）。

```php
use Inertia\EncryptHistoryMiddleware;

->withMiddleware(function (Middleware $middleware) {
    $middleware->append(EncryptHistoryMiddleware::class);
})
```

如此一來，你就可以在登出後呼叫 `Inertia::clearHistory()` 方法來輪換前端的金鑰了。用戶也無法在登出後透過返回上一頁訪問登入後的頁面。

```php
public function destroy(Request $request): RedirectResponse
{
    // ...

    Inertia::clearHistory();

    return redirect(route('login'));
}
```

就是這樣，使用起來非常簡單！

## 深入看看背後的運作原理

如果查看 `Inertia::clearHistory()` 背後的邏輯，其實就是在會話中將 `inertia.clear_history` 的值設定為 `true`。

```php
public function clearHistory(): void
{
    session(['inertia.clear_history' => true]);
}
```

在回傳 JSON 回應的時候，會根據會話中 `inertia.clear_history` 的設定，來設定回應中 `clearHistory` 的值。

```php
$this->clearHistory = session()->pull('inertia.clear_history', false);
```

```json
{
  "clearHistory": true
}
```

在 Inertia.js 的前端套件中，可以看到套件會根據 clearHistory 的值來決定是否要輪換金鑰。

```typescript
// packages/core/src/page.ts
if (page.clearHistory) {
  history.clear();
}
```

```typescript
// packages/core/src/history.ts
public clear() {
    // 刪除儲存在 SessionStorage 的加密金鑰
    SessionStorage.remove(historySessionStorageKeys.key)
    SessionStorage.remove(historySessionStorageKeys.iv)
}
```

### 加解密頁面紀錄

在 `history.ts` 檔案中，我們可以看到 Inertia.js 會根據 `encryptHistory` 的值是否為 `true` 來決定要不要加密頁面紀錄。

```typescript
// packages/core/src/history.ts

protected getPageData(page: Page): Promise<Page | ArrayBuffer> {
    return new Promise((resolve) => {
        return page.encryptHistory ? encryptHistory(page).then(resolve) : resolve(page)
    })
}
```

Inertia.js 使用 Crypto API 對頁面紀錄進行加密。

```typescript
// packages/core/src/encryption.ts

export const encryptHistory = async (data: any): Promise<ArrayBuffer> => {
  // ...

  const encrypted = await encryptData(iv, key, data);

  return encrypted;
};

// ...

const encryptData = async (iv: Uint8Array, key: CryptoKey, data: any) => {
  // ...

  return window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoded.subarray(0, result.written)
  );
};
```

解密的部分也是放在 `encryption.ts` 檔案中。

```typescript
// packages/core/src/encryption.ts

export const decryptHistory = async (data: any): Promise<any> => {
  // ...

  return await decryptData(iv, storedKey, data);
};

const decryptData = async (iv: Uint8Array, key: CryptoKey, data: any) => {
  // ...

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    data
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
};
```

## 參考資料

- [Jonathan Reinink 的推文](https://x.com/reinink/status/1836165182294209021)
- [History encryption](https://inertiajs.com/history-encryption)
- [History Encryption in Inertia.js 2.0 and Laravel](https://www.youtube.com/watch?v=gTMX4JM_-0E)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
