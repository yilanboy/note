---
layout: default
parent: AWS
nav_order: 27
---

# AWS Athena

AWS Athena 是一個無伺服器的互動式查詢服務，讓使用者可以透過標準 SQL 語法直接分析儲存在 Amazon S3 中的資料，無需預先配置或管理任何基礎設施。Athena 基於開源的 Presto 分散式 SQL 查詢引擎，原生支援多種資料格式，包括 CSV、JSON、ORC、Avro 和 Parquet 等。

查詢前需要使用 AWS Glue 產出資料的 Schema。

## 查詢優化技巧

以下分享在使用 Athena 進行大型資料集查詢時的實戰經驗與優化策略。

### 使用 GROUP BY 優化大量資料查詢

**場景背景**：需要分析雲端網路流量的來源與目的地分布，並識別最大的流量流向。資料來源為 VPC Flow Logs，資料量級為 TB，包含數百億筆記錄。

**問題描述**：由於 Flow Logs 資料量龐大（TB 級別，數百億筆資料），原始查詢語法效能極差，無法在合理時間內完成執行。

**原始查詢語法（效能不佳）**：

```sql
-- 先整合 VPC 和 VNet 的雲端網路資訊
with cloud_network as (
    select *
    from aws_vpc
    union all
    select *
    from azure_vnet
)
-- 查詢流量來源和目的地的雲端網路資訊
select
    -- 來源 IP 的網路資訊，包含網路類型、擁有者、區域、網路 ID 和 CIDR
    source_network.vendor as source_vendor,
    source_network.owner as source_owner,
    source_network.region as source_region,
    source_network.id as source_network_id,
    source_network.cidr as source_cidr,
    flow_logs.source_ip as source_ip,
    -- 目的地 IP 的網路資訊，包含網路類型、擁有者、區域、網路 ID 和 CIDR
    destination_network.vendor as destination_vendor,
    destination_network.owner as destination_owner,
    destination_network.region as destination_region,
    destination_network.id as destination_network_id,
    destination_network.cidr as destination_cidr,
    flow_logs.destination_ip as destination_ip
-- 有上百億筆流量資料的 flow_logs
from flow_logs
    -- 透過 IP 位址對應到雲端網路資訊
    -- Athena 提供的 contains 函式，可以用來判斷一個 IP 位址是否屬於某個 CIDR 範圍
    -- 根據 CIDR 範圍，找到對應的雲端網路資訊
    left join cloud_network as source_network on contains(
        source_network.cidr,
        cast(flow_logs.source_ip as IPADDRESS)
    ) = true
    left join cloud_network as destination_network on contains(
        destination_network.cidr,
        cast(flow_logs.destination_ip as IPADDRESS)
    ) = true
```

**查詢邏輯說明**：

1. 根據 `source_ip` 和 `destination_ip` 與 `cloud_network.cidr` 進行對應
2. 透過 CIDR 範圍查找對應的雲端網路資訊

**效能瓶頸分析**：

1. **資料量過大**：數百億筆 Flow Logs 記錄需要逐一處理
2. **函式執行成本**：`contains()` 函式需要對每筆資料執行 IP 範圍檢查，計算成本高昂
3. **重複計算**：相同的 IP 組合重複執行相同的網路資訊查詢

**優化策略**：使用 `GROUP BY` 預先聚合相同的 IP 組合，減少後續 JOIN 操作的資料量。由於相同的 `source_ip` 和 `destination_ip` 對應的雲端網路資訊必然相同，因此可以先去重再進行網路資訊關聯查詢。

**優化後的查詢語法**：

```sql
with cloud_network as (
    select *
    from aws_vpc
    union all
    select *
    from azure_vnet
), filtered_flow as (
    -- 根據 source_ip 與 destination_ip 去除重複的流量
    -- 並計算相同的流量總共出現幾次
    select
        source_ip,
        destination_ip,
        count(*) as connection_count
    from flow_logs
    group by source_ip, destination_ip
)
select
    source_network.vendor as source_vendor,
    source_network.owner as source_owner,
    source_network.region as source_region,
    source_network.id as source_network_id,
    source_network.cidr as source_cidr,
    flow_logs.source_ip as source_ip,
    destination_network.vendor as destination_vendor,
    destination_network.owner as destination_owner,
    destination_network.region as destination_region,
    destination_network.id as destination_network_id,
    destination_network.cidr as destination_cidr,
    flow_logs.destination_ip as destination_ip,
    flow_logs.connection_count as connection_count
 -- 使用過濾過的流量資料
from filtered_flow as flow_logs
    left join cloud_network as source_network on contains(
        source_network.cidr,
        cast(flow_logs.source_ip as IPADDRESS)
    ) = true
    left join cloud_network as destination_network on contains(
        destination_network.cidr,
        cast(flow_logs.destination_ip as IPADDRESS)
    ) = true
```

**優化效果說明**：

- `filtered_flow` 中間表透過 `GROUP BY` 將相同的 IP 組合進行聚合
- 同時統計每種 IP 組合的出現次數（`connection_count`）
- 將數百億筆原始資料縮減至數萬筆唯一 IP 組合
- 大幅降低後續 JOIN 操作的計算複雜度，查詢效能顯著提升

> [!IMPORTANT]
> 此優化技巧特別適用於需要對大量重複資料進行關聯查詢的場景。透過預先聚合去重，可以將查詢時間從數小時縮短至數分鐘。

## 參考資料

- [Optimize Athena performance](https://docs.aws.amazon.com/athena/latest/ug/performance-tuning.html)
