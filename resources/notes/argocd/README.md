# Argo CD

Argo CD 是用於 Kubernetes 的宣告式 (Declarative) GitOps 持續交付工具。

## 在 K8s 上面部署 Argo CD

要在 k8s 上面部署 Argo CD 非常簡單，只需要兩行指令。

```shell
# 建立一個 namespace，名稱是 argocd
kubectl create namespace argocd

# 使用官方的 yaml 部署 argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

> 如果需要 HA (High Availability) 部署，官方有提供 HA 部署的 yaml 檔案，可以參考[官方文件](https://argo-cd.readthedocs.io/en/stable/operator-manual/high_availability/)

使用 `kubectl get pod -n argocd` 查看一下 Argo CD 啟用了哪些容器。

```text
NAME                                                READY   STATUS    RESTARTS   AGE
argocd-application-controller-0                     1/1     Running   0          111m
argocd-applicationset-controller-5c64658ff9-dlfts   1/1     Running   0          111m
argocd-dex-server-78659867d9-7txm7                  1/1     Running   0          111m
argocd-notifications-controller-749b96fd4d-mtp5x    1/1     Running   0          111m
argocd-redis-74cb89f466-866sq                       1/1     Running   0          111m
argocd-repo-server-69746cbd47-jf5tn                 1/1     Running   0          111m
argocd-server-79d6c44f4c-7zmxv                      1/1     Running   0          108m
```

使用 `kubectl get svc -n argocd` 查看一下 Argo CD 啟用了哪些服務。

```text
NAME                                      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
argocd-applicationset-controller          ClusterIP   10.97.226.89     <none>        7000/TCP,8080/TCP            115m
argocd-dex-server                         ClusterIP   10.100.148.137   <none>        5556/TCP,5557/TCP,5558/TCP   115m
argocd-metrics                            ClusterIP   10.99.60.187     <none>        8082/TCP                     114m
argocd-notifications-controller-metrics   ClusterIP   10.105.63.55     <none>        9001/TCP                     114m
argocd-redis                              ClusterIP   10.97.64.209     <none>        6379/TCP                     114m
argocd-repo-server                        ClusterIP   10.102.192.219   <none>        8081/TCP,8084/TCP            114m
argocd-server                             NodePort    10.96.119.73     <none>        80/TCP,443/TCP               114m
argocd-server-metrics                     ClusterIP   10.107.181.67    <none>        8083/TCP                     114m
```

`argocd-server` 主要提供 Web UI 與 gRPC API 給用戶進行操作。

- 443 - gRPC/HTTPS
- 80 - HTTP (redirects to HTTPS)

你可以使用 Argo CLI 或是 Web UI 來操作 Argo CD。

在 Mac 與 Linux 上，你可以使用 Homebrew 安裝 Argo CD CLI。

```shell
brew install argocd
```

> 其他 argo CLI 安裝方式可以參考[這裡](https://argo-cd.readthedocs.io/en/stable/cli_installation/)。

安裝完成之後 Argo CD 會有預設的帳號密碼，帳號為 `admin`，密碼可以使用下面的指令得知。

```shell
argocd admin initial-password -n argocd
```

你可以透過該組帳號密碼登入 Argo CD。

> 建議登入後立刻修改密碼並刪除 argocd namespace 底下的 `argocd-initial-admin-secret` secret。

## 關閉 TLS 與開啟 NodePort

我打算透過 nginx 當作 reverse proxy，將外部的流量導入到 `argocd-server`，
外部到 nginx 的請求會進行加密。而內網的部分，從 nginx 轉發到 `argocd-server` 的請求就不進行加密。

首先關閉 `argocd-server` 的 TLS 設定，這裡使用 `kubectl patch` 更新部署的設定。

> kubectl patch 的的更動會立刻套用，不需要重新啟動 k8s 上的資源。

```shell
# declared merge key in containers is "name"
kubectl patch deployment argocd-server --namespace argocd --patch '{"spec":{"template":{"spec":{"containers":[{"args":["/usr/local/bin/argocd-server","--insecure"],"name":"argocd-server"}]}}}}'
```

更新完成之後可以使用 `kubectl get deploy` 來查看修改後的設定。

```shell
kubectl get deploy argocd-server -n argocd -o yaml
```

更新 `argocd-server` 的 service，將網路類型修改為 `NodePort`，並指定 80 port 的 `NodePort` 為 30081 port。

```shell
# declared merge key in ports is "port"
kubectl patch svc argocd-server -n argocd -p '{"spec":{"type":"NodePort","ports":[{"port":80,"nodePort":30081}]}}'
```

更新完成之後可以使用 `kubectl get svc` 來查看修改後的設定。

```shell
kubectl get svc argocd-server -n argocd -o yaml
```

## 修改 Nginx 的設定，將外部流量轉發到 Argo CD Server

假設 k8s server 的內網 IP 為 10.0.0.10，而 argo server 使用的 node port 為 30081。

在 `/etc/nginx/sites-available` 中新增一個檔案 `argocd.example.com.conf`，內容如下：

> `argocd.example.com` 需要修改成你自己的網域。

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name argocd.example.com;
    server_tokens off;

    ssl_certificate /etc/cert/argocd.example.com.pem;
    ssl_certificate_key /etc/cert/argocd.example.com.key;

    charset utf-8;

    access_log off;
    error_log  /var/log/nginx/argocd.example.com-error.log error;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header Scheme $scheme;
        proxy_set_header SERVER_PORT $server_port;
        proxy_set_header REMOTE_ADDR $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_pass http://10.0.0.10:30081;
    }
}
```

設定好了之後建立軟連結，啟用剛剛建立的設定檔案。

```shell
sudo ln -s /etc/nginx/sites-available/argocd.example.com.conf /etc/nginx/sites-enabled/argocd.example.com.conf
```

重啟 nginx 之前，先使用 nginx 的指令進行檢查。

```shell
sudo nginx -t
```

確認無誤之後就可以重新啟動了。

```shell
sudo systemctl restart nginx
```

## 如何使用 Argo CD 將應用部署到 K8s 中

準備一個用 yaml 寫的 k8s 配置清單 (manifest)，內容為啟動一個 nginx pod，並在叢集上開啟 30080 port，讓叢集外部可以訪問 pod 裡面的 nginx server。

### 準備 K8s 的配置清單

建立一個 `nginx` 專案，並在下面新增幾個 k8s 的配置清單檔案。

```text
tree nginx/

nginx/
└── deployment
    ├── nginx-pod.yaml
    └── nginx-service.yaml

2 directories, 2 files
```

`nginx-pod.yaml` 的內容：

```yaml
apiVersion: v1
kind: Pod
metadata:
    namespace: nginx
    name: nginx-pod
    labels:
        app: nginx
spec:
    containers:
        - name: nginx
          image: nginx:1.17.10
          resources:
              limits:
                  cpu: '1'
                  memory: '250Mi'
          ports:
              - containerPort: 80
```

`nginx-service.yaml` 的內容：

```yaml
apiVersion: v1
kind: service
metadata:
    namespace: nginx
    name: nginx-service
spec:
    type: NodePort
    ports:
        - port: 80
          targetPort: 80
          nodePort: 30080
    selector:
        app: nginx
```

### 使用 Argo CD Web UI 建立 Application，將 Nginx 部署到 K8s 上

將剛剛的 `nginx` 專案推送至 github 上，這會是我們 Argo CD 的**部署來源**。

打開瀏覽器，登入 Argo CD Web UI，點選 + NEW APP。

![create new app in argo cd](https://allen-files.s3.ap-northeast-1.amazonaws.com/images/k8s/argo-cd-new-app.png)

在 GENERAL 區塊，填寫 Application Name、Project Name 與 SYNC POLICY。

Project 是 application 底下的一個邏輯群組，可以用來管理部署來源、部署的內容與部署的目標叢集，project 預設一定會有一個 `default`。

SYNC POLICY 可以設定自動 (Automatic) 與手動 (Manual)。Argo CD 提供 rollback 的功能，
可以跳回前一個部署版本，但是 SYNC POLICY 必須選擇手動。

![general setting](https://allen-files.s3.ap-northeast-1.amazonaws.com/images/k8s/argo-cd-general-setting.png)

設定部署來源，為 github 儲存庫的連結。

![source setting](https://allen-files.s3.ap-northeast-1.amazonaws.com/images/k8s/argo-cd-source-setting.png)

設定部署目標叢集，如果 namespace 還沒有建立的話，可以自行建立或是勾選 GENERAL 區塊的 AUTO-CREATE NAMESPACE。

![destination setting](https://allen-files.s3.ap-northeast-1.amazonaws.com/images/k8s/argo-cd-destination-setting.png)

設定完成後就可以按下 CREATE 建立 application，如果 SYNC POLICY 設定 Automatic，
應該就會發現 Argo CD 已經開始在部署 nginx 到 k8s 上了。

## 參考資料

- [維基百科 - 宣告式程式設計](https://zh.wikipedia.org/zh-tw/%E5%AE%A3%E5%91%8A%E5%BC%8F%E7%B7%A8%E7%A8%8B)
- [維基百科 - 指令式程式設計](https://zh.wikipedia.org/zh-tw/%E6%8C%87%E4%BB%A4%E5%BC%8F%E7%B7%A8%E7%A8%8B)
- [Argo CD - Getting Started](https://argo-cd.readthedocs.io/en/stable/getting_started/)
- [Argo CD - Ingress Configuration](https://argo-cd.readthedocs.io/en/stable/operator-manual/ingress/)
- ["argocd-server --insecure": executable file not found in $PATH: unknown](https://github.com/argoproj/argo-cd/discussions/8520)
- [Argo CD 保姆級入門教程](https://www.readfog.com/a/1676342497667813376)
