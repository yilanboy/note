---
layout: default
parent: Fluent Bit
nav_order: 2
---

# 緩衝與儲存

Fluent Bit 負責收集、解析、過濾日誌（Log），並將其傳送至中央位置。此工作流程中至關重要的一環是緩衝（Buffering）功能：透過此機制，處理後的資料會暫存於臨時位置，直至準備好進行傳送。

Fluent Bit 提供兩種緩衝模式來處理資料，分別是**記憶體緩衝模式（in-memory）** 與**記憶體搭配檔案系統緩衝模式（in-memory and filesystem）**，前者為預設值。

## 什麼是反壓（Backpressure）？

日誌或資料的生成速度，可能快於將其轉移至目標位置的速度。

常見情境是從大型日誌檔案讀取資料時（尤其存在大量積壓資料），需透過網路將日誌分發至後端系統，但後端的回應需要時間。
此過程會產生反壓，導致服務端記憶體消耗過高。

為了避免反壓，Fluent Bit 提供了 `mem_buf_limit` 與 `storage.max_chunks_up` 這兩個參數來限制輸入的資料量。

如果輸入的資料量達到了 `mem_buf_limit`，那麼 Fluent Bit 就不會在輸入更多的資料。並印出 `[warn] [input] {input name or alias} paused (mem buf overlimit)` 日誌。

對於某些輸入套件，暫停處理資料可能會導致資料遺失，例如 tcp 輸入，而 tail 輸入則不會有這個問題，它可以先暫停一會兒，再從上次的地方繼續處理資料。

## `mem_buf_limit` 與 `storage.max_chunks_up` 的差別是什麼？

`mem_buf_limit` 是針對每個輸入的記憶體緩衝區限制，適用於記憶體緩衝模式；`storage.max_chunks_up` 則是服務層級限制，規範使用檔案系統儲存時，記憶體中可同時存取的檔案系統支援區塊數量上限。詳細說明：

- `mem_buf_limit` 僅適用於輸入採用預設記憶體緩衝模式（`storage.type memory`）時。此設定限制輸入在暫停前可追加的記憶體上限（部分輸入可能因此面臨資料遺失風險）。

```yaml
pipeline:
  inputs:
    - name: tcp
      listen: 0.0.0.0
      port: 5170
      format: none
      tag: tcp-logs
      mem_buf_limit: 50MB
```

- storage.max_chunks_up 設定於 `service` 區段，用於控制啟用 `storage.type filesystem` 時，記憶體中可維持「上傳」狀態的區塊數量上限。此設定限制所有活躍檔案系統區塊的總記憶體使用量；當達到上限時，Fluent Bit 可繼續將緩衝資料寫入磁碟（或在啟用 `storage.pause_on_chunks_overlimit` 時暫停輸入）。

```yaml
service:
  flush: 1
  log_level: info
  storage.path: /var/log/flb-storage/
  storage.sync: normal
  storage.checksum: off
  storage.max_chunks_up: 128
  storage.backlog.mem_limit: 5M

pipeline:
  inputs:
    - name: cpu
      storage.type: filesystem

    - name: mem
      storage.type: memory
```

## 參考資料

- [Buffering and Storage - Fluent Bit](https://docs.fluentbit.io/manual/administration/buffering-and-storage)
- [Backpressure - Fluent Bit](https://docs.fluentbit.io/manual/administration/backpressure)
