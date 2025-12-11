---
layout: default
parent: AWS
nav_order: 26
---

# SigV4

AWS Signature Version 4 (SigV4) 是 AWS 用於對 API 請求進行身份驗證的協議，不論是 AWS CLI 還是 AWS SDK（例如 Python Boto3），都是使用 SigV4 進行身份驗證並授權對 AWS 資源的操作。

SigV4 的簽名具有時效性，因為長期性的金鑰（AWS Access Key 和 AWS Secret Key）一但洩漏就會有很高的資安風險，因此使用 SigV4 可以避免金鑰洩漏的風險。

## 標頭（Header）格式

SigV4 的簽名資訊會放在 HTTP Header 中，格式範例如下：

> 下列範例顯示 SigV4 的 Authorization 標頭值。為了便於閱讀，向此範例新增了分行符號。在程式碼中，標頭必須是一個連續字串。演算法與憑證之間沒有逗號，但其他元素必須以逗號分隔。

```text
Authorization: AWS4-HMAC-SHA256
Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request,
SignedHeaders=host;range;x-amz-date,
Signature=fe5f80f77d5fa3beca038a248ff027d0445342fe2855ddc963176630326f1024
```

- `Authorization`：用於計算簽章的演算法。SigV4 使用 `AWS4-HMAC-SHA256`。
- `Credential`：您的存取金鑰 ID 和範圍資訊。SigV4 格式為 `<your-access-key-id>/<date>/<aws-region>/<aws-service>/aws4_request`。
- `SignedHeaders`：以分號分隔的請求標頭清單，用於計算 Signature。
- `Signature`：256 位元的實際的簽名值，以 64 個小寫十六進位字元表示。

## 簡單的使用範例

使用 Docker 快速的建立一個 AWS SigV4 Proxy 服務器

```bash
# 拉取 aws-sigv4-proxy 的 image
docker pull public.ecr.aws/aws-observability/aws-sigv4-proxy:latest

# 建立 aws-sigv4-proxy 的 container
docker create --name aws-sigv4-proxy -it \
    --memory=64MB --restart unless-stopped \
    --env AWS_ACCESS_KEY_ID=${IAM_ACCESS_KEY} \
    --env AWS_SECRET_ACCESS_KEY=${IAM_SECRET_KEY} \
    --publish 0.0.0.0:8080:8080 \
    public.ecr.aws/aws-observability/aws-sigv4-proxy -v

docker start aws-sigv4-proxy
```

使用 curl 進行測試，使用 aws-sigv4-proxy 進行轉發，清空 AWS IOT 上的特定 Topic。

```bash
curl -s --noproxy "*" -X POST "http://localhost:8080/topics/${TITLE}?qos=1&retain=true" -H 'host: data-ats.iot.us-west-2.amazonaws.com' -d ''
```

## 參考資料

- [AWS Sigv4 in 3 mins](https://towardsaws.com/aws-sigv4-in-3-mins-c324d20f19cf)
- [AWS API 請求的簽章版本 4](https://docs.aws.amazon.com/zh_tw/IAM/latest/UserGuide/reference_sigv.html)
