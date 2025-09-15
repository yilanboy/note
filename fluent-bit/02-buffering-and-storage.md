---
layout: default
parent: Fluent Bit
nav_order: 2
---

# 緩衝與儲存

Fluent Bit 負責收集、解析、過濾日誌（Log），並將其傳送至中央位置。此工作流程中至關重要的一環是緩衝（Buffering）功能：透過此機制，處理後的資料會暫存於臨時位置，直至準備好進行傳送。

## 什麼是反壓（Backpressure）？

日誌或資料的生成速度，可能快於將其轉移至目標位置的速度。

常見情境是從大型日誌檔案讀取資料時（尤其存在大量積壓資料），需透過網路將日誌分發至後端系統，但後端的回應需要時間。
此過程會產生反壓，導致服務端記憶體消耗過高。

## 參考資料

- [Buffering and Storage - Fluent Bit](https://docs.fluentbit.io/manual/administration/buffering-and-storage)
