---
layout: default
parent: TypeScript
nav_order: 9
---

# TypeScript 進階設定指南 (Strict Mode 以外的實用設定)

> Gemini 生成。

**頻道**: Web Dev Simplified
**影片**: [Strict TypeScript Isn't Enough Anymore](https://www.youtube.com/watch?v=35cESnxXH6o))

這份筆記涵蓋了超過 15 種在 `tsconfig.json` 中可以加入的進階設定。這些設定建立在 `strict: true` 的基礎上，能進一步提升 TypeScript 的型別安全與程式碼整潔度。

## 1. 開發體驗優化 (路徑別名)

- **`paths`** [00:01:44]: 允許設定絕對路徑匯入（例如將 `@/*` 指向 `./src/*`），避免深層相對路徑匯入（如 `../../../`）帶來的困擾。在重構和移動檔案時，不需一直重新修改相對路徑，非常方便。

## 2. 讓程式碼更乾淨的必備設定 (No-brainers)

- **`noUnusedLocals: true`** [00:04:04]: 若有未使用的區域變數會發出警告，有助於清理重構後忘記刪除的無用變數。
- **`noUnusedParameters: true`** [00:04:09]: 若函數中有未被使用的參數會發出警告。
- **`allowUnusedLabels: false`** [00:04:59]: 禁用未使用的 Labels（標籤）。在 JavaScript 中不小心用到標籤，通常是因為在物件外部打錯字（例如不小心把 key-value 寫到物件外面），這能有效防止此類語法錯誤。
- **`noUncheckedSideEffectImports: true`** [00:06:04]: 當你匯入一個只有副作用的檔案（如 `import "./analytics"`），如果檔案不存在或打錯字，TypeScript 預設不會報錯。開啟此設定能確保匯入的檔案確實存在。
- **`noFallthroughCasesInSwitch: true`** [00:07:00]: 防止 `switch` 語句中漏寫 `break` 或 `return`，導致意外繼續執行下一個 case 的錯誤。
- **`allowUnreachableCode: false`** [00:08:09]: 標記永遠不會被執行到的程式碼（例如寫在 `return` 之後的程式碼），提醒你將其移除以保持程式碼乾淨。

## 3. 強烈建議的進階型別安全設定

- **`noUncheckedIndexedAccess: true`** [00:08:49]: 當你存取陣列元素（例如 `numbers[10]`）時，TypeScript 會假設該值可能是 `undefined`，強迫你在使用前進行檢查（例如使用 `?`）。這能有效防止因陣列越界而導致的 Runtime 錯誤。
- **`noPropertyAccessFromIndexSignature: true`** [00:10:22]: 針對帶有 Index Signature 的物件（例如允許自訂 key 的設定物件），強迫必須用中括號 `obj['custom_key']` 來存取自訂屬性，而不能用點 `obj.custom_key`。這樣當你不小心把已知屬性打錯字時（如 `darkMod` 代替 `darkMode`），編譯器就能正確報錯。
- **`erasableSyntaxOnly: true`** [00:13:09]: 限制只能使用能在編譯時直接被「擦除 (erased)」的 TypeScript 語法。禁止使用會被轉譯成新 JavaScript 程式碼的語法（如 `enum`），確保程式碼能直接在支援型別擦除的環境（如 Node.js）中完美執行。

## 4. 個人偏好設定

- **`noImplicitOverride: true`** [00:14:41]: 在物件導向開發中，當子類別覆寫父類別的方法時，強迫必須加上 `override` 關鍵字，防止意外覆寫或打錯父類別方法名稱。
- **`noErrorTruncation: true`** [00:15:53]: 當型別錯誤訊息太長時，預設會被截斷以保持版面整潔。開啟此設定可顯示完整的錯誤與型別資訊，**建議僅在 Debug 複雜型別時暫時開啟**。
- **`exactOptionalPropertyTypes: true`** [00:16:58]: 強制要求可選屬性不能被明確賦值為 `undefined`。屬性要麼完全不存在，要麼就必須是符合規範的型別。這能避免使用 `in` 運算子檢查屬性是否存在時產生的潛在 Bug。

## 5. JavaScript 轉換至 TypeScript 的過渡設定

- **`allowJs: true`** [00:19:12]: 允許在 TypeScript 檔案中匯入 `.js` 檔案，這是漸進式重構專案的必備設定。
- **`checkJs: true`** [00:20:18]: 讓 TypeScript 也去檢查 `.js` 檔案中的型別錯誤。對於大型專案，建議此設定保持 `false`，並改為在需要檢查的特定 JS 檔案頂部加入 `// @ts-check` 註解，以便逐一遷移。
