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

## SAA 筆記

- 在 EC2 上 CloudWatch 預設可以看以下這些資訊
  - CPU Utilization
  - Disk Reads activity
  - Network packets out
- 在 EC2 上如果安裝 unified CloudWatch agent，可以看到以下這些客製化的資訊
  - Memory utilization
  - Disk swap utilization
  - Disk space utilization
  - Page file utilization
  - Log collection

## 參考資料

- [使用篩選條件模式搜尋日誌資料](https://docs.aws.amazon.com/zh_tw/AmazonCloudWatch/latest/logs/SearchDataFilterPattern.html)
