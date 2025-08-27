---
layout: default
parent: Fluent Bit
nav_order: 1
---

# 將容器日誌發送到雲端

## 背景

我們使用 Docker 來運行 FRRouting 服務。我們想要將 FRRouting 的 Logs 放上雲端上儲存，避免 Logs 因為機器崩潰而遺失。

## 如何將日誌發送到雲端？

- Docker 可以使用不同類型的日誌驅動程式，預設是 `json-file`。

  ```bash
  # 檢查預設的日誌驅動程式
  docker info --format '{{.LoggingDriver}}'
  ```

- 除了 `json-file`，Docker 也支援 `awslogs`、`fluentd`、`journald`、`syslog` 等。

- 基於 `syslog` 驅動程式，我們可以使用 Fluent Bit 將日誌發送到雲端。

## 什麼是 Fluent Bit？

Fluent Bit 是一個輕量級且高效能的日誌處理器和轉發器。

## 資料管道

Fluent Bit 有多個外掛程式，包括 **輸入**、**輸出**、**解析器** 和 **過濾器** 外掛程式。

輸入外掛程式從來源收集日誌，然後將它們發送到輸出外掛程式。這個過程稱為 **管道**。

## 輸入外掛程式

Fluent Bit 最重要的功能之一是它的輸入外掛程式。

Fluent Bit 可以從不同來源收集日誌，例如：

- Syslog
- 檔案
- HTTP
- 還有 40 多種...

## Syslog 輸入外掛程式

Fluent Bit 可以從 syslog 收集日誌。

```yaml
pipeline:
  inputs:
    - name: syslog
      mode: udp # 使用 UDP 可以將日誌驅動程式與其他容器解耦
      listen: 0.0.0.0
      port: 5140
      parser: frr # Syslog 必須指定一個解析器
      buffer_chunk_size: 1M
      buffer_max_size: 6M
      tag: docker-syslog-driver
```

## 解析器外掛程式

Fluent Bit 可以解析不同格式的日誌。

FRRouting 日誌沒有內建的解析器，但我們可以使用 `regex` 解析器來解析日誌。

```text
[PARSER]
    Name frr
    Format regex
    Regex (?<time>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) (?<log>.*)
    Time_Key time
    Time_Format %Y/%m/%d %H:%M:%S
```

## 輸出外掛程式

Fluent Bit 可以將日誌發送到不同的目的地，例如：

- AWS S3
- Azure 儲存體帳戶
- Elasticsearch
- 還有 40 多種...

## S3 輸出外掛程式

Fluent Bit 可以將日誌發送到 AWS S3。

```yaml
outputs:
  - name: s3
    match: "*" # 所有輸入都會發送到 S3
    bucket: log-collection
    region: us-west-2
    total_file_size: 1M
    upload_timeout: 1m
    s3_key_format: /$TAG/%Y/%m/%d/%H-%M-%S-$UUID.json
    s3_key_format_tag_delimiters: .-
```

`s3_key_format` 可以設定上傳到 S3 的路徑，在路徑中可以使用一些特殊語法。

例如使用 `%Y`、`%m`、`%d` 這些格式來設定日期。也可以使用 `$UUID` 來產生亂碼避免檔案名稱重複。

除此之外，路徑中也能使用 `$TAG` 來取得輸入的標籤資訊。`s3_key_format_tag_delimiters` 可以設定要用什麼符號來切分標籤，
上面設定 `.-`。意思就是標籤會使用 `.` 與 `-` 來切割字串。

例如輸入標籤是 `this-is-an-input-tag`，那麼切分出來就會是 `['this', 'is', 'an', 'input', 'tag']`。

這時候 `$TAG` 為 `this-is-an-input-tag`，`$TAG[0]` 為 `this`，`$TAG[1]` 為 `is`，以此類推。
