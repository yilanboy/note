---
layout: default
parent: Azure
nav_order: 8
---

# Private Link Service

Private Link Service 能讓不同區域的 VNet 透過 Azure 的私有線路安全地存取 Azure 的 PaaS 服務，例如 Azure Storage 和 SQL Database。

目前我們的監控系統採用 AWS 代管的 Prometheus（AMP）。若要讓 Azure VM 上的 Exporter 傳送 Metrics 到 AMP，通常需要在 Azure VM 上配置 AWS 的 Access Key。為了減少 Access Key 的數量，並避免將 Access Key 分散在多台 VM 上，我們計畫建立一個 Metrics 轉送中心，集中管理並將來自不同區域的 Azure VM 的 Metrics 統一轉送到 AMP。

我們建立一個 Load Balancer，後面接了兩台轉送 Metrics 的 VM。在 Load Balancer 前面我們加上了一個 Private Service Link。
如果不同區域的 VM 想要轉送 Metrics，可以在所在 VNet 底下建立 Private Endpoint，
這樣 VM 就能透過 Private Endpoint 的私有 IP 來訪問 Load Balancer 並轉送 Metrics。

一個 Private Service Link 可以接多個來自不同地區的 Private Endpoint。

## Private Link Service 與 Private Endpoint 差異

Private Link Service 是服務端，負責將服務（如 Load Balancer、VM、PaaS）透過私有連線暴露給其他 VNet；Private Endpoint 則是用戶端，讓 VNet 內的資源可以透過私有 IP 連線到 Private Link Service。兩者協作，實現跨區域、跨網段的安全連線。

## 安全性優勢

使用 Private Link 可以確保資料流量僅在 Azure backbone 網路中傳輸，不經公網，降低資料外洩風險並減少攻擊面。

## 限制與注意事項

- 只支援 Standard Load Balancer
- 只支援 IPv4 流量
- 只支援 TCP 與 UDP 流量

更多可參考[Azure Private Link Service Limitation](https://learn.microsoft.com/en-us/azure/private-link/private-link-service-overview#limitations)

## 實作步驟簡述

1. 建立 Load Balancer 轉發對象設定為後端 VM 集群。
2. 幫 Load Balancer 建立 Frontend IP（一個 Private IP，做為訪問 Load Balancer 的入口）。
3. 幫 Load Balancer 建立 Backend Pool，將後端 VM 加入。
4. 幫 Load Balancer 建立 Health Probe，用來偵測後端 VM 的健康狀態。
5. 幫 Load Balancer 建立 Load Balancing Rule，用來定義流量轉發的規則。
6. 建立 Private Link Service，將 Load Balancer 作為目標。
7. 在其他 VNet 建立 Private Endpoint，連線到 Private Link Service。

> Azure Load Balancer Health Probe 是一種用來偵測應用程式實例健康狀態的功能。它會向實例發送請求，確認它們是否可用並回應請求。健康探測器可配置為使用不同協定，如 TCP、HTTP 或 HTTPS。這是一項重要功能，因為它幫助你偵測應用程式故障、管理負載並規劃停機時間。

## 架構圖說明（文字版）

```text
不同區域 VM ──> Private Endpoint ──> Private Link Service ──> Load Balancer ──> Forward Metrics VM ──> AMP
```

## Pricing

Private Link Service 為免費，但 Private Endpoint 每小時收費 0.01 美金，也會對輸入與輸出費用額外收費。

## 參考資料

- [Private Link documentation](https://learn.microsoft.com/en-us/azure/private-link/)
- [Azure private link across regions](https://learn.microsoft.com/en-us/answers/questions/622662/azure-private-link-across-regions)
