# Prometheus

Prometheus 是一個由 Grafana Lab 開發並維護的開源監控系統，用於記錄和查詢系統的監控資料。Prometheus 透過 HTTP 協定來收集監控資料，並且提供一個簡單的查詢語言 PromQL 來查詢監控資料。

> Prometheus 是一個時間序列資料庫

## Use Prometheus to Get Node Exporter Metrics and Send to Grafana Cloud

安裝 Prometheus，以便收集 Node Exporter 的監控資料，並將監控的資料送往 Grafana Cloud 的 Prometheus。

### Install Prometheus

新增一個 prometheus 使用者，並且不要建立家目錄，也不要讓他可以登入。

```bash
sudo useradd --no-create-home --shell /bin/false prometheus
```

下載 Prometheus 的檔案並解壓縮。

```bash
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-arm64.tar.gz

tar xvfz prometheus-2.45.0.linux-arm64.tar.gz
```

將 Prometheus 的執行檔案複製到 `/usr/local/bin/` 目錄下。

```bash
sudo cp prometheus-2.45.0.linux-arm64/prometheus /usr/local/bin/

sudo cp prometheus-2.45.0.linux-arm64/promtool /usr/local/bin/
```

將 Prometheus 的設定檔案複製到 /etc/prometheus/ 目錄下。

```bash
sudo cp -r prometheus-2.45.0.linux-arm64/consoles /etc/prometheus

sudo cp -r prometheus-2.45.0.linux-arm64/console_libraries /etc/prometheus

sudo chown -R prometheus:prometheus /etc/prometheus/consoles

sudo chown -R prometheus:prometheus /etc/prometheus/console_libraries
```

刪除 Prometheus 的壓縮檔案和解壓縮後的目錄。

```bash
rm -rf prometheus-2.45.0.linux-arm64.tar.gz prometheus-2.45.0.linux-arm64
```

### Create Prometheus Service

建立一個 service 檔案，讓 Prometheus 可以在背景執行。

```bash
sudo touch /etc/systemd/system/prometheus.service

sudo vim /etc/systemd/system/prometheus.service
```

Service 檔案內容如下：

```bash
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
ExecStart=/usr/local/bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload

sudo systemctl start prometheus
```

### Prometheus Configuration

在 `/etc/prometheus/` 目錄下建立一個 `prometheus.yml` 檔案，並且將內容貼上。

```yaml
global:
    scrape_interval: 60s

scrape_configs:
    - job_name: k3s
      static_configs:
          - targets: ['10.0.1.10:9100', '10.0.1.11:9100', '10.0.1.12:9100']

remote_write:
    - url: '<grafana cloud prometheus>'
      basic_auth:
          username: <username>
          password: <password>
```

這樣 prometheus 就可以收集到 node exporter 的資料，並將 node exporter 的資料送往 Grafana Cloud 的 Prometheus。

如果你想移除從 exporter 取得的部分 metrics 資料，可以使用 `metric_relabel_configs`。

```yaml
scrape_configs:
    - job_name: k3s
      static_configs:
          - targets: ['10.0.1.10:9100', '10.0.1.11:9100', '10.0.1.12:9100']

      metric_relabel_configs:
          - source_labels: [__name__]
            regex: '^(go_).*'
            action: drop
```

## 參考資料

- [教學課程：在 Amazon Lightsail 中於以 Linux 為基礎的執行個體上安裝 Prometheus](https://lightsail.aws.amazon.com/ls/docs/zh_tw/articles/amazon-lightsail-install-prometheus)
- [How To Configure a Linux Service to Start Automatically After a Crash or Reboot – Part 1: Practical Examples](https://www.digitalocean.com/community/tutorials/how-to-configure-a-linux-service-to-start-automatically-after-a-crash-or-reboot-part-1-practical-examples)
- [鳥哥私房菜 - 服務管理與開機流程管理](https://linux.vbird.org/linux_basic_train/centos7/unit13.php)
