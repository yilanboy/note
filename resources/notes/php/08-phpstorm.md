# PHPStorm

PHPStorm 為 Jetbrains 推出的 PHP IDE，是寫 PHP 的好幫手，這裡記錄一些我習慣在 PHPStorm 中調整的設定。

## 初始設置

### 程式碼樣式

#### 使用 Laravel Pint 的程式碼風格

在 Settings -> Editor -> Code Style -> PHP 中。

點選右上角的 Set from... 然後選擇 **Laravel**。

#### 對齊陣列的值

在 Settings -> Editor -> Code Style -> PHP -> Wrappings and Braces 底下。

勾選 Array Initializer 底下的 **Align key-value pairs**。

### 將 `.idea` 加入版本控制

PhpStorm 預設會產生 `.idea` 資料夾，底下會放置這個 IDE 的設定檔案。

官方建議將這些設定檔案加入版本控制，方便後續開發者協作。不過我覺得這個資料夾很礙眼，最後還是沒有加入版本控制。

詳細說明請參考 [官方文件](https://intellij-support.jetbrains.com/hc/en-us/articles/206544839)。

### 切換至其他 App 時自動儲存檔案

Settings → Appearance & Behavior → System Settings

在 Autosave 底下勾選：

✅ Save files when switching to a different application or a built-in terminal

### 儲存時清除不必要的行末空白

Settings → Editor → General

在 On Save 底下設定：

✅ Remove trailing spaces on All lines

❌ Keep trailing spaces on caret line

### 儲存時保留檔案尾部一個換行

Settings → Editor → General

在 On Save 底下勾選：

✅ Remove trailing blank lines at the end of saved files

✅ Ensure every saved file ends with a line break

### 儲存時自動排版

> 此功能在私人專案使用還不錯，公司專案則不建議使用；需要時可以使用 `Shift` + `Ctrl` + `Cmd` + `Space`。

Settings → Tools → Actions on Save

✅ Reformat code

### 註解在程式碼前保留一個空白

Settings → Editor → Code Style → PHP

在 Code Generation 底下的 Comment Code 設定：

❌ Line comment at first column

✅ Add a space at comment start

### 左側檔案列表自動選取目前開啟的檔案

點選檔案列表上方的三個點，並選取 **Always Select Opened File**。

### 為特定檔案開啟 Word Wrap

使用 Tailwind CSS 時可以考慮開啟這項功能。

Settings → Editor → General → Soft Wraps

可以在 Soft-wrap these file 中設定想要啟用 Word Wrap 的檔案。

另外可以取消勾選下方的選項，讓 Word Wrap 的符號出現在行首與行尾：

❌ Only show soft-wrap indicators for the current line

### 使用 Prettier 排版

須先安裝 Prettier：

```bash
npm install --save-dev --save-exact prettier
```

在 PhpStorm 安裝 Prettier 套件，可以參考[官方指南](https://www.jetbrains.com/help/phpstorm/prettier.html)。

接著在 Settings → Tools → Actions on Save 中勾選：

✅ Run Prettier

### 載入 PSR-12 Code Style

PhpStorm 預設使用自己的排版風格，可以到：

Editor → Code Style → PHP

在上方的 **Set from ...** 中選擇 **PSR-12**。不過套用後的風格仍有些微差異，例如 Arrow function：PhpStorm 預設不會在 Arrow function 的括號後方加上空格。

```php
fn() => 0
```

可以再到 Spaces → Before parentheses 中勾選：

✅ Arrow function parentheses

如此即可排版為：

```php
fn () => 0
```

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

**在這裡有一個常見的誤區：XDebug 並不是 Server**。在 Debug 連線中，**PHPStorm 才是扮演監聽連線的 Server**（這也是為什麼啟動除錯叫做 _Start Listening_），而 **XDebug 扮演的是連向 IDE 的 Client**。

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

## 快速移除自訂佈景主題（Custom Themes）

安裝像 **Material Theme UI** 這類外掛後，它會在設定目錄中產生大量的「使用者編輯器配色（editor color schemes）」。即使之後移除了外掛，這些配色仍會殘留在 Settings -> Editor -> Color Scheme 的下拉選單中（例如 `Material Darker`、`Monokai Pro`、`Dracula (Material)` 等）。

透過 GUI 一個個刪除非常麻煩，直接從設定目錄刪除檔案是最快的方式。

### 設定檔位置（macOS）

每個 PHPStorm 版本都有獨立的設定目錄：

```
~/Library/Application Support/JetBrains/PhpStorm<版本>/
├── colors/    # 編輯器配色，每個 .icls 檔就是一個 scheme（檔名以 _@user_ 開頭）
├── themes/    # 介面佈景主題，每個 .theme.json 檔就是一個 UI theme
└── options/   # 外掛殘留設定，例如 material_theme.xml
```

> 重點：`colors/` 底下的 `.icls` 全部都是「使用者層級」的自訂配色，IDE 內建配色放在程式本體中、不會出現在這裡。所以刪除這裡的檔案只會移除自訂內容，**內建配色（Darcula、Light 等）依然存在，只是會還原成預設值**。

### 刪除步驟

**務必先完全關閉 PHPStorm**，否則刪除後 IDE 會在結束時把記憶體中的配色重新寫回。

```bash
# 1. 先列出來確認要刪什麼（* 會展開成所有已安裝的版本）
ls ~/Library/Application\ Support/JetBrains/PhpStorm*/colors/*.icls

# 2-a. 只刪特定外掛的配色，例如 Material Theme
find ~/Library/Application\ Support/JetBrains/PhpStorm*/colors -type f \
  \( -name "*_Material_*.icls" -o -name "_@user_Material *.icls" \) -delete -print

# 2-b. 或一次清掉「所有版本」的全部自訂配色（最乾淨）
find ~/Library/Application\ Support/JetBrains/PhpStorm*/colors -type f -name "*.icls" -delete -print

# 3. 順手清掉外掛殘留的設定檔
find ~/Library/Application\ Support/JetBrains/PhpStorm*/options -type f \
  -iname "material_theme*.xml" -delete -print
```

### 注意事項

- **外掛若還沒移除，配色會被重新產生**。若某個版本仍安裝著 Material Theme UI，需先在 Settings -> Plugins 中移除外掛（或直接刪掉 `plugins/Material Theme UI` 資料夾），再清配色才不會復活。
- **介面佈景主題（UI theme）** 與編輯器配色不同，它是由外掛直接提供的，移除外掛後就會自動從 Appearance 的下拉選單消失，通常不需要手動處理。
- 刪除後若原本套用的是被刪掉的配色，PHPStorm 下次啟動會自動退回預設（Darcula／Light），重新挑一個內建配色即可。

## 參考資料

- [Formatting code: getting aligned array setups](https://www.reddit.com/r/phpstorm/comments/17apa05/formatting_code_getting_aligned_array_setups/)
- [Cmd+Shift+A hotkey opens Terminal with "apropos" search instead of the Find Action dialog](https://intellij-support.jetbrains.com/hc/en-us/articles/360005137400-Cmd-Shift-A-hotkey-opens-Terminal-with-apropos-search-instead-of-the-Find-Action-dialog)
