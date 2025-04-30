---
layout: default
parent: Docker
nav_order: 2
---

# 建立映像檔

寫好 `Dockerfile`，就可以使用 docker 指令開始建立 image

```bash
# 確定與 Dockerfile 在同一個目錄底下
docker build -t image:tag .

# 可以使用 -f 指定 Dockerfile
docker build -t image:tag ./Dockerfile
```

## 使用 Docker Buildx 建立不同架構的映像檔

Docker Buildx 是一個 Docker 官方的工具，可以用來建構跨平台的 Docker 映像檔

使用 Docker Buildx，您可以輕鬆地建構多種不同系統架構的映像檔，例如 x86、ARM、IBM PowerPC 等等

可以查看目前系統支援 build 哪幾種架構

```bash
docker buildx ls
```

顯示結果如下，`*` 表示預設使用的 builder

```text
NAME/NODE     DRIVER/ENDPOINT STATUS                         BUILDKIT PLATFORMS
default *     docker          default default                running  20.10.22 linux/arm64, linux/amd64, linux/riscv64, linux/ppc64le, linux/s390x, linux/386, linux/arm/v7, linux/arm/v6
desktop-linux docker          desktop-linux desktop-linux    running  20.10.22 linux/arm64, linux/amd64, linux/riscv64, linux/ppc64le, linux/s390x, linux/386, linux/arm/v7, linux/arm/v6
```

我們可以建立以 docker container 執行的 builder，並設定新建立的 builder 為預設

```bash
docker buildx create --name mybuilder --platform linux/amd64,linux/arm64
docker buildx use mybuilder
```

之後我們就可以使用 Buildx 建立不同架構的映像檔案，並推送至 Docker Hub

```bash
# 確定與 Dockerfile 在同一個目錄底下
docker buildx build --platform linux/amd64,linux/arm64 --push -t image:tag .
```
