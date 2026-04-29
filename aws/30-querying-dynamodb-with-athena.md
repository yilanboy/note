---
layout: default
parent: AWS
nav_order: 30
---

# 透過 AWS Athena 查詢 DynamoDB 資料

## 前言

DynamoDB 是 AWS 上的 NoSQL 資料庫，雖然效能優異，但在進行複雜查詢時相當受限。如果想對 DynamoDB 的資料做 SQL 查詢、跨表格 JOIN 或聚合分析，原生 API 很難做到。

AWS Athena 的 **Federated Query（聯合查詢）** 功能正好解決這個問題，透過 Lambda Connector 作為橋接層，讓 Athena 可以用 SQL 直接查詢 DynamoDB 的資料，而不需要先把資料 ETL 到別的地方。

這篇筆記記錄如何用 Terraform 把這整套架構部署起來。

## 架構概覽

```text
使用者送出 SQL 查詢
        │
        ▼
┌───────────────────────────────┐
│  Athena Workgroup             │  ← 執行 SQL，結果存到 S3
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│  Athena Data Catalog          │  ← FEDERATED 類型，橋接 DynamoDB
│  (dynamodb-connector-catalog) │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│  Lambda Connector             │  ← 由 SAR 部署，實際呼叫 DynamoDB API
│  (AthenaDynamoDBConnector)    │
└──────────────┬────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
 DynamoDB Tables    S3 Spill Bucket
 (原始資料來源)      (溢出暫存，超過 Lambda 記憶體時使用)
```

整個流程如下：

1. 使用者對 Athena Workgroup 送出 SQL 查詢
2. Athena 辨識出這是 Federated Catalog，呼叫對應的 Lambda Connector
3. Lambda Connector 呼叫 DynamoDB API 取得資料
4. 若資料量超過 Lambda 記憶體上限，多餘的資料會先溢出到 Spill S3 Bucket
5. 查詢結果回傳給 Athena，最終寫入 Query Results S3 Bucket
6. 使用者可從 Athena Console 或 API 取得結果

## 元件說明

| 元件                  | 名稱                                       | 用途                                 |
| --------------------- | ------------------------------------------ | ------------------------------------ |
| S3 Bucket             | `athena-dynamodb-connector-spill-bucket-*` | Connector Lambda 的溢出暫存桶        |
| S3 Bucket             | `athena-query-results-*`                   | Athena 查詢結果存放處                |
| CloudFormation Stack  | `athena-dynamodb-connector`                | 透過 SAR 部署 Lambda Connector       |
| Lambda Function       | 由 SAR Stack 建立                          | 實際執行 DynamoDB 查詢的核心元件     |
| Athena Data Catalog   | `dynamodb-connector-catalog`               | FEDERATED 類型的資料目錄             |
| Glue Catalog Database | `dynamodb_database`                        | DynamoDB 表格的 schema metadata 管理 |
| Athena Workgroup      | `dynamodb-workgroup`                       | 執行查詢的工作群組，指定結果輸出位置 |

## Terraform 程式碼說明

### 1. Provider 設定

```hcl
provider "aws" {
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = "Test"
      Owner       = "Allen Chiang"
      Project     = "QueryDynamoDBWithAthena"
    }
  }
}
```

透過 `default_tags` 統一幫所有資源打上標籤，方便成本管理與資源識別。

### 2. S3 Spill Bucket

```hcl
resource "random_string" "spill_bucket_suffix" {
  length  = 4
  upper   = false
  special = false
  numeric = false
}

resource "aws_s3_bucket" "athena_dynamodb_connector_spill_bucket" {
  bucket = "athena-dynamodb-connector-spill-bucket-${random_string.spill_bucket_suffix.result}"
}
```

S3 Bucket 名稱必須全球唯一，因此用 `random_string` 加上後綴避免命名衝突。

Spill Bucket 是 Athena Federated Query 的必要元件：當 Lambda Connector 處理的資料量超過其記憶體限制時，多餘的資料會先溢出到這個 bucket，Athena 再從這裡讀取合併。預設情況下溢出資料使用 AES-GCM 加密，也可以指定 KMS Key 進一步管理金鑰。

### 3. 部署 AthenaDynamoDBConnector

```hcl
data "aws_serverlessapplicationrepository_application" "athena_dynamodb_connector" {
  application_id = "arn:aws:serverlessrepo:us-east-1:292517598671:applications/AthenaDynamoDBConnector"
}

resource "aws_serverlessapplicationrepository_cloudformation_stack" "athena_dynamodb_connector" {
  name             = "athena-dynamodb-connector"
  application_id   = data.aws_serverlessapplicationrepository_application.athena_dynamodb_connector.application_id
  semantic_version = data.aws_serverlessapplicationrepository_application.athena_dynamodb_connector.semantic_version
  capabilities     = data.aws_serverlessapplicationrepository_application.athena_dynamodb_connector.required_capabilities

  parameters = {
    AthenaCatalogName = "dynamodb-connector-catalog"
    SpillBucket       = aws_s3_bucket.athena_dynamodb_connector_spill_bucket.bucket
  }
}
```

AWS 在 Serverless Application Repository（SAR）上提供了官方的 `AthenaDynamoDBConnector`。這裡用 `data` source 取得最新版本資訊，再透過 CloudFormation Stack 部署。

- `AthenaCatalogName`：指定 Connector 對應的 Athena Data Catalog 名稱，必須與後面建立的 Catalog 同名，且只能使用小寫
- `SpillBucket`：指定溢出資料的暫存 bucket
- `capabilities`：CloudFormation Stack 需要 `CAPABILITY_IAM` 和 `CAPABILITY_RESOURCE_POLICY` 才能建立 IAM Role 和資源策略

若選擇手動從 SAR Console 部署，步驟如下：

1. 進入 **Serverless Application Repository** → **Available applications**
2. 勾選「Show apps that create custom IAM roles or resource policies」
3. 搜尋 `AthenaDynamoDBConnector` 並選擇
4. 填入 `AthenaCatalogName` 和 `SpillBucket` 等參數
5. 勾選 IAM 確認並點擊 **Deploy**

### 4. Athena Data Catalog（Lambda）

```hcl
resource "aws_athena_data_catalog" "dynamodb" {
  depends_on = [aws_serverlessapplicationrepository_cloudformation_stack.athena_dynamodb_connector]

  name        = "dynamodb-connector-catalog"
  description = "Athena data source for querying DynamoDB via federated query"
  type        = "LAMBDA"

  parameters = {
    function = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:dynamodb-connector-catalog"
  }
}
```

這是整個架構的核心：建立一個 `LAMBDA` 類型的 Athena Data Catalog。

- `type = "LAMBDA"` 告訴 Athena 這個 Catalog 要透過 Lambda Connector 存取外部資料來源
- `name` 必須與 CloudFormation Stack 中的 `AthenaCatalogName` 相同
- `depends_on` 確保 Lambda Connector 先部署完成才建立 Catalog
- Data Catalog 名稱不可使用保留字：`awsdatacatalog`、`hive`、`jmx`、`system`

### 6. Query Results Bucket 與 Workgroup

```hcl
resource "aws_s3_bucket" "athena_query_results" {
  bucket = "athena-query-results-${random_string.spill_bucket_suffix.result}"
}

resource "aws_athena_workgroup" "dynamodb" {
  name = "dynamodb-workgroup"

  configuration {
    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_query_results.bucket}/results/"
    }
  }
}
```

Athena Workgroup 是執行查詢的邏輯單位，可以控制查詢的輸出位置、掃描資料量上限等設定。這裡指定查詢結果存到專用的 S3 Bucket。

## IAM 權限需求

Connector Lambda 的 IAM Role 由 SAR CloudFormation Stack 自動建立，底層需要以下權限：

| 服務              | 權限                                                          | 用途                             |
| ----------------- | ------------------------------------------------------------- | -------------------------------- |
| S3                | Write                                                         | 將溢出資料寫入 Spill Bucket      |
| Athena            | `GetQueryExecution`                                           | 偵測上游查詢是否已終止，快速失敗 |
| Glue Data Catalog | Read-only                                                     | 讀取 Table schema metadata       |
| DynamoDB          | `DescribeTable`, `ListSchemas`, `ListTables`, `Query`, `Scan` | 執行實際查詢                     |
| CloudWatch Logs   | Write                                                         | 記錄 Lambda 執行日誌             |

## 部署步驟

```bash
terraform init
terraform plan
terraform apply
```

部署完成後，AWS 上會建立好所有元件，可以開始使用 Athena 查詢 DynamoDB。

## 如何使用

### 基本查詢

在 Athena Console 選擇 `dynamodb-workgroup` workgroup，查詢時需同時指定 federated catalog、database 和 table：

```sql
SELECT *
FROM "dynamodb-connector-catalog"."default"."my_table"
LIMIT 100;
```

## 功能限制

使用 AthenaDynamoDBConnector 時需注意以下限制：

- **不支援寫入操作**：`INSERT INTO`、`UPDATE`、`DELETE` 均不支援，僅能執行 `SELECT`
- **欄位大小寫**：若搭配 Lake Formation 使用，只能識別全小寫的 table 和 column 名稱
- **不支援 Multiplexing**：使用 Glue Connections 方式部署時不支援 multiplexing handler
- **Sort Key 多條件過濾**：需要 v2023.11.1 以上版本才能在同一 sort key 欄位上使用多個過濾條件

## 效能注意事項

- **Hash Key 查詢**：若 `WHERE` 條件包含 Partition Key 的多個明確值，Connector 會對每個值發出一次 DynamoDB `Query` 呼叫，效率較高
- **其他條件**：使用非 Key 欄位過濾時，底層為 `Scan` 操作，會掃描整張表，RCU 消耗高
- **選取欄位**：`SELECT *` 不一定比 `SELECT col1, col2` 快，在某些情況下選取部分欄位反而會增加執行時間，建議實際測試後決定
- **LIMIT 下推**：`LIMIT` 子句會被下推到 DynamoDB 層，可有效減少不必要的資料讀取

## 費用考量

這個架構會產生以下費用：

- **Athena 查詢費用**：每次查詢依掃描的資料量計費（$5 / TB）
- **Lambda 執行費用**：每次查詢都會觸發 Lambda Connector
- **S3 儲存與請求費用**：Spill Bucket 和 Query Results Bucket 的存取費用
- **DynamoDB 讀取費用**：Scan 操作會消耗大量 RCU，對 Provisioned Throughput 表格影響尤其顯著

對於 production 環境，建議：

1. 設定 Athena Workgroup 的 `bytes_scanned_cutoff_per_query` 限制單次查詢掃描量上限
2. 定期清理 Spill Bucket 和 Query Results Bucket 中的舊資料
3. 評估是否需要定期將 DynamoDB 資料匯出到 S3 + Glue，改用 Athena 直接查 Parquet，對高頻查詢場景成本更低

## 小結

透過 Athena Federated Query + AthenaDynamoDBConnector，可以用熟悉的 SQL 語法查詢 DynamoDB，適合以下場景：

- 臨時性的資料探索與分析
- 跨 DynamoDB 表格的聯合查詢
- 搭配 Glue 其他資料來源做跨系統 JOIN
- 快速驗證資料內容，不需建立額外的 ETL pipeline

整個架構用 Terraform 管理，部署、版本控制、重現都很方便。

## 參考資料

- [Amazon Athena DynamoDB Connector - 官方文件](https://docs.aws.amazon.com/athena/latest/ug/connectors-dynamodb.html)
- [透過 Serverless Application Repository 部署 Athena Connector - 官方文件](https://docs.aws.amazon.com/athena/latest/ug/connect-data-source-serverless-app-repo.html)
