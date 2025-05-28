---
layout: default
parent: Web
nav_order: 1
---

# 密碼金鑰？

前陣子為了幫自己的部落格加入密碼金鑰登入的功能，花了一些時間去了解密碼金鑰背後的運作原理。趁著自己還記憶猶新的時候，我想寫一篇文章記錄一下這次學到的密碼金鑰概念，主要是針對專有名詞與驗證流程進行說明。

## 什麼是密碼金鑰（Passkey）？

密碼金鑰是一種新型的身份驗證方法，目的在取代傳統的密碼驗證。

它基於非對稱加密技術，使用一組金鑰對（Key Pair）來進行身份驗證：一個公開金鑰（數位憑證）和一個私密金鑰。用戶可以使用驗證裝置（手機、電腦或 Yubikey），向網站（信賴方）註冊密碼金鑰。驗證裝置會產生一對公私鑰，公鑰會儲存在網站的伺服器上，以便將來驗證的時候使用，私鑰則會安全的儲存在驗證裝置上。

因為私鑰從頭到尾都不會離開用戶的設備，即使伺服器遭到攻擊，攻擊者也無法獲取用戶的私鑰。

## 認識密碼金鑰的標準與角色

當初在研究密碼金鑰如何實作時，我被一堆相關的專有名詞搞得頭昏眼花。這裡簡單的說明密碼金鑰中的角色與它們間會使用到的標準：

- **WebAuthn API**：是一個網路標準，讓網站能使用公開金鑰密碼學來註冊和驗證使用者，而無需依賴傳統密碼。目前大多數瀏覽器都已支援 WebAuthn API。

  ```javascript
  // 你可以使用下面 JavaScript 程式碼來檢查瀏覽器是否支援 WebAuthn API
  // 注意瀏覽器只允許你在有 HTTPS 的情況下使用 WebAuthn API
  window.PublicKeyCredential;
  ```

- **CTAP**：全稱為 Client to Authenticator Protocol ，即「客戶端到身份認證裝置協議」。它描述了客戶端（例如瀏覽器、作業系統或應用程式）如何與驗證裝置（例如 YubiKey）進行通訊，以執行身份驗證操作。

- **FIDO2**：是使用者驗證的開放標準，目的在加強使用者對線上服務的登入方式。由 FIDO（Fast IDentity Online）聯盟與全球資訊網協會（W3C）共同完成的專案。現在可以當作是 WebAuthn API 和 CTAP2 通訊協定的統稱。

- **Relying Party**：信賴方。也就是你的網路或行動應用程式。如果有一個網站提供 WebAuthn API 來註冊與驗證用戶的密碼金鑰，那麼這個網站就是一個信賴方。

- **Authenticato**r：使用者的驗證裝置。是一種可以生成公鑰憑證並交由信賴方註冊的加密實體。驗證裝置又可以分為漫遊（Roaming）與平台（Platform）兩大類型。漫遊類型如 YubiKey 這種 USB 裝置，可以「漫遊」在不同的設備上使用。平台類型則綁定設備，例如你的手機、電腦與平板，這些設備上因為具備安全晶片，所以能夠當作驗證裝置來使用。

- **Discoverable Credential**：可探索的憑證，舊稱為駐留金鑰 (Resident Key)。是一組包含公私鑰的金鑰對，公鑰由信賴方儲存，私鑰會儲存在驗證裝置上。支援可探索憑證的裝置，可以在不知道憑證 ID 的情況下進行驗證，用戶體驗上會更好。目前大多數新型驗證裝置都支援可探索憑證 ，例如密碼管理工具或新式 YubiKey。

> 與可探索的憑證相對應的，就是非探索的憑證（Non-Discoverable Credential）。驗證裝置不會儲存憑證，因此需要對裝置提供憑證 ID 來進行驗證。
>
> 更詳細的非探索憑證說明，可以參考黑大的這篇文章 - [WebAuthn 無密碼登入不等於 Passkey](https://blog.darkthread.net/blog/non-discoverable-credential-isnt-passkey/)。

這些專有名詞可能會讓你感覺很複雜，但 Yubico 有一張圖可以很清楚明瞭的呈現這些名詞之間的關係。

![Yubico Passkey Graph](https://blobs.docfunc.com/images/2025_04_15_13_07_01_fc6ba0b61466.png)

## 密碼金鑰的註冊與驗證流程

介紹完了密碼金鑰中的標準與角色，我們來看看在密碼金鑰的註冊與驗證過程中，前端（客戶端）與後端（信賴方）是如何進行溝通的。

### 註冊密碼金鑰的流程

1. 前端向後端請求註冊所需的資料（Credential Creation Options），開始註冊程序。

2. 前端使用 WebAuthn API 呼叫驗證裝置，讓裝置根據資料產生一組金鑰對：公開金鑰憑證與私密金鑰。

3. 前端會將新出爐的憑證傳送至後端。

4. 後端會對憑證進行驗證（Attestation），如果驗證通過，會將憑證與相關資訊儲存在資料庫中，以供未來驗證用戶身份時使用。

5. 後端發送信件通知用戶有新註冊的密碼金鑰。

### 驗證密碼金鑰的流程

1. 前端向後端請求驗證所需的資料（Credential Request Options），開始驗證程序。

2. 前端使用 WebAuthn API 呼叫驗證裝置，讓裝置使用儲存在其中的私鑰，根據資料產生公開金鑰憑證。

3. 前端將憑證傳送至後端。

4. 後端驗證（Assertion）憑證，與檢查憑證是否存在於資料庫中，如果存在就將對應的用戶進行登入。

> 注意當用戶註冊密碼金鑰後，就不應該允許用戶使用密碼登入。用戶可以使用密碼金鑰直接登入，或是搭配傳統密碼做多因素驗證。

## 參考資料

- [Google Developer - 使用密碼金鑰進行無密碼登入](https://developers.google.com/identity/passkeys?hl=zh-tw)
- [WebAuthn 無密碼登入不等於 Passkey](https://blog.darkthread.net/blog/non-discoverable-credential-isnt-passkey/)
- [Web Authentication: An API for accessing Public Key Credentials Level 2](https://www.w3.org/TR/webauthn-2/)
