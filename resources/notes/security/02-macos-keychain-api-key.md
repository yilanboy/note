# 使用 macOS Keychain 透過命令列管理 API Key 與 Token

使用 macOS 內建的 `security` 命令列工具，將 API Key 或 Token 安全地儲存在系統鑰匙圈（Keychain）。這能避免把敏感憑證直接寫進 `.zshrc`、程式碼或版本控制系統。

## 基本操作指令

### 新增 API Key 到鑰匙圈

```bash
security add-generic-password \
  -a "$USER" \
  -s API_KEY \
  -w "YOUR_TOKEN_HERE"
```

- `-a`：帳號名稱（Account），這裡使用目前使用者的 `$USER`。
- `-s`：服務識別名稱（Service），例如 `API_KEY` 或 `OPENAI_API_KEY`。
- `-w`：實際儲存的密碼或 Token。

> 不要將真實 Token 寫進 shell 歷史紀錄。若不希望它出現在歷史紀錄中，請省略 `-w` 的值，讓 `security` 以互動方式提示輸入密碼。

```bash
security add-generic-password -a "$USER" -s API_KEY -w
```

### 讀取金鑰

查看項目的中繼資料，不輸出金鑰內容：

```bash
security find-generic-password -a "$USER" -s API_KEY
```

只輸出金鑰純文字，適合交給腳本或環境變數使用：

```bash
security find-generic-password -a "$USER" -s API_KEY -w
```

### 更新已存在的 Key

加上 `-U`（Update）參數後，已有項目會覆蓋，沒有則新增：

```bash
security add-generic-password \
  -a "$USER" \
  -s API_KEY \
  -w "YOUR_NEW_TOKEN" \
  -U
```

同樣可省略 `-w` 的值，改為互動輸入新的 Token：

```bash
security add-generic-password -a "$USER" -s API_KEY -w -U
```

### 刪除 Key

刪除指定的鑰匙圈項目：

```bash
security delete-generic-password -a "$USER" -s API_KEY
```

## 與 Shell 環境變數整合

以下以 Zsh 為例。編輯 `~/.zshrc`：

```bash
nano ~/.zshrc
```

在檔案末端加入以下設定，登入 shell 時會動態從 Keychain 讀取 Token：

```bash
export API_KEY="$(security find-generic-password -a "$USER" -s API_KEY -w 2>/dev/null)"
```

`2>/dev/null` 會避免 Key 尚未建立時，於終端機顯示錯誤訊息。

載入新設定：

```bash
source ~/.zshrc
```

驗證環境變數是否已設定，避免直接印出 Token：

```bash
test -n "$API_KEY" && echo "API_KEY is set" || echo "API_KEY is not set"
```

## 安全優勢

1. **降低洩漏風險**：即使 `.zshrc` 被檢視或提交，檔案中也不包含真實 Token。
2. **受系統保護**：Token 由 macOS Keychain 的加密與存取控制機制保護。
3. **便於自動化**：腳本可透過 `security find-generic-password ... -w` 取得 Token，不必把憑證存放在專案中。

## 注意事項

- 讀取 Token 後放入環境變數，該 Token 仍可能被同一使用者啟動的子程序讀取；只在確有需要的 shell 或程序中設定它。
- 不要使用 `echo $API_KEY` 驗證設定，避免 Token 留在終端機捲動紀錄、截圖或錄影中。
- 不同服務應使用不同的 Service 名稱，例如 `OPENAI_API_KEY`、`GITHUB_TOKEN`，避免覆蓋彼此的項目。
