---
layout: default
parent: AWS
nav_order: 29
---

# AWS STS (Security Token Service)

STS 是 AWS 非常基礎的一項服務，主要用來產生臨時的安全認證 (Temporary Security Credentials)，這些認證可以用來存取 AWS 資源。

基本上 AWS 中跨服務的存取控制，都是透過 IAM (Identity and Access Management) 來管理，而 IAM 會透過 STS 的臨時認證來實現這些存取控制。

## 參考資料

- [IAM 中的暫時安全憑證](https://docs.aws.amazon.com/zh_tw/IAM/latest/UserGuide/id_credentials_temp.html)
