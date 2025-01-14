---
layout: default
parent: AWS
nav_order: 24
---

# Elastic Container Service (ECS)

為 AWS 的容器服務，容器的 Image 可以放在 AWS ECR (Elastic Container Repository)。
ECS 可以運行在實體機器的 EC2 上，也可以運行在 Serverless 環境，也就是 AWS Fargate。

在 ECS 上你可以透過任務 (Task) 來設定要運行的容器與容器中要執行的程序。

值得一提的是，ECS 並不便宜，一般來說在同樣的 CPU 核心數與記憶體大小下，會比租用 VM 還貴得多。
因此建議用來執行短時間內能完成的任務，而不是運行長期性的服務。

> 當然你要運行服務也可以。跑在 Fargate 上的 ECS 與 Lambda 一樣擁有不需要維護機器的優點。

## 特性

- ECS 本身提供 20GB 的暫時存儲空間，如果覺得不夠，可以掛上 EFS (Elastic Flexible System)，這樣就沒有硬碟空間上限。
- ECS 的 Concurrency 數目可以到達 500 個，意思就是可以在同一時間內有多個容器運行你設定的任務。

## AWS CLI 筆記

一行指令執行任務。

```bash
aws ecs run-task \
--cluster POC-01-ECS-Cluster \
--task-definition POC-01-job-flow-log-import \
--network-configuration "awsvpcConfiguration={subnets=[subnet-01...,subnet-02...],securityGroups=[sg-01...],assignPublicIp=ENABLED}"
```

可以透過 `--overrides` 來覆寫任務中的設定。

```bash
aws ecs run-task \
--cluster POC-01-ECS-Cluster \
--task-definition POC-01-job-flow-log-import \
--network-configuration "awsvpcConfiguration={subnets=[subnet-01...,subnet-02...],securityGroups=[sg-01...],assignPublicIp=ENABLED}" \
--overrides '{"containerOverrides": [{"name": "POC-01-job-flow-log-import","command": ["/usr/bin/bash","script-ext.sh","2024/11/21"]}]}'
```

## 如何將自己的 Image 推送至 ECR

你可以使用 `docker push` 指令將自己製作的 Image 推送至 ECR。

> Amazon ECR 儲存庫必須先存在，才能推送 Image。

首先在 Docker 中建立 Amazon ECR 的登錄檔，這樣才有權限推送 Image 到 ECR。

```bash
aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com
```

建立你的 Image 並推送到 ECR.

```bash
docker buildx build \
    --platform linux/arm64 \
    --push -t AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/IMAGE_NAME:latest .
```

## SAA 題庫筆記

- ECS Task 如果要掛上 IAM Role，需要在 task 中設定 `taskRoleArn`
- `EnableTaskIAMRole` 是用在 windows based 的 task 設定

## 參考資料

- [Fargate task ephemeral storage for Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-storage.html)
- [將 Docker 映像推送至 Amazon ECR 私有儲存庫](https://docs.aws.amazon.com/zh_tw/AmazonECR/latest/userguide/docker-push-ecr-image.html)
