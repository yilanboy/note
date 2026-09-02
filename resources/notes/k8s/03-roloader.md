# Reloader

為開源專案，當更新 `ConfigMap` 與 `Secret` 時，會重新建立與之相依的 `Pod`，讓 `Pod` 使用最新的設定。

## 概念

Reloader 會在叢集中執行一個 controller，這個 controller 會不斷的檢查 `ConfigMap` 與 `Secret` 是否有更新，
如果有的話，就會滾動更新 (rolling update) 與之相依的 Pod。

## 部署 Reloader 到 K3s 中

可以使用官方的配置清單部署。

```shell
kubectl apply -f https://raw.githubusercontent.com/stakater/Reloader/master/deployments/kubernetes/reloader.yaml
```

## 修改服務的配置清單，啟動 Reloader 的檢查機制

如果你有一個 `Deployment`，只要在他的配置清單加上下方的 `annotations`，當這個 `Deployment` 使用的 `ConfigMap` 與 `Secret` 有更新時，
就會觸發這個 `Deployment` 的滾動更新。

```yaml
kind: Deployment
metadata:
    annotations:
        reloader.stakater.com/auto: 'true'
spec:
    template:
        metadata:
```

## 參考資料

- [GitHub - stakater/Reloader](https://github.com/stakater/Reloader)
