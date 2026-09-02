# Kubernetes (K8s)

一直想學習如何使用 k8s，因此計畫自己在雲端上面開一些機器然後搭建一個 k3s 叢集，
並將自己的部落格 (Laravel App) 轉移到 k3s 叢集上。

> k3s 為輕量版的 k8s，也是 CNCF 的專案之一，在使用上與 k8s 幾乎相同。

## 計畫

搭建好叢集之後預計做一些項目來練習如何使用 k8s。

- 將自己的部落格搬移到 k8s 上。
- 在 k8s 上面部署 Argo CD，可以透過 Argo CD 更新與部署部落格。

## 架構

與前輩討論後，便規劃了下面的網路架構。

![k8s architecture](https://allen-files.s3.ap-northeast-1.amazonaws.com/images/k8s/k8s-architecture.jpg)

- 在一個 VPC 底下，有兩個 subnet，一個是可以與外部直接連線的 public subnet，一個是只能透過 NAT 與外部連線的 private subnet。
- Public subnet 底下有一個用 nginx 做的 proxy。
- 想使用 SSH 遠端連線到 private subnet 底下的機器時，需要透過 proxy 當作 SSH 的跳板。
- 因為 k3s 叢集放在 private subnet，所以外部無法直接訪問，如果想訪問叢集上的服務，會透過 proxy 做請求上的轉發。
- 想在本地端使用 `kubectl` 操作 k3s 叢集時，也會透過 proxy 做請求上的轉發。

    ```nginx
    stream {
        server {
            listen 6443;
            proxy_pass 10.0.1.10:6443;
        }
    }
    ```

    > Kubectl 本身就是使用 TLS 加密，因此不需要在 nginx 上額外設定憑證，只需要單純轉發請求就好。
