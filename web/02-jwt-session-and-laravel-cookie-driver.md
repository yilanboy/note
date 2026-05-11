---
layout: default
parent: Web
nav_order: 2
---

# JWT、Session 與 Laravel Cookie Session Driver 的比較

最近在重新整理身份驗證（Authentication）相關的知識，發現自己對「Session 到底存在哪裡」、「JWT 為什麼難以撤銷」、「Laravel 那個 Cookie Driver 到底跟 JWT 差在哪」這幾件事一直模模糊糊。趁這次把幾份規範與框架文件讀過一遍，我想把傳統 Server-side Session、JWT（JSON Web Token）與 Laravel Cookie Session Driver 三種方案做一個完整的比較筆記，順便釐清自己過去的一些誤解。

這篇筆記的重點不在於「哪一個最好」，而是希望能夠回答一個問題：**在不同的場景下，我應該選擇哪一種方案？**

## 為什麼需要 Session？

HTTP 本身是無狀態（Stateless）的協定，伺服器在處理完一個請求之後，並不會「記得」剛剛是誰來敲門。但是現代應用幾乎都需要「使用者登入後，下一個請求伺服器要知道是同一個人」的能力，於是衍生出 Session 的概念。

讓伺服器在每個請求之間維持身份的方式，大致可以分成兩種思路：

- **Server-side State**：狀態存在伺服器，客戶端只持有一個指向狀態的「鑰匙」（通常是 Session ID）。
- **Client-side State**：狀態直接放在客戶端持有的 Token 裡面，伺服器只負責驗證。

JWT 屬於第二種思路，Laravel 的 Cookie Session Driver 也屬於第二種，但兩者在「加密」與「使用方式」上有很大的差異。

## 傳統 Server-side Session

### 運作流程

傳統 Server-side Session 是最直觀的做法：

1. 使用者輸入帳號密碼登入。
2. 伺服器產生一個 `session_id`，並將對應的使用者資訊（user id、權限、購物車內容等）存在伺服器端的 Session Store（記憶體、Redis、資料庫、共用檔案系統等）。
3. 透過 `Set-Cookie` 把 `session_id` 發給瀏覽器。
4. 之後每次請求瀏覽器都會自動帶上這個 Cookie。
5. 伺服器拿 `session_id` 去 Session Store 查詢使用者狀態。

```http
Set-Cookie: PHPSESSID=abc123def456; HttpOnly; Secure; SameSite=Lax; Path=/
```

### 優點

- **主動撤銷容易**：要踢人下線，刪除 Session Store 裡那筆紀錄即可，下次請求就會被當作未登入。
- **可稽核**：能夠列出目前所有登入中的使用者、強制特定使用者登出、查看登入裝置。
- **網路成本低**：Cookie 只帶 32 byte 左右的 ID，幾乎沒有頻寬負擔。
- **內容完全不外洩**：Session 內容根本沒有離開伺服器，攻擊者就算拿到 Cookie 也讀不到內容（只能拿來重放）。

### 缺點

- **需要 Session Store**：Redis、資料庫或共用檔案系統都是額外的依賴。
- **水平擴展需要設計**：要嘛使用 Sticky Session 把同一使用者導到同一台機器，要嘛使用共用的 Session Store。
- **微服務架構不友善**：每個服務都要查中心化的 Session Store，效能與耦合都成問題。
- **跨網域（Cross-Domain）困難**：Cookie 有同源限制，做 Single Sign-On（SSO）特別痛苦。
- **對行動 App、M2M API 不友善**：原本就不是為非瀏覽器設計的。

## JWT 的出現

### 結構與規範

JWT 由 [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519) 定義，是一種**自包含（Self-contained）的 Token 格式**。它把狀態從伺服器搬到 Token 自己身上，因此伺服器可以做到真正的無狀態。

JWT 由三段以 `.` 分隔的 Base64URL 字串組成：`Header.Payload.Signature`。

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature-here
```

- **Header**：演算法（`alg`，例如 `HS256`、`RS256`）與型別（`typ`）。
- **Payload**：claims，例如 `sub`（subject）、`exp`（expiration）、`iat`（issued at）、`iss`（issuer）、`aud`（audience）、`nbf`（not before）、`jti`（JWT ID）。
- **Signature**：使用密鑰對 `Header.Payload` 做簽章。

> [!IMPORTANT]
> JWT 的 Payload 只是 **Base64 編碼，不是加密**。任何拿到 Token 的人都可以直接 Base64 解碼讀內容。簽章只保證「沒被竄改」，**不保證「不能被看見」**。這是我以前最常搞錯的觀念。

### JWT 解決了什麼問題？

- **無狀態**：把使用者狀態放進 Token 自己身上，伺服器不用查中心化的 Session Store。
- **跨服務驗證**：任何持有驗證金鑰的服務都能獨立驗證 Token。
- **適合非對稱情境**：使用 RS256 時，發 Token 的服務用私鑰簽章，其他服務只需要公鑰就能驗證，非常適合微服務。
- **跨網域、SSO 場景**：因為驗證不依賴 Cookie 與同源限制，OAuth 2.0 / OIDC 大量採用 JWT 作為 Access Token / ID Token 的承載格式。

## JWT 的問題

### 結構性問題：撤銷（Revocation）困難

JWT 最大的問題是「**簽出去就收不回來**」，Token 在 `exp` 之前都會被驗證為有效。常見的痛點：

- 使用者按了登出按鈕，但 Token 在到期前仍然有效。
- 發現 Token 被盜取，過期前無法阻止攻擊者使用。
- 使用者改了密碼，舊 Token 仍然可以使用。

業界常見的折衷做法（本質上都是**偷偷把伺服器狀態加回來**）：

1. **短壽命 Access Token（5–15 分鐘）+ Refresh Token**：縮短洩漏的暴露窗口。
2. **Token Denylist（黑名單）**：把要撤銷的 `jti` 丟到 Redis，驗證時順便查一下；黑名單只需保留到 Token 的 `exp` 為止。
3. **Token Version 比對**：在使用者表加上 `token_version` 欄位，要全面撤銷時把它 +1，驗證 Token 時比對 `token_version` claim。

> [!CAUTION]
> 一旦用了 Denylist 或 Token Version，就等於放棄了 JWT「真正無狀態」的優勢。這沒有對錯，但要清楚自己在做什麼取捨。

### Payload 公開可讀

因為 Payload 只是 Base64 編碼，所以**絕對不要在 Payload 放敏感資訊**，例如密碼、信用卡號、個人識別資訊（PII）。如果真的有加密需求，可以使用 JWE（JSON Web Encryption），但複雜度會大幅上升。

### 簽章演算法陷阱

JWT 的歷史上有兩個經典漏洞，都跟「**信任 Header 裡的 `alg` 欄位**」有關：

- **`alg: none` 漏洞**：早期的 library 看到 `"alg": "none"` 就直接跳過簽章驗證。
- **HS256 / RS256 混淆漏洞**：伺服器原本用 RS256 驗證，攻擊者把 Header 改成 HS256，並使用「**公開的公鑰**」當作 HMAC 的 secret 來偽造簽章；如果 library 完全信任 Header 的 `alg`，就會把公鑰當對稱金鑰用，攻擊成功。

> [!IMPORTANT]
> 防禦方法很簡單也很重要：**驗證時演算法絕對不能信 Header，要在程式碼裡寫死白名單（Allowlist）**。

### Token 體積

- Session ID 通常 32 byte 左右。
- JWT 動輒幾百 bytes 到 1KB 以上。
- 每個請求都要帶，對行動裝置、API Gateway 都是額外的負擔。

## JWT 客戶端儲存方式比較

把 Token 放在哪裡，會直接決定攻擊面（Attack Surface）的範圍。

| 儲存位置                        | XSS 風險         | CSRF 風險 | 重新整理保留      | 適用場景            |
| ------------------------------- | ---------------- | --------- | ----------------- | ------------------- |
| `localStorage`                  | 🔴 高（JS 可讀） | 低        | ✅                | 不建議存 Token      |
| `sessionStorage`                | 🔴 高（JS 可讀） | 低        | ❌（關 tab 消失） | 不建議存 Token      |
| **HttpOnly Cookie**             | 🟢 JS 讀不到     | 🟡 需防禦 | ✅                | Web 場景首選        |
| In-memory（JS 變數）            | 🟡 同頁 JS 可讀  | 低        | ❌                | SPA 的 Access Token |
| iOS Keychain / Android Keystore | 由 OS 保護       | —         | ✅                | 行動原生 App        |

**為什麼 `localStorage` 是高風險**：`localStorage` 對所有同源 JS 開放讀取，第三方套件、CDN script、廣告 SDK 都能讀到，一行 `localStorage.getItem('token')` 就可能整個被偷走。

**HttpOnly Cookie 的正確設定**：

```http
Set-Cookie: token=eyJ...; HttpOnly; Secure; SameSite=Strict; Path=/
```

- `HttpOnly`：JavaScript 讀不到。
- `Secure`：只在 HTTPS 連線傳送。
- `SameSite=Strict` 或 `Lax`：擋掉跨站請求，緩解 CSRF。

**SPA 推薦的混合模式**：

```text
Access Token   → 存在 JS 記憶體（變數裡），重新整理就消失
Refresh Token  → 存在 HttpOnly Cookie，只送到 /refresh
```

這樣 XSS 拿不到 Refresh Token（因為 `HttpOnly`），CSRF 也打不到 Access Token（因為它根本不在 Cookie 裡）。

## 提升 JWT 安全性的做法

1. **短壽命 Access Token + Refresh Token**：縮短洩漏窗口。
2. **Refresh Token Rotation + Reuse Detection**：每次換新 Token 就讓舊的 Refresh Token 失效；如果偵測到同一個 Refresh Token 被使用兩次，整條 token family 全部撤銷。
3. **嚴格的演算法白名單**：呼叫 library 時傳入 `algorithms` 參數寫死，不信任 Header 的 `alg`。
4. **DPoP（Demonstrating Proof-of-Possession，[RFC 9449](https://datatracker.ietf.org/doc/html/rfc9449)）**：把 Token 綁定到客戶端的金鑰對，光偷 Token 沒用，攻擊者還必須拿到對應的私鑰。
5. **細粒度的 Claims 驗證**：`iss`、`aud`、`nbf`、`exp` 全部都要驗。
6. **Content Security Policy（CSP）**：限制可載入的腳本來源，降低 XSS 攻擊面（屬於補救性質）。
7. **不要在 Payload 放敏感資料**。
8. **密鑰管理**：HS256 至少 256 bit；優先選擇 RS256 / ES256；支援 `kid`（Key ID）以便多金鑰並存與輪換。

## Laravel Cookie Session Driver

接下來看 Laravel 比較特別的 Cookie Session Driver。剛開始接觸的時候我以為它就是 JWT 的另一種寫法，後來才發現它跟 JWT 有一個關鍵差異：**它真的用 AES 加密**。

### 運作原理

```text
Cookie Name  = session 名稱（通常是 laravel_session）
Cookie Value = AES_Encrypt(整包 session 資料, APP_KEY)
```

- 使用 `APP_KEY`（預設 AES-256-CBC）對整包 Session 資料進行加密。
- 加密後的密文放在 HttpOnly Cookie 裡。
- 伺服器本身**完全不儲存任何 Session 狀態**。
- Laravel 預設的 `config/session.php` 已經啟用 `http_only`、`secure`、`same_site=lax`，預設就是相對安全的設定。

> [!NOTE]
> 這是 Laravel Cookie Driver 和 JWT 的最大差異。JWT 只簽章不加密（Payload 公開可讀），Laravel Cookie Session 則是**真的把整包資料用 AES 加密放進 Cookie**，沒有 `APP_KEY` 完全解不開。

### 與 JWT、傳統 Session 的對照

| 特性           | 傳統 Session（Redis/DB） | JWT            | Laravel Cookie Session |
| -------------- | ------------------------ | -------------- | ---------------------- |
| 資料儲存位置   | 伺服器                   | 客戶端         | 客戶端                 |
| 資料是否加密   | N/A                      | ❌ 只簽章      | ✅ AES 加密            |
| 客戶端能讀內容 | 拿不到                   | ✅ Base64 解碼 | ❌ 沒 KEY 讀不到       |
| 客戶端能改內容 | 拿不到                   | ❌ 簽章會破    | ❌ 解不開就改不了      |
| 主動撤銷       | ✅ 容易                  | ❌ 困難        | ❌ 困難                |
| 預設儲存方式   | 伺服器自管               | 開發者決定     | HttpOnly Cookie        |

### 優點

1. **真正的無狀態**：不需要 Redis、資料庫或共用儲存；不需要 Sticky Session；非常適合 Serverless 部署（AWS Lambda、Cloud Run、Vercel）。
2. **資料保密性比 JWT 強**：因為是真加密，理論上可以放敏感資料（雖然還是不建議）。
3. **預設安全**：HttpOnly + Secure + SameSite 預設都開好。
4. **與 Laravel 生態完全相容**：CSRF Token、Flash messages、Auth guards、`old()`、validation errors 全部正常運作，使用者完全感受不到底層是 Cookie Driver。

### 缺點

1. **Cookie 4KB 大小限制**

   瀏覽器規範每個 Cookie 大約 4KB。整包資料經過 AES 加密後，因為 IV、padding、Base64 編碼會變得更大，實際可用空間大約只剩 3KB。一個 Laravel session 可能同時包含 Auth 資訊、CSRF Token、Flash messages、validation errors、`url.intended` 等等，膨脹很快。一旦超過上限，瀏覽器會直接把 Cookie 丟掉，使用者的體驗會是「**突然像是沒登入**」，而且 server log 看不到任何錯誤。

2. **每次請求都扛完整 session**

   上行的 Request Header 帶完整 Cookie，下行的 `Set-Cookie` 回完整內容。對行動裝置與慢速網路是有感的負擔，再加上每個請求都要做一次 AES 加解密，CPU 成本不是零。

3. **撤銷與 JWT 一樣困難**

   無法主動把使用者踢下線、無法列出目前在線的使用者、改密碼後舊 Cookie 仍然有效。

4. **`APP_KEY` 輪換會讓所有人登出**

   `APP_KEY` 同時用於整個 Laravel 的加密（Cookie、`Crypt::encrypt()`、Queue payload 等）。換了 key 之後，舊 Cookie 全部解不開，所有人被迫重新登入。Laravel 11 起支援 `APP_PREVIOUS_KEYS` 環境變數，可以保留舊 key 做解密、新 key 做加密，讓輪換能平滑進行。

5. **併發請求的競態問題（Race Condition）**

   多個 tab 或同時發出的 AJAX，每個 response 都會帶自己版本的 `Set-Cookie`，**最後寫入的會覆蓋前面的**。沒有任何 lock 機制。Session 內的計數器、購物車這類 read-modify-write 場景有資料遺失的風險。

6. **`APP_KEY` 洩漏是災難**

   `APP_KEY` 洩漏的影響範圍非常大：可以解密所有截獲的 Cookie；更恐怖的是**可以偽造任意 session 假冒任何使用者**。Server-side Session 即使 Redis 被攻破，也只是拿到目前活著的 Session，而 Cookie Driver 一旦 `APP_KEY` 外洩，攻擊者等於拿到「**無限發證的權限**」。

> [!CAUTION]
> `APP_KEY` 對 Cookie Session Driver 而言不只是一把加密金鑰，它幾乎等於「整個系統的根憑證」。專案的部署、CI、備份檔，都要把它當機密等級的資料看待。

### 適合與不適合的場景

**適合**：

- Serverless 部署、沒有共享儲存可用。
- 中小型應用、Session 資料量穩定且不大。
- 不需要 Active Session Management（強制登出、查看在線使用者）。

**不適合**：

- 需要強制登出、Session 稽核、查看在線使用者。
- Session 資料量大、容易接近或超過 4KB。
- 高度併發的 SPA / API。
- 金融、醫療等需要快速撤銷的場景。

## 三種方案綜合比較

| 比較項目            | 傳統 Server-side Session         | JWT                          | Laravel Cookie Session        |
| ------------------- | -------------------------------- | ---------------------------- | ----------------------------- |
| 狀態儲存位置        | 伺服器                           | 客戶端                       | 客戶端                        |
| 是否加密內容        | N/A（內容在伺服器）              | ❌ 僅簽章                    | ✅ AES 加密                   |
| 主動撤銷            | 🟢 容易                          | 🔴 困難                      | 🔴 困難                       |
| 水平擴展            | 🟡 需共用 Store 或 Sticky        | 🟢 天生支援                  | 🟢 天生支援                   |
| 跨網域 / SSO        | 🔴 困難                          | 🟢 容易                      | 🔴 困難（受 Cookie 限制）     |
| Cookie / Token 大小 | 32 byte                          | 數百 byte ～ 1KB+            | 受 4KB Cookie 限制            |
| 是否需要外部依賴    | 🔴 需要 Session Store            | 🟢 不需要                    | 🟢 不需要                     |
| 在線使用者稽核      | ✅ 可以                          | ❌ 不行                      | ❌ 不行                       |
| 適合場景            | 單體 + Active Session Management | 微服務、跨網域 API、行動 App | Serverless、小型 Laravel 應用 |

## 決策建議：什麼時候用哪個？

整理一下我自己的判斷依據：

- **單體應用 + Redis 已經存在** → 直接用傳統 Server-side Session，最簡單、可撤銷、可稽核。
- **微服務 / SSO / 跨網域 API** → JWT，搭配短壽命 Access Token + Refresh Token Rotation。
- **Serverless 部署，不想多顧一個 Redis** → Laravel Cookie Session Driver，但要謹慎管理 `APP_KEY` 並避開大型 Session。
- **金融、醫療這類需要即時撤銷的場景** → 傳統 Session，或 JWT + Denylist（接受多一筆 Redis 查詢的成本）。
- **原生行動 App** → JWT，存在 iOS Keychain 或 Android Keystore；Refresh Token 採用 Rotation + Reuse Detection。
- **SPA Web 應用** → Access Token 放 in-memory，Refresh Token 放 HttpOnly Cookie 的混合模式。

> [!NOTE]
> 沒有銀彈。當你準備在「無狀態」與「可撤銷」之間做取捨時，就是這篇筆記要派上用場的時候。

## 參考資料

- [RFC 7519 - JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 9449 - OAuth 2.0 Demonstrating Proof of Possession (DPoP)](https://datatracker.ietf.org/doc/html/rfc9449)
- [Laravel Documentation - HTTP Session](https://laravel.com/docs/session)
- [Laravel Documentation - Encryption](https://laravel.com/docs/encryption)
- [OWASP - JSON Web Token for Java Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [OWASP - Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN - Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
