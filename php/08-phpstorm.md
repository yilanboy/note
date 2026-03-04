---
layout: default
parent: PHP
nav_order: 8
---

# PHPStorm

PHPStorm 為 Jetbrains 推出的 PHP IDE，是寫 PHP 的好幫手，這裡記錄一些我習慣在 PHPStorm 中調整的設定。

## 程式碼樣式

### 使用 Laravel Pint 的程式碼風格

在 Settings -> Editor -> Code Style -> PHP 中。

點選右上角的 Set from... 然後選擇 **Laravel**。

### 對齊陣列的值

在 Settings -> Editor -> Code Style -> PHP -> Wrappings and Braces 底下。

勾選 Array Initializer 底下的 **Align key-value pairs**。

## 快捷鍵（Shortcuts）

| Shortcut        | Description            |
| --------------- | ---------------------- |
| `Ctrl` + `G`    | 選取相同的字段         |
| `Ctrl` + `Ctrl` | Run anythings          |
| `Shift` + `F4`  | 開啟當前頁面的浮動視窗 |
| `Cmd` + `[`     | 跳回之前的位置         |
| `F3`            | 將該行加入書籤         |

## 系統設定

### 衝突的按鍵

PHPStorm 中的快捷鍵 `Cmd` + `Shift` + `A` 與 MacOS 的快捷鍵會產生衝突，建議在系統中將其關閉。

在 設定 -> 鍵盤 -> 鍵盤快速鍵 -> 服務 -> 文字 底下。

取消勾選「在終端機裡搜尋 man 頁面索引」。

## XDebug

> 本次範例為使用 Laravel Valet 建立的本地測試網站。

你可以在 PHPStorm 中設定 Break Point，並暫停程式執行，查看變數的值。

首先你需要先安裝 XDebug。可以透過 PIE（The PHP Installer for Extensions）進行安裝。

```bash
pie install xdebug/xdebug
```

設定 XDebug。

```ini
; 90-xdebug.ini

; PIE automatically added this to enable the xdebug/xdebug extension
; priority=90
zend_extension=xdebug

xdebug.mode=debug,develop,coverage
xdebug.start_with_request=trigger ; trigger 為根據請求中的 XDEBUG_SESSION cookie 來決定是否觸發
xdebug.client_host=127.0.0.1
xdebug.client_port=9003
```

設定 PHPStorm 的 XDebug。

在 Settings -> PHP -> Debug 底下，將 Debug port 設定為 9003。並**取消勾選**下列選項（避免每次執行都在程式的第一行就被中斷，例如 Laravel 的 `public/index.php`，我們只希望在有設定 Break Point 的地方停止）：

- Break at first line in PHP scripts
- Force break at first line when no path mappings specified
- Force break at first line when a script is outside the project

**在這裡有一個常見的誤區：XDebug 並不是 Server**。在 Debug 連線中，**PHPStorm 才是扮演監聽連線的 Server**（這也是為什麼啟動除錯叫做 *Start Listening*），而 **XDebug 扮演的是連向 IDE 的 Client**。

在 Settings -> PHP -> Servers 中設定 Server，這個 Server 指的是你的**網頁伺服器（Web Server）**。這主要是**要告訴 PHPStorm，當 XDebug 從某個網域連線過來時，請把它對應到目前這個專案的程式碼**，這樣 IDE 才知道要去哪裡尋找對應的原始碼並觸發中斷點。

- **Name**: 任意名稱（通常會設定為專案名稱或網域名稱）
- **Host**: 本地測試網站網域（必須與你在瀏覽器輸入的網址完全一致，例如 `my-project.test`）
- **Port**: 80 或 443
- **Debugger**: Xdebug

**取消勾選** `Use path mappings (select if the server is remote or symlinks are used)`。

### 開始 Debug

你可以安裝瀏覽器外掛來觸發 XDebug，例如：

- Chrome: [Xdebug Helper by JetBrains](https://chromewebstore.google.com/detail/xdebug-helper-by-jetbrain/aoelhdemabeimdhedkidlnbkfhnhgnhm)
- Firefox: [Xdebug Helper by JetBrains](https://addons.mozilla.org/en-US/firefox/addon/xdebug-helper-by-jetbrains/)

1. 在瀏覽器外掛中啟用 `Debug`。
2. 在 PHPStorm 中，點選右上角的 `Start Listening for PHP Debug Connections`。
3. 重新整理頁面，即可開始 Debug。

## 參考資料

- [Formatting code: getting aligned array setups](https://www.reddit.com/r/phpstorm/comments/17apa05/formatting_code_getting_aligned_array_setups/)
- [Cmd+Shift+A hotkey opens Terminal with "apropos" search instead of the Find Action dialog](https://intellij-support.jetbrains.com/hc/en-us/articles/360005137400-Cmd-Shift-A-hotkey-opens-Terminal-with-apropos-search-instead-of-the-Find-Action-dialog)
