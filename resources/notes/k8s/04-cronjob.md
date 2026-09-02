# 使用 K8s CronJob 來備份資料庫

我的部落格目前是搭建在自己架的 K3s (K8s 輕量版)上，資料庫是使用 MySQL，為了以防萬一導致資料遺失，平常我會以人工的方式下指令來備份部落格的資料庫。

```bash
kubectl exec -it <mysql-pod-name> -- mysqldump -u root --password=${MYSQL_ROOT_PASSWORD} $DATABASE_NAME > backup.sql
```

人工執行一段時間才意識到怪怪的。

「我怎麼都沒有考慮使用 K8s 的功能來備份資料庫？」

上網找了些資料，才發現 K8s 其實有提供執行排程工作的 CronJob 資源。CronJob 會啟動 Pod 來執行預先設定好的工作，並在執行完畢會立刻關閉 Pod，所以不會一直佔用資源。於是我計劃使用 CronJob 來定期備份資料庫，並將備份檔案上傳到 S3 上。

首先建立一個安裝 Mysqldump 與 AWS CLI 的容器映像檔。新建一個 Dockerfile 檔案，並寫入以下內容：

```dockerfile
FROM ubuntu:22.04

SHELL ["/bin/bash", "-exou", "pipefail", "-c"]

RUN apt update \
    && apt upgrade -y \
    && apt install -y \
        curl \
        zip \
        unzip \
        mysql-client

# 安裝 AWS CLI
RUN if [ "$(uname -m)" = "x86_64" ]; then \
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
            && unzip awscliv2.zip \
            && ./aws/install; \
    elif [ "$(uname -m)" = "aarch64" ]; then \
        curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip" \
            && unzip awscliv2.zip \
            && ./aws/install; \
    else \
        echo "Unsupported platform" && exit 1; \
    fi

ARG WWWUSER=1000
ARG WWWGROUP=1000

# 建立名為 "scheduler" 的群組與使用者
RUN groupadd -g $WWWGROUP scheduler || true \
    && useradd -ms /bin/bash --no-log-init --no-user-group -g $WWWGROUP -u $WWWUSER scheduler

WORKDIR /home/scheduler

USER scheduler

CMD ["/bin/bash"]
```

`Dockerfile` 寫好之後開始建立映像檔，並將映像檔推送到 Docker Hub 上。

```bash
docker buildx build --platform linux/arm64 --push -t nella0128/mysql-backup-to-s3 .
```

映像檔準備好之後，就可以開始寫用來部署 CronJob 到 K3s 的 `yaml` 檔案。建立一個 `mysql-backup-cronjob.yaml` 檔案，並寫入以下的內容：

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
    namespace: docfunc
    name: mysql-backup-cronjob
spec:
    # 設定每小時執行一次
    schedule: '0 * * * *'
    jobTemplate:
        spec:
            template:
                spec:
                    containers:
                        - name: mysql-backup-cronjob
                          image: nella0128/mysql-backup-to-s3:latest
                          imagePullPolicy: 'Always'
                          # 執行 mysqldump 指令，並將備份檔案上傳到 S3 上
                          command:
                              - '/bin/bash'
                              - '-c'
                              - |
                                  mysqldump --no-tablespaces -h $DATABASE_HOST -P $DATABASE_PORT -u $DATABASE_USER --password=$DATABASE_PASSWORD $DATABASE_NAME > $BACKUP_FILE_NAME
                                  aws s3 cp $BACKUP_FILE_NAME s3://$S3_BUCKET_NAME/$(date +'%Y%m%d%H%M%S')_$BACKUP_FILE_NAME
                          # 設定需要的環境變數
                          env:
                              - name: DATABASE_HOST
                                value: mysql-service
                              - name: DATABASE_PORT
                                value: '3306'
                              - name: DATABASE_USER
                                value: blog_admin
                              - name: DATABASE_PASSWORD
                                valueFrom:
                                    secretKeyRef:
                                        key: mysql_password
                                        name: secrets
                              - name: DATABASE_NAME
                                value: blog
                              - name: BACKUP_FILE_NAME
                                value: blog.sql
                              - name: S3_BUCKET_NAME
                                value: docfunc-backups
                              - name: AWS_ACCESS_KEY_ID
                                valueFrom:
                                    secretKeyRef:
                                        key: aws_access_key_id
                                        name: secrets
                              - name: AWS_SECRET_ACCESS_KEY
                                valueFrom:
                                    secretKeyRef:
                                        key: aws_secret_access_key
                                        name: secrets
                              - name: AWS_DEFAULT_REGION
                                value: ap-northeast-1
                    restartPolicy: OnFailure
```

使用 ArgoCD 部署上去之後，就可以看到 CronJob 開始執行了。

![ArgoCD screenshot for CronJob](https://docfunc-files.s3.ap-northeast-1.amazonaws.com/images/2023_12_14_17_08_55_c9562b0a863e.png)

> `CronJob` 會保留執行紀錄方便你 Debug 用，如果不想保留，可以將下列設定的值設定為 `0`：
>
> - `.spec.successfulJobsHistoryLimit`
> - `.spec.failedJobsHistoryLimit`

檢查一下 S3 上是否有檔案。

![S3 screenshot for CronJob](https://docfunc-files.s3.ap-northeast-1.amazonaws.com/images/2023_12_14_17_16_13_6f27b3836c12.png)
