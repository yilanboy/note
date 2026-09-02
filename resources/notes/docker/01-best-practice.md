# Docker Best Practice

詢問 ChatGPT 有關於使用 Docker 的最佳實踐

feat. ChatGPT

## Minimize the Number of Layers

在 Docker 中，一個映像檔 (image) 是由一系列的層（layer）構成的。每一層都是由上一層所做的更改而來，而這些更改通常是基於前一層的內容而進行的

這些層的存在可以讓映像檔變得非常輕量、易於傳輸和管理。當您下載或共享一個映像檔時，**Docker 只會下載或共享這個映像檔中新增或修改的那一層**，而不是整個映像檔。這種方式可以減少傳輸和儲存所需的時間和空間

在寫 `Dockerfile` 建立映像檔的時候，部分操作會增加映像檔的層數，以下方的 `Dockerfile` 為範例

```dockerfile
# syntax=docker/dockerfile:1
FROM ubuntu:22.04
COPY . /app
RUN make /app
CMD python /app/app.py
```

在 `Dockerfile` 中，以下這些操作都會增加 layer，讓最終建立出來的 image 的容量變大

- `FROM` : 指令指定基底映像檔。Docker 映像檔是基於現有映像檔建立的，該指令可以指定您要從哪個映像檔開始建立您的映像檔
- `COPY` : 指令將本地檔案複製到映像檔中的指定位置。該指令將在映像檔建立期間執行
- `RUN` : 指令執行容器中的命令，例如安裝軟體套件、更新套件資訊等等。該指令會在建立映像檔時被執行
- `CMD` : 指令定義容器啟動時要執行的預設命令。該指令只能在 Dockerfile 中使用一次，若多次使用僅會使用最後一次的指令

為了讓建立 image 的速度加快與減少 image 的容量，我們應該盡可能減少層數，以下方的 `Dockerfile` 為範例

```dockerfile
FROM ubuntu:22.04

RUN apt update
RUN apt upgrade -yqq
RUN apt install wget
```

我們應該改寫成

```dockerfile
FROM ubuntu:22.04

RUN apt update \
  && apt upgrade -yqq \
  && apt install wget
```

## Use Non-Root User to Start the Main Process in Container

### Q:

When we build a container image. Is there a suggestion that we should create a new user to start the main process, instead of using root user, right?

> 當我們建立一個容器映像檔，是不是建議應該新建一個用戶來啟動容器中的主程序，而非使用 root 來啟動？

### A:

Yes, it is generally recommended to use a non-root user to run the main process in a container, rather than running the process as the root user. This is considered a security best practice.

> 是的，通常建議使用一個非 root 用戶來執行容器中的主程序，而不是以 root 用戶的身份執行。這被認為是一種安全的最佳做法。

Running the process as a non-root user can help to limit the potential damage if the process is compromised or if there is a security vulnerability in the application running inside the container. If the process is running as the root user, an attacker who gains access to the process may be able to take control of the entire container and potentially even the host system.

> 如果程序被滲透或者在容器內運行的應用程式存在安全漏洞，以非 root 用戶身份執行該程序可以限制潛在的損害。
>
> 如果程序以 root 用戶身份執行，獲得程序訪問權的駭客可能會控制整個容器，甚至可能控制主機系統。

In addition to using a non-root user for the main process, it is also a good practice to run the container with the minimum required privileges and to restrict access to sensitive resources, such as ports and file systems, as appropriate. This can help to reduce the attack surface and improve the security of the container.

> 除了使用非 root 用戶執行主程序之外，以最小的權限運行容器，並酌情限制對敏感資源（如端口和文件系統）的訪問，也是一種良好的做法。這可以幫助減少攻擊面，提高容器的安全性。

### Example

在 Debian 映像上建立一個群組與用戶，它們的名稱都是 octane

```dockerfile
# create user and group in Dockerfile

ARG WWWUSER=1000
ARG WWWGROUP=1000

# "-m" flag means create home directory for the new user
# "-s" flag specifies the user's login shell. If this flag is not used, the default shell specified in the /etc/default/useradd file is used
# "--no-log-init" flag disables the initialization of the user's login shell
# "--no-user-group" flag prevents the creation of a new group with the same name as the new user. By default, when you create a new user with the useradd command, a new group with the same name as the user is also created
RUN groupadd --force -g $WWWGROUP octane \
    && useradd -ms /bin/bash --no-log-init --no-user-group -g $WWWGROUP -u $WWWUSER octane
```

## Use Multiple Stage Build to Reduce the Image Size

### Q:

In docker, what is the main purpose of the "Multiple Stage Build"?

> docker 的 Multiple Stage Build 功能主要用途為？

### A:

The main purpose of the "Multiple Stage Build" feature in Docker is to create smaller and more efficient Docker images.

> Multiple Stage Build 功能在 Docker 中的主要目的是幫助創建更小、更高效的 Docker 映像檔案。

With multiple stage builds, you can use separate Docker images to build different parts of your application, and then combine those parts into a single final image. Each stage can have its own dependencies and environment, and you can copy files between stages.

> 藉由 Multiple Stage Builds，您可以使用不同的 Docker 映像構建應用程式的不同部分，然後將這些部分組合成單個最終映像檔案。每個階段可以擁有自己的依賴和環境，並且您可以使用複製在不同階段之間分享檔案。

The benefit of this approach is that you can keep your build and runtime dependencies separate, which helps reduce the size of the final image. This is particularly useful in cases where you have a complex application with many dependencies, or when you need to build an image for a small, lightweight container.

> 這種方法的好處是可以將構建和執行時依賴項分開，從而有助於減少最終映像檔案的大小。在應用程式具有許多依賴項或需要為小型、輕量級容器構建鏡像的情況下，這特別有用。

By using multiple stage builds, you can also improve the security of your Docker images, since you can reduce the attack surface by only including the necessary dependencies in the final image.

> 藉由使用 Multiple Stage Builds，還可以提高 Docker 映像的安全性，因為我們僅在最終映像中包含必要的依賴項，以此減少攻擊面。

Overall, multiple stage builds are a powerful tool in Docker that can help you create more efficient, secure, and streamlined Docker images.

> 總的來說，Multiple Stage Builds 是 Docker 中的一個強大工具，可以幫助您創建更高效、安全和簡化的 Docker 映像。

### Example

舉個例子來說，假設今天我們要打包 Laravel App 的映像檔案，我們會有以下步驟

- 安裝 composer，並使用 composer 安裝 App 的 PHP 依賴套件
- 安裝 PHP，並使用 PHP 運行 Laravel App

我們需要 composer 幫我們安裝 App 的 PHP 依賴套件，但最終運行 App 時，我們只需要 PHP，並不需要 composer

這時我們可以使用 Multiple Stage Builds，將安裝依賴的**建構階段**與運行程式的**運行階段**給分開。

使用 composer 映像幫 App 安裝所需的 PHP 依賴，並將這些依賴檔案複製到最終運行 App 的映像中，如此一來，最終運行 App 的映像不會有 composer，但依然會有運行 App 所需的 PHP 依賴檔案，以此縮小映像檔案的大小

```dockerfile
ARG COMPOSER_VERSION=latest
ARG PHP_VERSION=8.2

############################################
# build stage
############################################

# use AS to name this stage to "vendor"
FROM composer:${COMPOSER_VERSION} AS vendor
WORKDIR /var/www/html
COPY composer* ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --ignore-platform-reqs \
    --optimize-autoloader \
    --apcu-autoloader \
    --ansi \
    --no-scripts \
    --audit

############################################
# final stage to run the app
############################################

FROM php:${PHP_VERSION}-cli-buster
WORKDIR /var/www/html

# copy dependencies from build stage, which is "vendor" stage
COPY --from=vendor /var/www/html/vendor vendor

CMD ["php", "artisan", "serve"]
```

## Log to STDOUT and STDERR in Docker Container

### Q:

Why we should log to `/dev/stdout` or `/dev/stderr` in docker container?

> 為什麼在 docker 容器中，我們應該把 log 導向 `/dev/stdout` 或者是 `/dev/stderr`？

### A:

In a Docker container, it is generally recommended to output logs to `/dev/stdout` or `/dev/stderr`. Here are some reasons why:

> 在 Docker 容器中，建議將日誌輸出到 `/dev/stdout` 或 `/dev/stderr`。以下是一些原因：

Standardization: By outputting logs to /dev/stdout and /dev/stderr, you are using the standard output and standard error streams. This makes it easier to integrate your container with other tools, as they are more likely to be able to consume logs from these standard streams.

> 標準化：通過將日誌輸出到 `/dev/stdout` 和 `/dev/stderr`，您使用標準輸出和標準錯誤流。
>
> 這使得更容易將您的容器與其他工具集成，因為它們更有可能使用這些標準流中的日誌。

Logging drivers: Docker has built-in logging drivers that can capture logs from standard streams and send them to various destinations, such as the host's syslog or a cloud-based logging service. By using standard streams, you can take advantage of these logging drivers without having to modify your application's code.

> 日誌驅動程序：Docker 具有內置的日誌驅動程序，可以捕獲從標準流輸出的日誌並將其發送到各種目的地，例如主機的 syslog 或基於雲的日誌服務。
>
> 通過使用標準流，您可以利用這些日誌驅動程序，而無需修改應用程序代碼。

Visibility: When logs are output to standard streams, they are visible in real-time to anyone who is monitoring the container's output. This can be useful for debugging or troubleshooting issues.

> 可見性：當日誌輸出到標準流時，它們即時可見，供任何監視容器輸出的人使用。這對除錯或解決問題非常有用。

Debugging: In a containerized environment, it can be difficult to debug issues that arise. By outputting logs to standard streams, you can easily see what your application is doing and quickly diagnose any problems that may arise.

> 除錯：在容器化環境中，很難針對問題除錯。
>
> 通過將日誌輸出到標準流，您可以輕鬆查看應用程序的運行情況，快速診斷可能出現的任何問題。

Overall, using /dev/stdout and /dev/stderr to output logs in Docker containers can help standardize your logging, make it easier to integrate with other tools, and improve visibility and debugging capabilities.

> 總之，在 Docker 容器中使用 `/dev/stdout` 和 `/dev/stderr` 來輸出日誌可以幫助標準化日誌，使其更容易與其他工具集成，以及提高可見性和除錯能力。

### Example

在 docker compose 中，我們可以設定 docker 的 log driver

以下方的 docker compose 當作範例，我們跑一個 nginx 服務，並將其 log 傳送到 fluent-bit

> nginx 的官方映像，預設即使用軟連結 (symbolic link) 把 log 連結到 `/dev/stdout` 和 `/dev/stderr`，所以下面設定 log driver 是可以接到 nginx 的 log 的

```yaml
version: '3'

services:
    nginx:
        logging:
            # 我們在這裡設定 nginx 的 log driver 為 fluentd
            driver: fluentd
            options:
                fluentd-address: localhost:24224
                tag: nginx
        image: nginx
        ports:
            - '8080:80'
        depends_on:
            - fluent-bit
        hostname: nginx

    # 使用 fluent-bit 去接 nginx 的 log
    fluent-bit:
        image: fluent/fluent-bit
        # 你可以自己寫一個 fluent-bit 的設定檔案，看要如何處理接收到的 log，你可以把 log 轉傳送到自己搭建，或是雲端的日誌分析平台進行分析
        volumes:
            - ./conf:/fluent-bit/etc
        ports:
            - '24224:24224'
            - '24224:24224/udp'
        hostname: fluent-bit
        logging:
            driver: 'json-file'
            options:
                max-size: 100m
                max-file: '5'
```

## 參考資料

- [透過 Multiple Stage Builds 編譯出最小的 Docker Image](https://jiepeng.me/2018/06/09/use-docker-multiple-stage-builds)
- [https://docs.docker.com/config/containers/logging/](https://docs.docker.com/config/containers/logging/)
- [Configure logging drivers](https://docs.docker.com/config/containers/logging/configure/)
