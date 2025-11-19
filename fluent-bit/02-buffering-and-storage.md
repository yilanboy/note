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

對於某些輸入外掛，暫停處理資料可能會導致資料遺失。例如 tcp 輸入在暫停期間無法接收新的網路連線，可能導致客戶端連線被拒絕或資料遺失；而 tail 輸入則不會有這個問題，因為它是讀取檔案，可以先暫停處理，再從上次讀取的位置繼續處理資料。

## Chunks

當輸入外掛收到紀錄，會將紀錄打包在一起變成 _Chunk_，Chunk 的大小預設為 2 MB。
根據設定的不同，Fluent Bit 的引擎會決定要將 Chunk 放在哪裡，但預設都是放在記憶體中。

## 記憶體緩衝

如果沒有調整設定，所有的 Chunk 都會放在記憶體。

為了避免反壓導致記憶體使用率過高，你可以在輸入外掛上使用 `mem_buf_limit` 來限制記憶體使用率，
當輸入外掛觸發記憶體限制，就會被暫停（Pause），等資料被轉送出去後，記憶體空間空出來才會恢復（Resume）。

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

如果輸入的資料量達到了 `mem_buf_limit`，那麼 Fluent Bit 就不會在輸入更多的資料。並印出 `[warn] [input] {input name or alias} paused (mem buf overlimit)` 日誌。

> `mem_buf_limit` 只有在 `storage.type` 設定為 `memory` 時才會啟用。

## 記憶體緩衝搭配檔案系統緩衝

可以將 `storage.type` 設定為 `filesystem` 來啟用檔案系統緩衝，但這同時也會使 `mem_buf_limit` 設定失效。

記憶體與檔案系統緩衝機制並非互斥。在輸入外掛啟用檔案系統緩衝功能，可以同時提升效能與資料安全性。

啟用檔案系統緩衝，在建立 Chunk 的時候，Fluent Bit 的引擎會將資料儲存在記憶體，但同時也會使用記憶體映射（mmap）將相同的資料副本儲存在檔案系統上。**新建立的 Chunk 在記憶體中處於活躍狀態，同時在檔案系統中又有備份**，這種狀態可以稱爲 `up`，說明 Chunk 已經載入記憶體，並準備好轉送出去了。反之，只存在檔案系統上且沒有載入記憶體的 Chunk，這種狀態稱為 `down`。

Fluent Bit 預設記憶體內可以有 128 個狀態為 `up` 的 Chunk，每個 Chunk 的上限是 2MB，因此記憶體使用量為 128 × 2MB = 256MB。

`storage.max_chunks_up` 可以設定記憶體能有幾個 `up` 狀態的 Chunk，預設為 128。

當輸入外掛的 `up` Chunk 數量達到上限，輸入外掛並不會被暫停，而是將 Chunk 儲存在檔案系統上，這些 Chunk 的狀態為 `down`。等到 `up` Chunk 被轉送出去，`down` 狀態的 Chunk 才會被載入記憶體中，變成 `up` 狀態。這樣的流程可以保證不會遺失任何資料。

`storage.max_chunks_up` 設定於 `service` 區段。

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
