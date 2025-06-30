---
layout: default
parent: Docker
nav_order: 8
---

# Logging Drivers

Docker 本身可以使用多種不同的 Logging Drivers 來記錄容器輸出的日誌。

Docker 預設的 Logging Driver 是 `json-file`。也就是簡單的將日誌以 JSON 格式儲存在容器內部。

你可以用下面的指令查看目前的 Logging Driver：

```bash
docker info --format '{{.LoggingDriver}}'
```

## Local Logging Driver

你可以使用 `local` Logging Driver 來避免容器日誌量過大的問題，因為容器預設不會執行 Log Rotation，所以日誌會隨著時間越來越肥大。

`local` Logging Driver 會自動執行 Log Rotation，所以會比 `json-file` 快更適合當作預設的 Logging Driver。

> [!NOTE]
>
> Q：為什麼 Docker 不使用 `local` 當作預設的 Logging Driver？
>
> A：主要是為了與舊版本兼容。

你可以編輯 `~/.docker/daemon.json` 來預設使用 `local` Logging Driver。

```json
{
  "log-driver": "local",
  "log-opts": {
    "max-size": "10m"
  }
}
```

也可以在啟動容器時透過參數指定 Logging Driver。

```bash
docker run \
      --log-driver local --log-opt max-size=10m \
      alpine echo hello world
```

## 參考資料

- [Configure logging drivers](https://docs.docker.com/engine/logging/configure/)
- [Local file logging driver](https://docs.docker.com/engine/logging/drivers/local/)
