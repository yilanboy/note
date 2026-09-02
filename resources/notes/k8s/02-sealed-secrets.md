# Sealed Secrets

K8s 的 Secret 主要用來存放敏感資訊，但它是以 base64 的編碼來儲存，並非使用加密，所以 Secret 不能放入版本控制中的，避免洩漏機密的風險。

為了解決這麼問題，Bitnami 推出了 Sealed Secrets 這個工具，可以將 secrets 加密後，再放入版本控制中。

## 概念

Sealed secrets 由兩個部分組成。

- A cluster-side controller / operator
- A client-side utility: `kubeseal`

Sealed secrets 的概念是會在 k8s 叢集上面啟動一個 sealed secrets controller，用戶端可以使用 `kubeseal` 與該 controller 溝通並取得憑證，
`kubeseal` 會使用這個憑證來加密 `Secret` 資源，使其變成 `SealedSecret`。

假設我們有一個 `Secret` 設定檔案如下：

```yaml
apiVersion: v1
kind: Secret
metadata:
    name: mysecret
    namespace: mynamespace
data:
    foo: YmFy # <- base64 encoded "bar"
```

我們可以使用 sealed secret 將其變成加密後的 `SealedSecret` 設定檔案：

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
    name: mysecret
    namespace: mynamespace
spec:
    encryptedData:
        foo: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEq.....
```

當你將 `SealedSecret` 部署到叢集時，**sealed secrets controller 會自動將你的 `SealedSecret` 解密，並建立對應的 `Secret`**。

## 使用 Helm 部署 Sealed Secrets Controller

可以使用 Helm 部署 Sealed Secrets Controller。

```shell
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets

helm install sealed-secrets -n kube-system --set-string fullnameOverride=sealed-secrets-controller sealed-secrets/sealed-secrets
```

Sealed secrets controller 的預設名稱為 `sealed-secrets`。

因為 `kubeseal` 預設會找尋名稱為 `sealed-secrets-controller` 的 controller，
因此這裡使用 `--set-string fullnameOverride=sealed-secrets-controller` 將 controller 的預設名稱修改為 `sealed-secrets-controller`。

## 使用 Kubeseal 將 Secret 轉換成 SealedSecret

Mac 上可以使用 Homebrew 安裝 `kubeseal`。

```shell
brew install kubeseal
```

安裝完成之後就可以使用 kubeseal 將原本的 `Secret` 轉換成 `SealedSecret`。

```shell
kubeseal -f mysecret.yaml -w mysealedsecret.yaml
```

## 將 SealedSecret 部署到叢集中，讓 Controller 幫我們解密並部署 Secret

假設我們有一個 `mysql-secret.yaml`，其內容如下：

```yaml
apiVersion: v1
kind: Secret
metadata:
    namespace: mysql
    name: mysql-secret
type: Opaque
stringData:
    root-password: 'oPKcjfYqRUuzi7Mi'
    password: 'oPAspyYdAEHRqhU5'
```

使用 `kubeseal` 將其轉換成 `SealedSecret`。

```shell
kubeseal -f mysql-secret.yaml -w mysql-sealed-secret.yaml
```

`mysql-sealed-secret.yaml` 的內容如下。

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
    creationTimestamp: null
    name: mysql-secret
    namespace: mysql
spec:
    encryptedData:
        password: AgAYrXLOxXW+TyTw9CpNBJGclc+6f2ZMxCNwi4DqQgDTuCZ5kCtyvXSGlI8bN4o1stzHHAD+Abl9mPSbT6rv9e/m7ivgZim+OV7hR2Ofy+5pFuxo4wvo5WmEHAawFHLwKEvOljOHPJYbsAjd5xCeVah247+QknytvDMOss18N2z3quCge1jc1eMsi2s3joFKWP8frLbuvDOuo2HlH8je7RBPvnoMieGbFM+XMOBCVAj+ECIKigNQK6i2hNW11zzox3UMTuiZ1aoqhcP1XlppVOeVuTRVNTjr1ufM8s96ep9XxABSHyLXHOB1K1TJ/AUvju6DilhKBiiXEHapCj+Ep/n2HUsiKk2v52mdYIk7rAgm5Y/y2ga0iIl5KX35qKFgi4CH36/K9XEG/Fb/a91PCeIvYRsTpadYV15GQecMURgc/xs6DnCxEKWoUSBpEsAE4mcjPOFQ8nxtoaeJkqaFyPLGrxK6RSTPO80u9K6LAr3P3DUIxf7WYfddyD4A5dxS0uU455mgKZ4qTQgPS+ui9s8yjQAjXLMrzQbs7ryqlOP0xlzAepLuIGEqf5qNdjxk2JbogpChqpLwk73Zb8kYn+rQ7VTqEhQTUxZDunRfQdkp2YzzP6SYwhDVLEC4xEazYHpc5YMT1pNvHCqkorD+IU2FVXKf61hgp3Vd3w+9nxTtg30P07d+xS3uJ3mhYlfmaxkPMlM2r81EszcpOxxcY24C
        root-password: AgDOYVakO0Zekv16s+NGCoeDPVLHUL+96j9zgiUPL1OS0V8hP8ibeRcDD6cTNIKEBLS+/rKwpc5YbdGGCmUC0o+uHs5Noxr0ZTCeLEgNcDP3G4ZHX8TXXYkeSeklV4+bCBM+BNrfEiOx4DpOle+p7MeVMdtHnSSBjYo+aclgwtrIGfiCoKKuz+qTuGcm97vTaIy+vNwZNn1yreDcsaix10xitypI+z+Yq5/r0bTSP/r7IHtV7hAoMtXMkkPjCP7UHnsu6m7m9zAhxSVwyKfIvjAbbD6ymguq/o06GSwS6JuZPz9YbPXnlc/a2Ku/m+OzzVHECNUTQ7x50X0E33bAJlOlM9nMk1k2nOaut0qNOnZ3+RVsact0JLSXLMP4Vm8thXl/1ZBfN814cH0tooiaEsv82dwHjJdJFju5KfN+1jLhkflNmlgKGU/BIyaXOPJeCT7eXpD9Ks0uZhFuJYaLxcMzJEpZvvJst9NQBqOoHB9BMm63GDVHyv8ojHXzEfzLbbgsCt0cqsFFrFkJeWLBcnz42FY0SIE7HM9FcRICcGARjSD2PcFEEOpLLLWTVPZQGRZgojVDw4dD36qpHrytfSmyWFQbo5X+ouyWKzx+thO0f/BW4Sv3D1Z3OYO/FfzR/apHAjhgNkf5/54u5Fel/fBS4nhq/xbfceD+3acvAWdgY910vsztiwdJQkKbw2oQm8WS2q2f3xZ33CUxHNHMTyza
    template:
        metadata:
            creationTimestamp: null
            name: mysql-secret
            namespace: mysql
        type: Opaque
```

我們先建立 `mysql-sealed-secret.yaml` 對應的 namespace `mysql`。

```shell
kubectl create namespace mysql
```

之後將 `mysql-sealed-secret.yaml` 部署到叢集中。

使用 `kubectl get secret -n mysql` 查看，會發現 controller 已經自動幫我們解密 `SealedSecret`，並生成 `Secret`。

```text
NAME           TYPE     DATA   AGE
mysql-secret   Opaque   2      20s
```

## 參考資料

- ["Sealed Secrets" for Kubernetes](https://github.com/bitnami-labs/sealed-secrets)
- [Day 25 - Secret 使用範例: sealed-secrets](https://ithelp.ithome.com.tw/articles/10251551)
