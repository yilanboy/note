---
layout: default
parent: AWS
nav_order: 99
---

# 其他大大小小的 AWS 服務

## Kinesis

- Amazon Kinesis Data Streams 可以做到 real-time 的資料串流，後面可以接
  - EC2
  - Lambda
  - Elastic MapReduce (EMR)
  - kinesis data firehose
  - Kinesis Data Analytics
- Kinesis Data Streams 支援 re-sharding，可以透過 `UpdateShardCount` API 來做到
- Kinesis Data Firehose，可以使用以下服務當作 data store
  - S3
  - Redshift
  - Amazon OpenSearch
  - Splunk
- Amazon Kinesis Data Firehose 是一種擷取、轉換和載入 (ETL) 服務，背後可以儲存在 S3，然後使用 Redshift 做分析
- 沒有 real time 需求，想省錢的話應該使用 SQS，而非 Kinesis stream
- Kinesis Data Stream 的資料預設只會保留 24 小時，最長可以到一年 (8750 小時)

## Elastic MapReduce (EMR)

- Amazon EMR 是一個雲端大數據平台，用於使用開源分析架構(如 Apache Spark、Apache Hive 和 Presto) 執行大規模分散式資料處理作業、交互式 SQL 查詢和機器學習應用程式

## Redshift

- 支援 SQL 語法來查詢與分析資料
- Amazon Redshift 支援 snapshot，且支援跨 region

## AWS Glue

- AWS Glue 是一個全託管的 ETL 服務，可以將將資料來源的格式轉成我們想要的格式
- 資料來源與轉換後資料的目的地都可以設定成 S3
- AWS Glue 的 ETL 工作 支援 job bookmark 功能，可以從上次的工作繼續往下做

## AWS Athena

- 可以直接搜尋 S3 上的資料，使用 SQL 查詢
- 查詢前可以使用 AWS Glue 先產出資料的 schema

## AWS Lake Formation

- AWS Lake Formation 可以整合多個帳號的 S3 資料，並交給 Athena、Redshift 與 EMR 分析資料用

## AWS Transfer Family

- AWS Transfer Family 可以使用 SFTP、FTPS 和 FTP 協定無縫遷移、自動化和監控傳入和傳出 Amazon S3 和 Amazon EFS 的檔案傳輸工作流程

## Amazon Cognito

- 行動應用 (mobile App) 認證用，啟動一個 identity broker 來進行驗證，並讓 App 取得暫時性的資源存取權限

## AWS AppSync

- AWS AppSync 使開發人員能夠使用安全、無伺服器和高效能 GraphQL 和 Pub/Sub API
- AppSync pipeline resolvers 聚合來自多個資料表的數據。AppSync pipeline resolvers 只需一次調用，就能從多個數據源輕鬆檢索數據，而無需在不同數據源之間調用多個 API，提升應用程序性能和用戶體驗。

## AWS DataSync

- AWS DataSync 的主要用途是在本地資料中心和 AWS 存儲服務之間實現快速、安全、可靠的數據傳輸。它特別適用於一次性的大規模數據遷移、雲中數據處理以及遠程備份等場景
- DataSync 將資料送往 S3 後可以直接設定 Tier，不需要額外設定 lifecycle 等時間到才轉 tier

## Elastic K8s Service (EKS)

- 使用 AWS 代管的 EKS 平台，好處是避免過度依賴雲端，想搬家隨時可以搬家，只要其他雲端支援 K8s 即可
- 雖然 Fargate 是 serverless 服務，但提供 20GB 的暫時性存儲
- EKS 的 IAM 認證需要在 node 上設定，並且需要設定 `aws-auth` ConfigMap

## Control Tower

- Control Tower 用來快速建立一個安全的多帳戶環境
- Account Factory 是 Control Tower 用來建立帳戶的服務
- AWS Control Tower Guardrails 可以用來管理帳戶的合規性

## AWS Organization

- 如果你已經有多個帳戶，只是想將帳戶整合再一起，可以使用 AWS Organization
- SCP (Service Control Policy) 可以用來管理底下所有帳號訪問資源的權限
- AWS Organization 不支援外部的認證方式

## AWS Resource Access Manager (RAM)

- AWS Resource Access Manager (RAM) 服務可幫助您跨 AWS 帳戶或在 AWS 組織或組織單位 (OU) 內安全地共享 AWS 資源

## AWS System Manager

- AWS Systems Manager 是 AWS 應用程式和資源的操作中心，也是混合多雲端環境的安全端對端管理解決方案，可大規模執行安全可靠的操作
- AWS Systems Manager 只是一個服務集合，用於管理通常在單個 AWS 帳戶中運行的 AWS 應用程序和基礎設施
- AWS Systems Manager Run Command 可讓您遠程安全地管理受管實例的配置

## Amazon EventBridge (Amazon CloudWatch Events)

- 您可以使用帶有自定義事件模式和輸入轉換器的 Amazon EventBridge（Amazon CloudWatch Events）規則，以匹配輸出為 NON_COMPLIANT 的 AWS Config 評估規則。然後，將響應路由到 Amazon Simple Notification Service (Amazon SNS) 主題。

## AWS Secret Manager

- Secret Manager 可以儲存敏感資訊，但費用較高，Parameter Store 可以使用 KMS 來加密，費用較低

## AWS Batch

- AWS Batch 可協助您在 AWS 雲端 上執行批次運算工作負載。Batch 運算是開發人員、科學家和工程師存取大量運算資源的常用方式
- 如果你需要很大量的批次操作或是機器學習運算，可以考慮使用

## AWS Backup

- AWS Backup 支援以下幾個服務的備份計畫，可以將資料備份到 S3
  - compute
    - EC2
  - storage
    - EBS
    - EFS
    - FSx
    - S3
  - database
    - RDS
    - Aurora
    - DynamoDB
    - DocumentDB
- 支援 cross region 備份

## AWS Global Accelerator

- Global Accelerator 是一種網路服務，可協助您提高公開應用程式的可用性、效能和安全性
- Global Accelerator 提供 2 個全域靜態公共 IP，充當應用程式端點的固定入口點，例如 ALB、NLB、EC2 和彈性 IP
- Global Accelerator 大多用在非 HTTP 的場景，例如遊戲 (UDP) 與 IOT (MQTT)

## AWS Amplify

- AWS Amplify 讓前端 Web 和行動開發人員可以快速在 AWS 上建置、推出和託管完整堆疊應用程式

## AWS Serverless Application Model (SAM)

- AWS Serverless Application Model(AWS SAM) 是改善開發人員在 AWS 上建置和執行無伺服器應用程式的體驗的工具組

## Amazon Simple Workflow Service (SWF)

- SWF 可輕鬆協調分布式應用程序元件之間的工作

## AppFlow

- AppFlow 是一種整合服務，用於在軟體即服務 (SaaS) 應用程式（例如 Salesforce、SAP、Zendesk、Slack、ServiceNow 和 AWS 服務）之間安全地傳輸數據

## AWS Snowball

- AWS Snowball 家族是為了解決想將地端資料移往雲端但網路頻寬不夠的問題
- AWS Snowball Edge 提供運算功能，在地端移往雲端的過程中，可以對資料進行處理
- AWS Snowmobile 主要是提供最高 100PB 等級的資料轉移

## AWS Config

- 您可以使用 AWS Config 規則來評估 AWS 資源的配置設置
- 當 AWS Config 檢測到某個資源違反了某個規則中的條件時，AWS Config 會將該資源標記為不合規，並發送通知
- AWS Config 會在創建、更改或刪除資源時對其進行持續評估
- AWS Config 可以透過 `require-tags` 要求一定要打上 Tag

## Amazon GuardDuty

- Amazon GuardDuty 會跟據在 AWS 中的可疑的行為來產出報告，例如：
  - 例如請求來源於已知的可疑 IP
  - 修改 S3 bucket policy (ACL) 為 public
- Amazon GuardDuty 包含異常偵測與機器學習

## Amazon Detective

- Amazon Detective 會自動從收集日誌資料 (CloudTrail 與 VPC Log) 並用於分析、調查和快速確定 AWS workload 中潛在安全問題的根本原因

## AWS Artifact

- AWS Artifact 提供對指定安全報告、合規報告和 AWS 協議的隨需存取

## AWS Trusted Advisor

- Trusted Advisor 會檢查您的 AWS 環境，然後在有機會節約成本、提高系統可用性和性能或幫助彌補安全漏洞時提出建議

## AWS Audit Manager

- AWS Audit Manager 用來持續審核您的 AWS 使用情況，即可簡化您的風險評估以及法規遵守和行業標準的方式

## Amazon Monitron

- Amazon Monitron 只是一種檢測工業設備（如風扇、壓縮機、電機）異常情況的服務

## High Availability (HA)

- Multi-region 不等於 Multi-AZ (廢話)
- 題目說最少需要兩台機器來 handle 流量，並且需要做 Multi-AZ 的 HA 與高容錯，那麼下面哪種設定比較合適？
  - ASG 最少設定 2 台，最多 6 台。在兩個 AZ 各放 1 台：錯誤的答案，因為最少需要 2 台，某個 AZ 掛掉都會讓機器數不夠
  - ASG 最少設定 4 台，最多 6 台。在兩個 AZ 各放 2 台：正確的答案，多開 2 台機器就是為了確保某個 AZ 掛掉，機器數量依然符合最低需求
- 要做 HA，請考慮單一 AZ 掛掉之後，剩下的機器數量是否符合最低要求

## Hybrid Cloud

- Amazon Storage Gateway 主要是用來與 on-premises 組合搭建混合雲使用
- Storage Gateway 的 Volume Gateway 主要是用來將地端的存儲移往 EFS，支援 iSCSI
- Storage Gateway 支援 Cached Volume 與 Stored Volume
  - Cached Volume：資料大多會儲存在 AWS (S3)，但經常存取的資料還是放在地端
  - Stored Volume：資料在地端與 AWS 上都會有完整的一份

## Bests Practice

- 可以在資源上打 Tag，方便你追蹤費用
- Well-Architected Tool 可以用來監測 AWS 上的工作流程是否符合最佳實踐

## Machine Learning Related Service (透過機器學習達到各種功能的服務)

- Amazon Rekognition 用於辨識圖片或影片上的人物、文字與物件特徵
- Macie：偵測 S3 上的文件與影片是否有不法或敏感的內容
- Amazon Inspector 主要用來掃描 AWS 上的應用程式與容器的漏洞，用於改進它們資安設定與合規性
- Transcribe：speech to text
- Polly：text to speech
- Lex：聊天機器人
- Connect：雲端聯絡中心，可以與 Lex 做搭配
- Translate：翻譯
- Comprehend：自然語言處理 (NLP)
- SageMaker：ML 開發與資料科學
- Forecast：預測模型
- Kendra：搜尋引擎
- Personalize：real-time 個人化建議
- Textract：文件中的文字偵測並提取

## Amazon Quantum Ledger Database (Amazon QLDB)

- Amazon Quantum Ledger Database (Amazon QLDB) 是一個全受管帳本資料庫，提供透明、不可變且以密碼編譯方式驗證的交易日誌

## Amazon WorkSpaces

- Amazon WorkSpaces Family 解決方案針對不同類型的員工，隨時隨地提供合適的虛擬工作空間。改善 IT 敏捷性並最大化使用者體驗，同時只需為您使用的基礎設施付費

## AWS Elastic Beanstalk

- 不只支援 EC2，也支援 ECS
- 會將 application log 會存在 S3
- server log 可以存在 S3 or CloudWatch Logs

## AWS Elastic Disaster Recovery (AWS DRS)

- AWS Elastic Disaster Recovery (AWS DRS) 是一種服務，可讓您在 AWS 上輕鬆建立和管理災難復原 (DR) 環境

## Others

- Personal Health Dashboard 是用來看你帳號上的狀況
- Service Health Dashboard 是用來看 AWS 服務有沒有正常運作
- 多選題注意他問你的類型
  - 組合 (combination)：例如 A 與 B 一起使用才能達到某個功能
  - 選擇 (selection)：例如 A 或是 B 都可以達到某個功能
