# CA 憑證

紀錄使用 certbot 向 Let's Encrypt 申請網域 `example.com` 憑證的流程

## 證明網域所有權

1. 憑證管理軟體 (certbot) 會向 Let's Encrypt CA 發起申請
2. 憑證管理軟體會產生一組公私鑰，並將公鑰交給 CA
3. CA 會提供兩種挑戰，擇一即可，用來讓 Server 證明其確實擁有網域所有權
    - 在 `example.com` 下設定 DNS 紀錄 (dns-01)
    - 在 `http://example.com` 的特定路徑底下提供 HTTP 文件 (http-01)
4. 以 http-01 挑戰為例，CA 產生一組隨機數 (nonce) 交給憑證管理軟體，請它將這組隨機數使用私鑰簽名後寫入文件，並將文件放在網站上的特定路徑
5. 憑證管理軟體完成後會通知 CA 進行檢查
6. CA 會從網站上的特定路徑下載文件並確認內容
7. 驗證通過，剛剛的公私鑰會被用作「授權金鑰對」，並開始頒發憑證

## 頒發憑證

1. 憑證管理軟體發出憑證管理請求並用授權金鑰對簽名
2. 憑證管理軟體建立一個憑證簽署請求 (Certificate Signing Request, CSR)，要求 CA 頒發憑證
3. CSR 通常會包含由另外一組私鑰加密的資料與其對應的公鑰，此外 CSR 會由授權金鑰進行簽名
4. 當 CA 收到請求後會檢查兩組簽名
5. 如果驗證成功，CA 會用 CSR 中的公鑰替 `example.com` 的憑證簽名，再將文件回傳給憑證管理軟體

## 註銷憑證

1. 憑證管理軟體使用授權金鑰幫助消請求簽名並發送給 CA
2. CA 確認過簽名後，便將註銷消息發布到 OCSP (Online Certificate Status Protocol) 伺服器，以便讓瀏覽器等有關程式知道該憑證已被註銷

## 筆記

- CA 不會產生與保管私鑰，公私鑰皆由 Server 上的憑證管理軟體產生，避免惡意 CA 將私鑰另做它途

## 參考資料

- [certbot - frequently asked questions](https://certbot.eff.org/faq)
- [Let's encrypt 運作原理](https://letsencrypt.org/zh-tw/how-it-works/)
- [What harm can a malicious CA do?](https://security.stackexchange.com/questions/61730/what-harm-can-a-malicious-ca-do)
