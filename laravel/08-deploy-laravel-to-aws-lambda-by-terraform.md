---
layout: default
parent: Laravel
nav_order: 8
---

# 使用 Terraform 部署 Laravel 應用程式至 AWS Lambda

## 前言

Laravel 是 PHP 生態系中最受歡迎的 Web 框架之一，而 AWS Lambda 則是 Serverless（無伺服器）架構的代表性服務。將 Laravel 部署到 Lambda 上，可以省去管理伺服器的成本，並享受自動擴縮容（Auto Scaling）的優勢——沒有流量時不產生費用，有大量流量時自動擴展。

然而，**AWS Lambda 原生並不提供 PHP Runtime**。為了解決這個問題，本專案使用了 [Bref](https://bref.sh/)——一個開源的 PHP Runtime Layer，讓 PHP 應用程式能夠在 Lambda 上執行。搭配 Bref 提供的 [Laravel Bridge](https://github.com/brefphp/laravel-bridge)，我們可以讓 Laravel 應用程式幾乎不需要修改就能在 Lambda 上運行。

本文將介紹如何透過 Terraform 來定義並部署整套基礎設施。

## 架構總覽

整套架構由三個 Lambda Function 和多個 AWS 服務組成：

```text
                          ┌─────────────────────┐
                          │   AWS ACM 憑證       │
                          │  (TLS/SSL 憑證)      │
                          └────────┬────────────┘
                                   │
使用者 ──→ Custom Domain ──→ API Gateway v2 (HTTP) ──→ Web Lambda (Octane)
                                                          │
                                                          ├──→ DynamoDB (快取)
                                                          ├──→ S3 (靜態資源/檔案儲存)
                                                          └──→ SQS (佇列)
                                                                 │
                                                          Jobs Worker Lambda ←─┘
                                                                 │
                                                          Dead Letter Queue (失敗重試)

CloudWatch Events (排程) ──→ Artisan Lambda (指令排程)
```

### 三個 Lambda Function

| Lambda          | 用途              | Handler                                 | 記憶體  | 逾時   |
| --------------- | ----------------- | --------------------------------------- | ------- | ------ |
| **Web**         | 處理 HTTP 請求    | `Bref\LaravelBridge\Http\OctaneHandler` | 1024 MB | 28 秒  |
| **Artisan**     | 執行排程指令      | `artisan`                               | 1024 MB | 720 秒 |
| **Jobs Worker** | 處理 SQS 佇列任務 | `Bref\LaravelBridge\Queue\QueueHandler` | 1024 MB | 60 秒  |

- **Web Lambda**：透過 Laravel Octane 處理所有 HTTP 請求。`BREF_LOOP_MAX=250` 代表同一個 Lambda 實例最多處理 250 個請求後會重新啟動，避免記憶體洩漏。
- **Artisan Lambda**：由 CloudWatch Events 定時觸發（預設每天一次），執行 `schedule:run` 指令，等同於傳統伺服器上的 Cron Job。
- **Jobs Worker Lambda**：由 SQS 佇列事件觸發，處理背景任務（例如寄信、圖片處理等）。

### 支援的 AWS 服務

| 服務                      | 用途                                                 |
| ------------------------- | ---------------------------------------------------- |
| **API Gateway v2 (HTTP)** | 接收外部 HTTP 請求，轉發至 Web Lambda                |
| **AWS ACM**               | 提供自訂網域的 TLS/SSL 憑證                          |
| **DynamoDB**              | 作為 Laravel 的 Cache Driver（支援 TTL 自動過期）    |
| **SQS**                   | 作為 Laravel 的 Queue Driver，附帶 Dead Letter Queue |
| **CloudWatch Logs**       | 每個 Lambda 各自有 Log Group（保留 1 天）            |
| **S3**                    | 存放靜態資源（CSS/JS）和檔案上傳                     |
| **VPC**（選用）           | 讓 Lambda 能存取 VPC 內的資源（如 RDS 資料庫）       |
| **EFS**（選用）           | 提供持久化檔案系統，掛載於 `/mnt/efs`                |

## 為什麼選用 Bref？

AWS Lambda 原生支援的 Runtime 包括 Node.js、Python、Java、Go、.NET 等，但 **不包含 PHP**。[Bref](https://bref.sh/) 是一個開源專案，它透過 Lambda Layer 的機制提供 PHP Runtime，讓 PHP 應用程式能在 Lambda 上執行。

Bref 提供了 x86_64 和 ARM64 架構的 Layer，本專案使用 ARM64 架構：

- **PHP Layer**（`arm-php-85`）：提供 PHP Runtime，用於 Web 和 Queue Worker。

Layer ARN 可在 [Bref Runtimes 頁面](https://runtimes.bref.sh/) 查詢，需注意選擇正確的 AWS Region 和 CPU 架構。

## Terraform 檔案結構

```text
laravel-serverless/
├── main.tf          # 所有 AWS 資源定義
├── variables.tf     # 輸入變數宣告
├── locals.tf        # 區域變數（正規化 app_name）
├── data.tf          # Data Sources（AWS 帳號/Region 資訊）
├── output.tf        # 輸出值（Lambda ARN、API URL 等）
├── provider.tf      # AWS Provider 設定
├── terraform.tf     # Terraform 版本約束與 Backend 設定
└── .github/
    └── workflows/   # GitHub Actions 部署流程
```

以下逐一說明每個檔案的內容。

## terraform.tf — 版本約束與 Backend 設定

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {}
}
```

- 使用 AWS Provider `6.x` 版。
- Backend 設為 S3，但具體的 bucket、key 等設定透過 `-backend-config` 在 `terraform init` 時注入，避免將敏感資訊寫死在程式碼中。

## provider.tf — AWS Provider 設定

```hcl
provider "aws" {
  region = "us-west-2"

  default_tags {
    tags = {
      Service     = var.tag_service
      Environment = var.tag_environment
      Owner       = var.tag_owner
    }
  }
}
```

- 部署 Region 為 `us-west-2`（奧勒岡）。
- 使用 `default_tags` 讓所有資源自動套用統一的標籤，方便成本追蹤與資源管理。

## variables.tf — 輸入變數

所有可設定的參數都宣告在這個檔案中：

```hcl
# Provider 標籤
variable "tag_service" {}
variable "tag_environment" {}
variable "tag_owner" {}

# Lambda 設定
variable "filename" {
  default = "./laravel-app.zip"
}

variable "lambda_runtime" {
  default = "provided.al2023"    # Bref 使用 Custom Runtime
}

variable "php_lambda_layer_arn" {
  # Bref PHP Layer ARN，需定期更新
  default = "arn:aws:lambda:us-west-2:873528684822:layer:arm-php-85:12"
}

# VPC 設定（選用）
variable "enable_vpc" { default = false }
variable "subnet_ids" {}
variable "security_group_ids" {}

# EFS 設定（選用）
variable "enable_filesystem" { default = false }
variable "access_point_arn" {}

# API Gateway 設定
variable "certificate_arn" {}         # AWS ACM 憑證 ARN
variable "custom_domain_name" {}      # 自訂網域名稱

# Laravel 設定
variable "app_name" {}
variable "environment_variables_json_file" {}
variable "aws_bucket" {}
```

### 重點說明

- `lambda_runtime` 設為 `provided.al2023`：因為 PHP 不是 Lambda 原生支援的語言，所以使用 Custom Runtime。Bref 的 Lambda Layer 會在這個 Runtime 上提供 PHP 執行環境。
- `certificate_arn`：API Gateway 的自訂網域需要 TLS 憑證，這裡使用的是 **AWS Certificate Manager (ACM)** 上申請的憑證。
- `environment_variables_json_file`：Laravel 的環境變數（如資料庫連線、App Key 等）以 JSON 檔案的形式注入，避免在 Terraform 程式碼中暴露敏感資訊。

## locals.tf — 區域變數

```hcl
locals {
  app_name = lower(replace(var.app_name, "/[^A-Za-z0-9]/", "-"))
}
```

將 `app_name` 正規化：轉小寫，並將非英數字元替換為 `-`。這確保資源命名符合 AWS 的命名規則。

## data.tf — Data Sources

```hcl
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_partition" "current" {}

data "aws_s3_bucket" "aws_bucket" {
  bucket = var.aws_bucket
}
```

取得當前 AWS 帳號 ID、Region、Partition 等資訊，以及參照已存在的 S3 Bucket。這些資訊主要用在 IAM Policy 的 ARN 組裝中。

## main.tf — 核心資源定義

這是最主要的檔案，包含所有 AWS 資源。以下依類別說明。

### CloudWatch — 日誌與排程

```hcl
# 三個 Lambda 各自的 Log Group（保留 1 天）
resource "aws_cloudwatch_log_group" "web_log_group" {
  name              = "/aws/lambda/${local.app_name}-web"
  retention_in_days = 1
}

# Artisan 排程觸發規則（每天執行一次）
resource "aws_cloudwatch_event_rule" "artisan_events_rule_schedule" {
  name                = "${local.app_name}-artisan-schedule-runner"
  schedule_expression = "rate(1 day)"
  state               = "ENABLED"
}

# 排程目標：觸發 Artisan Lambda，傳入 "schedule:run" 作為參數
resource "aws_cloudwatch_event_target" "artisan_schedule" {
  target_id = "artisan-schedule"
  rule      = aws_cloudwatch_event_rule.artisan_events_rule_schedule.name
  arn       = aws_lambda_function.artisan_lambda_function.arn
  input     = "\"schedule:run\""
}
```

CloudWatch Events 在這裡等同於 Cron Job 的角色。`input = "\"schedule:run\""` 會讓 Artisan Lambda 執行 `php artisan schedule:run`。

### IAM — 權限設定

Lambda 執行時需要存取多個 AWS 服務，因此需要一個 IAM Role 和對應的 Policy：

```hcl
resource "aws_iam_role" "lambda_execution" {
  name = "${local.app_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = ["lambda.amazonaws.com"] }
      Action    = ["sts:AssumeRole"]
    }]
  })
}
```

IAM Policy 授予的權限包括：

| 權限                                                         | 用途                                       |
| ------------------------------------------------------------ | ------------------------------------------ |
| `logs:CreateLogStream`, `logs:PutLogEvents`                  | 寫入 CloudWatch Logs                       |
| `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`            | 操作 S3 儲存                               |
| `dynamodb:*Item`, `dynamodb:Query`, `dynamodb:Scan`          | 操作 DynamoDB 快取表                       |
| `sqs:SendMessage`, `sqs:ReceiveMessage`, `sqs:DeleteMessage` | 操作 SQS 佇列                              |
| `ec2:*NetworkInterface`                                      | VPC 網路介面管理（Lambda 加入 VPC 時需要） |

### Lambda — 三個 Function 的定義

與 v2 相同，Laravel 的 Function 可以分為 Web、Artisan、Jobs Worker 三個 Function。

Web Lambda 的範例如下：

```hcl
resource "aws_lambda_function" "web" {
  filename         = var.filename                     # Laravel 應用程式壓縮檔
  source_code_hash = filesha256(var.filename)         # 偵測程式碼變更
  handler          = "Bref\\LaravelBridge\\Http\\OctaneHandler"
  runtime          = var.lambda_runtime               # provided.al2023
  function_name    = "${local.app_name}-web"
  memory_size      = 1024
  timeout          = 28                               # API Gateway 逾時為 30 秒
  architectures    = ["arm64"]                        # ARM 架構較便宜
  role             = aws_iam_role.lambda_execution.arn
  layers           = [var.php_lambda_layer_arn]       # Bref PHP Layer

  environment {
    variables = merge(
      jsondecode(file(var.environment_variables_json_file)),
      {
        BREF_RUNTIME                     = "Bref\\FunctionRuntime\\Main"
        BREF_LOOP_MAX                    = "250"
        OCTANE_PERSIST_DATABASE_SESSIONS = "1"
        LOG_CHANNEL                      = "stderr"
        LOG_STDERR_FORMATTER             = "Bref\\Monolog\\CloudWatchFormatter"
        DYNAMODB_CACHE_TABLE             = aws_dynamodb_table.cache.name
        SQS_QUEUE                        = aws_sqs_queue.jobs.url
      }
    )
  }

  # VPC 設定（選用）
  dynamic "vpc_config" {
    for_each = var.enable_vpc ? ["apply"] : []
    content {
      subnet_ids                  = var.subnet_ids
      security_group_ids          = var.security_group_ids
      ipv6_allowed_for_dual_stack = true
    }
  }

  # EFS 檔案系統（選用）
  dynamic "file_system_config" {
    for_each = var.enable_filesystem ? ["apply"] : []
    content {
      arn              = var.access_point_arn
      local_mount_path = "/mnt/efs"
    }
  }
}
```

Artisan Lambda 的範例如下：

```hcl
resource "aws_lambda_function" "artisan" {
  filename         = var.filename
  source_code_hash = filesha256(var.filename)
  handler          = "artisan"
  runtime          = var.lambda_runtime
  function_name    = "${local.app_name}-artisan"
  memory_size      = var.lambda_memory_size
  timeout          = 720
  architectures    = ["arm64"]
  role             = aws_iam_role.lambda_execution.arn
  layers           = [var.php_lambda_layer_arn]

  environment {
    variables = merge(
      jsondecode(file(var.environment_variables_json_file)),
      {
        BREF_RUNTIME         = "Bref\\ConsoleRuntime\\Main"
        LOG_CHANNEL          = "stderr"
        LOG_STDERR_FORMATTER = "Bref\\Monolog\\CloudWatchFormatter"
        DYNAMODB_CACHE_TABLE = aws_dynamodb_table.cache.name
        SQS_QUEUE            = aws_sqs_queue.jobs.url
      }
    )
  }

  dynamic "vpc_config" {
    for_each = var.enable_vpc ? ["apply"] : []

    content {
      subnet_ids                  = var.subnet_ids
      security_group_ids          = var.security_group_ids
      ipv6_allowed_for_dual_stack = true
    }
  }

  dynamic "file_system_config" {
    for_each = var.enable_filesystem ? ["apply"] : []

    content {
      arn              = var.access_point_arn
      local_mount_path = "/mnt/efs"
    }
  }
}
```

Jobs Worker Lambda 的範例如下：

```hcl
resource "aws_lambda_function" "jobs_worker" {
  filename         = var.filename
  source_code_hash = filesha256(var.filename)
  handler          = "Bref\\LaravelBridge\\Queue\\QueueHandler"
  runtime          = var.lambda_runtime
  function_name    = "${local.app_name}-jobs-worker"
  memory_size      = var.lambda_memory_size
  timeout          = 60
  architectures    = ["arm64"]
  role             = aws_iam_role.lambda_execution.arn
  layers           = [var.php_lambda_layer_arn]

  environment {
    variables = merge(
      jsondecode(file(var.environment_variables_json_file)),
      {
        BREF_RUNTIME         = "Bref\\FunctionRuntime\\Main" # Jobs Worker 與 Web 相同，都是使用 FunctionRuntime
        LOG_CHANNEL          = "stderr"
        LOG_STDERR_FORMATTER = "Bref\\Monolog\\CloudWatchFormatter"
        DYNAMODB_CACHE_TABLE = aws_dynamodb_table.cache.name
        SQS_QUEUE            = aws_sqs_queue.jobs.url
      }
    )
  }

  dynamic "vpc_config" {
    for_each = var.enable_vpc ? ["apply"] : []

    content {
      subnet_ids                  = var.subnet_ids
      security_group_ids          = var.security_group_ids
      ipv6_allowed_for_dual_stack = true
    }
  }

  dynamic "file_system_config" {
    for_each = var.enable_filesystem ? ["apply"] : []

    content {
      arn              = var.access_point_arn
      local_mount_path = "/mnt/efs"
    }
  }
}
```

**幾個重要觀念：**

- `source_code_hash = filesha256(var.filename)`：Terraform 透過比對 hash 來決定是否需要更新 Lambda 程式碼。如果 zip 檔沒有變化，就不會重新部署。
- `architectures = ["arm64"]`：ARM 架構的 Lambda 比 x86 便宜約 20%，且效能相近。
- `dynamic` 區塊：使用 Terraform 的 Dynamic Block 來實現條件式資源設定。當 `enable_vpc` 為 `false` 時，`vpc_config` 區塊完全不會產生。
- 環境變數使用 `merge()` 合併了兩個來源：Terraform 自動注入的變數（如 `DYNAMODB_CACHE_TABLE`、`SQS_QUEUE`）以及使用者自訂的 JSON 檔案。

#### Lambda 事件觸發

```hcl
# 允許 CloudWatch Events 觸發 Artisan Lambda
resource "aws_lambda_permission" "artisan_lambda_permission_events_rule_schedule" {
  function_name = aws_lambda_function.artisan_lambda_function.function_name
  action        = "lambda:InvokeFunction"
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.artisan_events_rule_schedule.arn
}

# SQS 佇列觸發 Jobs Worker Lambda
resource "aws_lambda_event_source_mapping" "jobs_worker_event_source_mapping_sqs_jobs_queue" {
  batch_size       = 1                 # 每次處理 1 筆訊息
  event_source_arn = aws_sqs_queue.jobs_queue.arn
  function_name    = aws_lambda_function.jobs_worker_lambda_function.function_name
  enabled          = true

  function_response_types = ["ReportBatchItemFailures"]  # 支援部分失敗回報
}
```

### SQS — 佇列與 Dead Letter Queue

```hcl
resource "random_string" "random" {
  length  = 6
  special = false
}

resource "aws_sqs_queue" "jobs_queue" {
  name = "${local.app_name}-jobs-${random_string.random.result}"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.jobs_dlq.arn
    maxReceiveCount     = 3     # 失敗 3 次後移至 DLQ
  })
  visibility_timeout_seconds = 360
}

resource "aws_sqs_queue" "jobs_dlq" {
  message_retention_seconds = 1209600   # 14 天
  name = "${local.app_name}-jobs-dlq-${random_string.random.result}"
}
```

- 使用 `random_string` 在資源名稱中加入 6 個隨機字元，避免不同環境之間的命名衝突。
- `maxReceiveCount = 3`：佇列訊息處理失敗 3 次後，自動移至 Dead Letter Queue，避免無限重試。
- DLQ 保留訊息 14 天，讓開發者有充足時間排查問題。

### DynamoDB — 快取表

```hcl
resource "aws_dynamodb_table" "cache_table" {
  name         = "${local.app_name}-cache-table-${random_string.random.result}"
  billing_mode = "PAY_PER_REQUEST"    # 隨用隨付，無需預設容量
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true    # 啟用 TTL，快取自動過期
  }
}
```

Laravel 的快取機制在傳統架構中通常使用 Redis。但在 Serverless 架構中，DynamoDB 是更無腦，更便宜的選擇——它完全託管、自動擴縮，且搭配 `PAY_PER_REQUEST` 計費模式，低流量時費用幾乎為零。

> 讀取速度上仍是 Redis 更快。

### API Gateway — HTTP 請求入口

```hcl
resource "aws_apigatewayv2_api" "http_api" {
  name                         = local.app_name
  protocol_type                = "HTTP"
  disable_execute_api_endpoint = true     # 停用預設端點，強制使用自訂網域
  ip_address_type              = "dualstack"
}

resource "aws_apigatewayv2_stage" "http_api_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 500    # 突發限流
    throttling_rate_limit  = 1000   # 持續限流
  }
}
```

**`aws_apigatewayv2_stage`：定義 API 的「階段 (Stage)」與外部存取入口**

在 API Gateway 中，一個 API 可以擁有多個「階段」（例如 `dev`、`staging`、`prod`），用來區分不同的部署環境。在這個範例中，它的用途與設定包含了：

- **URL 路徑**：如果 Stage 名稱為 `dev`，存取路徑會是 `.../dev`。若使用特殊的系統預設名稱 `$default`，存取端點就會是網域根目錄（對於部署 Laravel 應用來說，通常會使用 `$default`，讓請求直接進入框架路由）。
- **自動部署**：開啟 `auto_deploy = true` 後，當 API 路由或整合設定發生變更時，API Gateway 會自動將變更部署到此階段，無需手動處理發布。
- **流量控制與日誌**：透過 `default_route_settings` 可設定限流（Rate Limit 與 Burst Limit），防止 API 遭遇過大流量或被惡意打爆。此外，也可以在 Stage 層級設定 Access Logging 將請求日誌統一送往 CloudWatch Logs。

#### 自訂網域與 ACM 憑證

```hcl
resource "aws_apigatewayv2_domain_name" "custom_domain" {
  domain_name = var.custom_domain_name

  domain_name_configuration {
    certificate_arn = var.certificate_arn    # AWS ACM 上的 TLS 憑證
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "custom_domain_mapping" {
  api_id      = aws_apigatewayv2_api.http_api.id
  domain_name = aws_apigatewayv2_domain_name.custom_domain.id
  stage       = aws_apigatewayv2_stage.http_api_stage.id
}
```

API Gateway 使用了 **AWS Certificate Manager (ACM)** 上申請的 TLS/SSL 憑證來設定自訂網域。你需要事先在 ACM 上申請並驗證好憑證，然後將憑證的 ARN 傳入 `certificate_arn` 變數。

> **注意**：API Gateway v2（HTTP API）的憑證必須位於與 API Gateway 相同的 Region。如果使用的是 CloudFront，則憑證必須位於 `us-east-1`。

#### 路由設定

```hcl
resource "aws_apigatewayv2_integration" "http_api_integration_web" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.web_lambda_function.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "http_api_route_default" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = join("/", ["integrations",
    aws_apigatewayv2_integration.http_api_integration_web.id])
}
```

使用 `$default` 路由鍵將所有請求都轉發至 Web Lambda。`AWS_PROXY` 整合類型表示請求和回應會以原始格式在 API Gateway 和 Lambda 之間傳遞。

## output.tf — 輸出值

```hcl
output "http_api_url" {
  description = "URL of the HTTP API"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "jobs_queue_url" {
  description = "URL of the \"jobs\" SQS queue."
  value       = aws_sqs_queue.jobs_queue.id
}

output "jobs_dlq_url" {
  description = "URL of the \"jobs\" SQS dead letter queue."
  value       = aws_sqs_queue.jobs_dlq.id
}
```

部署完成後，Terraform 會輸出 API Gateway URL、SQS Queue URL 等資訊，方便後續確認及設定 DNS。

## 部署流程

### 前置作業

1. **準備 Laravel 應用程式**

   ```bash
   cd laravel-app

   # 安裝生產環境依賴
   composer install --prefer-dist --optimize-autoloader --no-dev

   # 清除快取設定（Lambda 透過環境變數設定）
   php artisan config:clear

   # 建置前端資源
   npm ci && npm run build

   # 移除不必要的檔案
   rm -rf node_modules tests storage .git .github

   # 打包成 zip
   zip --quiet --recurse-paths --symlinks "../laravel-app.zip" .
   ```

   > **重要**：不要在 zip 中包含 `config:cache` 的產出。Lambda 環境變數會在執行時透過 `$_ENV` 注入，如果設定被快取，環境變數會被忽略。

2. **準備環境變數 JSON 檔案**

   建立 `environment-variables.json`，包含 Laravel 所需的環境變數：

   ```json
   {
     "APP_NAME": "My App",
     "APP_KEY": "base64:...",
     "APP_ENV": "production",
     "DB_CONNECTION": "pgsql",
     "DB_HOST": "your-rds-endpoint",
     "DB_DATABASE": "your_database",
     "DB_USERNAME": "your_username",
     "DB_PASSWORD": "your_password",
     "ASSET_URL": "https://your-s3-bucket.s3.amazonaws.com"
   }
   ```

   > **注意**：`ASSET_URL` 必須指向存放靜態資源的 S3 Bucket URL，因為 Lambda 無法直接提供靜態檔案（CSS/JS/圖片）。

3. **準備 Terraform 設定檔案**

   建立 `terraform.config`（Backend 設定）：

   ```conf
   bucket="your-terraform-state-bucket"
   key="your-app.tfstate"
   region="us-west-2"
   dynamodb_table="your-terraform-lock-table"
   ```

   建立 `terraform.tfvars`（變數值）：

   ```hcl
   app_name = "my-laravel-app"

   # VPC 設定（如需存取 RDS 資料庫）
   enable_vpc         = true
   subnet_ids         = ["subnet-xxx", "subnet-yyy"]
   security_group_ids = ["sg-xxx"]

   # EFS 設定（如需持久化檔案系統）
   enable_filesystem = true
   access_point_arn  = "arn:aws:elasticfilesystem:us-west-2:123456789:access-point/fsap-xxx"

   # API Gateway（ACM 憑證）
   certificate_arn    = "arn:aws:acm:us-west-2:123456789:certificate/xxx-xxx"
   custom_domain_name = "app.example.com"

   # 標籤
   tag_service     = "my-app"
   tag_environment = "production"
   tag_owner       = "team-name"

   # S3
   aws_bucket = "my-app-storage"

   # Lambda
   environment_variables_json_file = "./environment-variables.json"
   filename                        = "./laravel-app.zip"
   ```

### 執行部署

```bash
# 1. 初始化 Terraform（載入 Provider 和設定 Backend）
terraform init -backend-config="./terraform.config"

# 2. 預覽變更
terraform plan

# 3. 執行部署
terraform apply -auto-approve

# 4. 將前端靜態資源同步至 S3
aws s3 sync laravel-app/public s3://your-asset-bucket
```

### 部署後的 DNS 設定

部署完成後，你需要在 DNS 中將自訂網域指向 API Gateway 的 Domain Name Target。可透過以下方式取得：

```bash
aws apigatewayv2 get-domain-name --domain-name app.example.com
```

在你的 DNS 服務商建立一筆 CNAME 或 ALIAS 記錄，指向 API Gateway 回傳的 `ApiGatewayDomainName`。

## GitHub Actions 自動部署

本專案包含 GitHub Actions Workflow，可以實現完整的 CI/CD 自動部署。核心步驟如下：

```yaml
steps:
  # 1. 設定 AWS 認證（使用 OIDC，無需存放 Access Key）
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789:role/github_action
      aws-region: us-west-2

  # 2. 設定 PHP 和 Node.js 環境
  - uses: shivammathur/setup-php@v2
    with:
      php-version: "8.4"

  - uses: actions/setup-node@v4
    with:
      node-version: "24.8.0"

  # 3. 設定 Terraform
  - uses: hashicorp/setup-terraform@v3

  # 4. 部署（clone、打包、terraform apply、同步靜態資源）
```

Workflow 使用 `workflow_dispatch` 觸發，代表需要手動在 GitHub Actions 頁面點擊 "Run workflow" 來啟動部署。

## 注意事項與最佳實踐

### Lambda 限制

- **API Gateway 逾時**：API Gateway 的最大逾時為 30 秒，因此 Web Lambda 的 timeout 設為 28 秒，留 2 秒緩衝。
- **Cold Start（冷啟動）**：第一次呼叫或閒置一段時間後的呼叫會有額外延遲。如果需要降低冷啟動影響，可以考慮使用 Provisioned Concurrency。
- **檔案系統唯讀**：Lambda 的檔案系統是唯讀的（除了 `/tmp`，最大 10 GB），如果需要持久化檔案，請啟用 EFS。

### 靜態資源處理

Lambda 無法直接提供靜態檔案。前端資源（CSS、JS、圖片等）需要上傳至 S3，並透過 `ASSET_URL` 環境變數告訴 Laravel 資源的 URL 前綴。

### 資源命名

資源名稱中包含 `random_string`（6 個隨機字元），這是為了：

- 避免多個環境之間的命名衝突。
- 避免刪除後重建時因為名稱衝突而失敗（某些 AWS 資源在刪除後名稱不會立即釋放）。

### 安全性

- 環境變數（包含資料庫密碼等敏感資訊）透過獨立的 JSON 檔案管理，不應提交至版本控制。
- IAM Policy 遵循最小權限原則，每個權限都限定在特定資源上（例如 S3 權限僅限於指定的 Bucket）。
- API Gateway 內建了限流機制（Burst: 500、Rate: 1000），防止 API 被濫用。

### 成本優化

- 使用 `arm64` 架構比 `x86_64` 便宜約 20%。
- DynamoDB 使用 `PAY_PER_REQUEST` 模式，低流量時幾乎零成本。
- CloudWatch Logs 保留天數設為 1 天，減少儲存費用。
- Lambda 閒置時不收費，只在被呼叫時計費。
