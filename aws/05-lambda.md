---
layout: default
parent: AWS
nav_order: 5
---

# Lambda

為 AWS 無伺服器運算服務，優點是根據用量付費，沒有最低消費，完全不使用就不會有費用產生
，但缺點就是沒有上限，用量大起來費用會十分驚人。

## Function

放在 Lambda 上面的程式稱為 Function。Lambda 背後的技術是使用 AWS 自己研發的 [Firecracker](https://firecracker-microvm.github.io/)，可以快速地開啟一個 MicroVM。

Lambda 會在事件進來之後立刻開啟一個 MicroVM 來處理進來的事件。並在處理完事件之後關閉 MicroVM。
所以 Lambda 上面除了程式碼之外，無法儲存任何檔案 (例如靜態資源就無法放在 Lambda 上面)。

如果你有一個服務需要多個 Function 在背後運行，可以建立一個 Lambda Application，並將所有 Function 放在這個 Application 中。

## Layer

Lambda 無法讓用戶 SSH 至伺服器上設定環境。如果你有想安裝的程式碼依賴套件，可以將依賴套件的相關檔案打包成 zip 並上傳到 Lambda Layer。

Layer 可以給多個 Function 重復使用，當 Function 會解壓縮 Layer 中的檔案並放在 `/opt` 資料夾底下。

可以參考[這篇文章](https://community.aws/content/2d6gQDnHqIbWLLKikuSfwmOZrym/step-by-step-guide-to-creating-an-aws-lambda-function-layer)學習如何打包 Python 的依賴套件檔案。

**注意每個 Function 至多只能使用 5 個 Layer**。

## Network

Lambda 可以放置在 VPC 底下，讓 Lambda 其他服務放在一起並在私有網路底下快速的存取它們，
例如 ElastiCache 與 RDS (Relational Database Service)。

但要注意放在 VPC 底下的 Lambda 無法對網際網路發送請求，因為 Lambda 不具備 Public IP 也無法綁定一個 Public IP。
所以必須要再加上一個 NAT 來讓 Lambda 訪問網際網路。

如果想要讓 API Gateway 觸發在 VPC 底下的 Lambda，並不需要經過 NAT。

## Persistent Storage with EFS

Lambda 上可以掛 EFS (Elastic File System)，讓其擁有持久性的儲存空間用來放置檔案。
但注意有幾個前置條件。

- Lambda 需要與 EFS 一同放置在 VPC 底下 (這樣 Lambda 就會失去與外面直接互通的能力)。
- Lambda 的 IAM 需要幾個操作 EFS 的權限。有 `elasticfilesystem:ClientMount` 與 `elasticfilesystem:ClientWrite` (唯讀連線則不需要)。
- EFS 檔案系統的安全群組中必須允許傳入 NFS 通訊 (連接埠 2049)
- 在 Lambda 上掛載檔案系統的位置，以 **「/mnt/」開頭。例如「/mnt/lambda」**。

## SnapStart

當 SnapStart 開啟時，`Init` 階段會在上傳新版本的函式時觸發，觸發後會將準備好的環境快照起來。
這樣函式下次執行時，就可以直接執行。

## Preserved Concurrency

Preserved Concurrency 會在你修改設定時觸發，觸發後會初始化執行環境。
Lambda 會確保你每次調用函式時，執行環境始終是準備好的狀態。

## 使用 AWS CLI 更新 Lambda 的環境變數

在 AWS CLI 中可以透過以下指令取得 Lambda Function 的設定。

```bash
aws lambda get-function-configuration \
--function-name my-function \
--region us-west-2
```

指令會以 JSON 格式顯示結果，可以搭配 `jq` 指令使用。

```bash
# 顯示 Lambda Function 某個環境變數 MAINTENANCE_MODE 的值
aws lambda get-function-configuration \
--function-name my-function \
--region us-west-2 | jq -r '.Environment.Variables.MAINTENANCE_MODE'
```

既然可以取得環境變數，那麼當然也能更新環境變數，我們可以透過 `update-function-configuration` 來做到這件事情。

```bash
aws lambda update-function-configuration \
--function-name my-function \
--region us-west-2 \
--environment "Variables={BUCKET=DOC-EXAMPLE-BUCKET,KEY=file.txt}"
```

但注意這裡有個坑，你無法只更新部分的環境變數。舉個例子，假設你有一個 Function 擁有 10 個環境變數，而你只想更新其中某 1 個環境變數的值，你不能這樣做。

```bash
# 這樣除了 MAINTENANCE_MODE 這個環境變數會保留以外，其他的環境變數都會被刪除
aws lambda update-function-configuration \
--function-name my-function \
--region us-west-2 \
--environment "Variables={MAINTENANCE_MODE='1'}"
```

正確做法是提供全部的環境變數，但寫一長串環境變數可能過於麻煩，我們可以結合剛剛的指令 `get-function-configuration` 一起使用。

```bash
ENVIRONMENT=$(aws lambda get-function-configuration \
--function-name my-function \
--region us-west-2 | jq -r '.Environment')

# 更新環境變數
NEW_ENVIRONMENT=$(echo $ENVIRONMENT | jq -r '.Variables.MAINTENANCE_MODE="1"|tostring')

# https://github.com/aws/aws-cli/issues/2638
aws lambda update-function-configuration \
--function-name my-function \
--region us-west-2 \
--environment $NEW_ENVIRONMENT
```

## SAA 筆記

- **Lambda 執行時間最多為 15 分鐘**，超過這個時間的任務就不適合使用 Lambda。
- Lambda 可以設置環境變數來讓 Function 使用。可以直接在 Portal 上看到，如果有安全上的疑慮可以使用冷啟動，即在程式碼啟動後去 Parameter Store 或是 Secret Manager 中取得需要的設定值，不使用環境變數。缺點是第一次啟動會較慢。
- Lambda 的環境變數可以使用 KMS (Key Management Service) 的金鑰來加密。
- Lambda Function 可以建立一個 URL 來讓外部用戶訪問或是呼叫。
  如果想使用自己的 FQDN，可以搭配 API Gateway 做 Custom Domain Name 的 Mapping。
- 提供 10GB 暫時性的存儲空間，詳細可以參考[這裡](https://aws.amazon.com/tw/blogs/aws/aws-lambda-now-supports-up-to-10-gb-ephemeral-storage/)。
- 你可以將你的程式打包成容器在 Lambda 上面運行，但執行速度取決於容器的啟動速度，較為大型的應用，效果通常不會太好

## 參考資料

- [如何建立正確的 EFS 存取點組態，以使用 Lambda 函數掛載我的檔案系統？](https://repost.aws/zh-Hant/knowledge-center/efs-mount-with-lambda-function)
- [Understanding the Lambda execution environment lifecycle](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html)
