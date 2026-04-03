---
layout: default
parent: GitHub
nav_order: 5
---

# GitHub CLI (gh) 使用筆記

本筆記整理了 GitHub CLI (`gh`) 的常用指令。

## 1. 如何登入

使用以下指令登入 GitHub 帳號，你可以選擇使用瀏覽器授權或是貼上 Personal Access Token (PAT) 進行登入：

```bash
gh auth login
```

執行後，系統會透過互動式選單引導你完成登入流程：

1. 選擇要登入的平台：`GitHub.com` 或 `GitHub Enterprise Server`
2. 選擇偏好的 Git 協定：`HTTPS` 或 `SSH`
3. 選擇登入方式：`Login with a web browser`（使用瀏覽器）或 `Paste an authentication token`（貼上 Token）

```text
➜ gh auth login
? Where do you use GitHub? GitHub.com
? What is your preferred protocol for Git operations on this host? SSH
? Upload your SSH public key to your GitHub account? /Users/allen/.ssh/id_ed25519.pub
? Title for your SSH key: Default
? How would you like to authenticate GitHub CLI? Login with a web browser

! First copy your one-time code: 0383-BDA7
Press Enter to open https://github.com/login/device in your browser...
```

**查看目前登入狀態：**

```bash
gh auth status
```

## 2. 列出專案 (Repositories)

列出目前登入帳號擁有的專案：

```bash
gh repo list
```

**進階用法：**

* 列出特定使用者的專案：`gh repo list <username>`
* 限制列出數量 (例如 50 個)：`gh repo list --limit 50`
* 只列出公開專案：`gh repo list --visibility public`
* 只列出私有專案：`gh repo list --visibility private`

## 3. 查看某專案的 PR、Issue

以下指令預設會針對「當前目錄的 Git 專案」執行。如果想操作其他專案，可以加上 `-R <owner>/<repo>` 參數（例如：`-R facebook/react`）。

### 查看 Pull Requests (PR)

列出專案中目前的 PR：

```bash
gh pr list
```

**進階用法：**

* 查看特定 PR 的詳細內容：`gh pr view <pr-number>`
* 直接在網頁瀏覽器中開啟該 PR：`gh pr view <pr-number> --web`
* 列出特定狀態的 PR (例如 merged)：`gh pr list --state merged`

### 查看 Issues

列出專案中目前的 Issues：

```bash
gh issue list
```

**進階用法：**

* 查看特定 Issue 的詳細內容：`gh issue view <issue-number>`
* 直接在網頁瀏覽器中開啟該 Issue：`gh issue view <issue-number> --web`

## 4. 觸發某專案的 Action Workflow

與前面相同，如果不在專案目錄下，請補上 `-R <owner>/<repo>`。

首先，列出專案的所有 Workflows，以便確認你想觸發的 Workflow 名稱或 ID：

```bash
gh workflow list
```

接著，觸發 (Run) 指定的 Workflow：

```bash
# 可以使用 workflow 的名稱 (name) 或是其對應的 yml 檔案名稱
gh workflow run <workflow-name-or-file>

# 例如
gh workflow run 'Deploy my CMS to AWS Lambda'
```

執行後會看到以下輸出：

```text
➜ gh workflow run 'Deploy my CMS to AWS Lambda'
✓ Created workflow_dispatch event for deploy-cms.yaml at main
https://github.com/yilanboy/laravel-serverless/actions/runs/35999777555

To see the created workflow run, try: gh run view 35999777555
To see runs for this workflow, try: gh run list --workflow="deploy-cms.yaml"
```

**進階用法：**

* 若 Workflow 需要帶入參數 (inputs) 執行，可使用 `-f` 參數：

  ```bash
  gh workflow run <workflow-name> -f <key1>=<value1> -f <key2>=<value2>
  ```

* 觸發後想即時觀看執行的進度與狀態：

  ```bash
  gh run watch
  ```

* 列出專案近期執行的 Actions 紀錄 (Runs)：

  ```bash
  gh run list
  ```
