# Pest 5: The Agent Plugin

Pest 5 的 Agent Plugin 提供了一種讓 AI 編碼代理 (AI coding agents) 直接從命令列運行一次性的測試程式碼片段來驗證其變更的方法。這為 AI 提供了一個明確的「通過」或「失敗」的結果，形成了一個完整的反饋循環。

## 用途

Agent Plugin 的核心用途是讓 AI 能夠用一個單獨的指令來確認其程式碼變更是否如預期般工作。它能直接與現有的 Pest 測試套件整合，從而可以存取整個應用程式的上下文，包括資料庫、工廠、模擬的郵件/通知和身份驗證輔助函數。

相較於其他只能在瀏覽器中運作的自動化工具，Agent 的主要優勢在於其能夠進行**全端驗證 (full-stack verification)**。

這代表 AI 代理可以在同一個指令中，既模擬瀏覽器中的使用者互動，又能斷言後端是否發生了預期的副作用（例如：資料庫記錄是否成功建立、郵件是否已寄出）。

## 原理

這個 Plugin 為 Pest CLI 引入了一個 `--agent` 旗標。提供給這個旗標的程式碼會被包裝在一個臨時的測試檔案中，並使用專案的完整測試設定來執行。執行完畢後，這個臨時檔案會被自動刪除。

## 使用方法

### 安裝

1.  **安裝 Agent Plugin:**

    ```bash
    composer require pestphp/pest-plugin-agent --dev
    ```

2.  **安裝 Browser Testing Plugin (強烈建議):**
    為了能驗證前端互動，你需要安裝瀏覽器測試外掛。
    ```bash
    composer require pestphp/pest-plugin-browser --dev
    npm install playwright@latest
    npx playwright install
    ```

### 執行驗證

你可以直接在命令列中傳遞要執行的測試程式碼。

**範例：後端行為驗證**
這個例子會建立一個使用者，以該使用者身份登入，然後請求 `/dashboard` 頁面，並斷言回應是否為 OK (200)。

```bash
./vendor/bin/pest --agent='$user = \App\Models\User::factory()->create(); $this->actingAs($user)->get("/dashboard")->assertOk();'
```

**範例：前端結合後端驗證**
這個例子會使用瀏覽器訪問聯絡表單頁面，填寫表單並提交，然後斷言一封郵件已經被發送。

```bash
./vendor/bin/pest --agent-visit='/contact' \
--agent='$this->browser()->type("name", "Nuno")->press("Submit")' \
--agent='\Pest\Laravel\Mail::assertSent(App\Mail\ContactFormSubmitted::class);'
```

## 適用時機

Agent Plugin 主要作為一個**驗證探測器 (verification probe)**，而不是用來取代你完整的測試套件。它最適合在以下情境中使用：

- AI 代理需要對它剛剛做出的變更獲得即時反饋。
- 需要快速截圖以視覺化地審查 UI 變更。
- 需要進行一次性的行為檢查，而這個檢查不值得為其建立一個永久的測試檔案。

對於需要長期維護的迴歸測試，還是應該在 `tests/Feature` 或 `tests/Browser` 目錄下建立標準的測試檔案。
