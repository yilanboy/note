---
layout: default
parent: AWS
nav_order: 22
---

# CloudWatch

CloudWatch 可以用來觀察 AWS 其他服務的狀況，例如 EC2 機器的運行狀態或是 Lambda 函式執行的結果。

## 使用 AWS CLI 搜尋 Log

使用關鍵字搜尋 Log。

```bash
aws logs filter-log-events --log-group-name my-group [--log-stream-names LIST_OF_STREAMS_TO_SEARCH] [--filter-pattern VALID_METRIC_FILTER_PATTERN]
```

也可以搜尋指定時間內的 Log。

```bash
aws logs filter-log-events --log-group-name my-group [--log-stream-names LIST_OF_STREAMS_TO_SEARCH] [--start-time 1482197400000] [--end-time 1482217558365] [--filter-pattern VALID_METRIC_FILTER_PATTERN]
```

## 在 EC2 中傳送客製化的 Metrics

你可以在 EC2 中傳送你設定的值到 Cloudwatch。
這個操作需要在 EC2 掛上 `cloudwatch:PutMetricData` 的 IAM 權限。

然後你就可以在 EC2 上使用 AWS CLI 來傳送 Metrics 到 Cloudwatch。

```bash
aws cloudwatch put-metric-data \
  --metric-name CustomMetricName \
  --namespace Custom-Namespace-Name \
  --unit Bytes \
  --value 1 \
  --dimensions InstanceId=${INSTANCE_ID},Hostname=$(hostname)
```

在 Cloudwatch 想要根據 Metrics 來設定 Alarm 時，需要透過 Dimension 來抓到特定的 Metrics。
注意 Dimension 的**條件要完全符合**，否則你會抓不到想要的 Metrics。

> 注意 Custom Metrics 不便宜。數量一多的話，費用很驚人。

## SAA 筆記

在 EC2 上 CloudWatch 預設可以看以下這些資訊
  - CPU Utilization
  - Disk Reads Activity
  - Network Packets Out

> 注意在預設下，Cloudwatch 是看不到 EC2 的 Memory Utilization 的。

在 EC2 上如果安裝 unified CloudWatch agent，可以看到以下這些客製化的資訊
  - Memory Utilization
  - Disk Swap Utilization
  - Disk Space Utilization
  - Page File Utilization
  - Log Collection

## 參考資料

- [使用篩選條件模式搜尋日誌資料](https://docs.aws.amazon.com/zh_tw/AmazonCloudWatch/latest/logs/SearchDataFilterPattern.html)
- [Publish Custom Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/publishingMetrics.html)
