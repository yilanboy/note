# Helm

Helm 是一個 Kubernetes 的套件管理工具，可以用來部署應用程式到 Kubernetes 叢集中。

> Helm 之於 Kubernetes，就像是 apt 或是 yum 之於 Linux。

一個 Helm 套件由三個部分組成：

- Chart : Helm 套件的主要，裡面包含了要部署的應用程式的描述檔。
- Repository : 用來存放 Chart 的地方，可以是本地端的檔案系統，也可以是遠端的 HTTP 伺服器。
- Release : 一個 Chart 的部署實例，一個 Chart 可以部署多個 Release。

## 常用指令

搜尋 Chart：

```shell
# 從 Artifact Hub 搜尋 有沒有 WordPress 的 Chart
helm search hub wordpress

# 從本地添加的 Repository 中搜尋有沒有 WordPress 的 Chart
helm search repo wordpress
```

加入一個 Repository：

```shell
# 添加一個名稱為 sealed-secrets 的 Repository
# Repository 的 URL 為 https://charts.helm.sh/stable
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
```

安裝 Chart：

```shell
# 安裝 wordpress 的 Chart，並將 release 名稱設定為 happy-panda
helm install happy-panda bitnami/wordpress
```

查看 Release 的狀態：

```shell
helm status happy-panda
```

Chart 通常會有預設的設定，這些設定是可以修改的，可以使用 `helm show values` 查看 Chart 的預設設定。

```shell
helm show values bitnami/wordpress
```

如果想要修改 Chart 的設定，可以建立一個 `values.yaml`，並寫上想要修改的設定。

```yaml
# values.yaml
mariadb:
    auth:
        database: user0db
        username: user0
```

使用 `helm install` 的 `-f` 參數載入檔案，覆蓋 Chart 的預設設定。

```shell
# 使用 --generate-name 參數，讓 helm 自動產生 release 名稱
helm install -f values.yaml bitnami/wordpress --generate-name
```

也可以直接使用 `--set` 參數修改設定。

```shell
helm install bitnami/wordpress --generate-name \
--set mariadb.auth.database=user0db,mariadb.auth.username=user0
```

## 建立自己的 Chart

可以使用 `helm create` 來建立一個新的 Chart。

```shell
helm create mychart
```

`mychart` 資料夾的結構如下：

```text
mychart
├── Chart.yaml <- Chart 的描述檔，包含了 Chart 的名稱、版本、描述等資訊
├── charts <- 用來存放其他 Chart 的資料夾，剛建立是空的
├── templates <- 用來存放 Kubernetes 資源描述檔的資料夾
│   ├── NOTES.txt
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── hpa.yaml
│   ├── ingress.yaml
│   ├── service.yaml
│   ├── serviceaccount.yaml
│   └── tests
│       └── test-connection.yaml
└── values.yaml
```

你可以在 `templates` 中，放置你的 K8s 資源描述檔案。

Helm Template 提供一些**特殊語法與控制流**，讓你在寫資源描述檔時更得心應手。

## 內建物件 (Built-in Object)

Helm 提供了一些內建物件，你可以在 template 中使用這些物件。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  # Helm 中提供一種叫做 Release 的內置物件
  # 使用 {{ .Release.Name }} 可以取得 Chart 的發佈版本
  name: {{ .Release.Name }}-configmap
data:
  myvalue: "Hello World"
```

更多內建物件可以參考[文件](https://helm.sh/zh/docs/chart_template_guide/builtin_objects/)。

## Pipeline

你可以在 template 中使用 Pipeline，來處理一些複雜的邏輯。例如將一個字串轉換成小寫。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-configmap
data:
  # 將 myvalue 轉換成小寫
  # 這裡的 .Values.global.myvalue 是從 values.yaml 中取得的
  myvalue: {{ .Values.global.myvalue | lower }}
```

Pipeline 可以串接多個函式，例如將一個字串轉換成小寫，再將第一個字母轉換成大寫。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-configmap
data:
  # 將 myvalue 轉換成小寫，再將第一個字母轉換成大寫
  myvalue: {{ .Values.global.myvalue | lower | title }}
```

## 控制流

Helm Template 提供了一些控制流，讓你可以在 template 中使用 `if`、`else`、`range` 等語法。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-configmap
data:
  # 如果 .Values.global.myvalue 為空，則使用預設值
  myvalue: {{ if .Values.global.myvalue }} {{ .Values.global.myvalue }} {{ else }} default value {{ end }}
```

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-configmap
data:
  # 如果 .Values.global.say 為 hello，則多一個 res: world 的欄位
  myvalue: foobar
  {{ if eq .Values.global.say "hello" }} res: world {{ end }}
```

還有類似於 `for` 的 `range` 語法，可以用來迭代一個 list。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-configmap
data:
# 迭代 .Values.global.list，並將每個元素轉換成小寫
{{- range .Values.global.list }}
  - {{ . | lower }}
{{- end }}
```

### 將自己的 Charts 上傳到 GitHub Pages 供別人使用

建立好你的 Chart 之後，就可以將它上傳到 GitHub Pages 供別人使用。

首先，你需要在 GitHub 上建立一個 Repository，資料夾結構如下：

```text
mychart-repo
├── .github
│   └── workflows
│       └── release.yaml <- 用來自動發佈 Chart 的 GitHub Action
├── README.md
└── charts
    └── mychart <- 將你的 Chart 放在這裡
```

`release.yaml` 的內容如下：

```yaml
name: Release Charts

on:
    push:
        branches:
            - main

jobs:
    release:
        permissions:
            contents: write
        runs-on: ubuntu-latest
        steps:
            - name: Checkout
              uses: actions/checkout@v3
              with:
                  fetch-depth: 0

            - name: Configure Git
              run: |
                  git config user.name "$GITHUB_ACTOR"
                  git config user.email "$GITHUB_ACTOR@users.noreply.github.com"

            - name: Run chart-releaser
              uses: helm/chart-releaser-action@v1.6.0
              env:
                  CR_TOKEN: '${{ secrets.GITHUB_TOKEN }}'
```

接著，你需要在 GitHub 上建立一個分支 `gh-pages`。

接下來，當你將 Chart 推到 `main` 分支時，GitHub Action 會自動將 Chart 發佈到 `gh-pages` 分支。

## 參考資料

- [Helm 官方文件](https://helm.sh/zh/docs/)
- [Helm Example Repository](https://github.com/helm/examples)
