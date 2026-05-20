---
layout: default
parent: PHP
nav_order: 11
---

# 使用 PHP 內建的 Local Server

PHP 從 5.4 開始就內建了一個輕量的 Web Server，
讓我們在開發階段不需要安裝 Apache 或 Nginx，就可以快速地把 PHP 程式跑起來。

> 官方文件特別提醒：這個 Server 是設計給「開發用途」的，**不要拿來當作 Production 環境使用**。

## 啟動 Server

最簡單的啟動方式如下：

```bash
# 在當前資料夾啟動一個監聽 localhost:8000 的 server
php -S localhost:8000
```

啟動後，PHP 會把當前資料夾當作 document root，
連到 `http://localhost:8000/foo.php` 就會執行當前資料夾底下的 `foo.php`。

如果你想要指定 document root，可以使用 `-t` 參數：

```bash
# 將 public 資料夾作為 document root
php -S localhost:8000 -t public
```

也可以指定一個 router script，所有的請求都會先經過這個 script，
這在開發 SPA 或是想要模擬 framework 的 routing 行為時很方便。

```bash
# 所有請求都會先進到 router.php
php -S localhost:8000 router.php
```

在 `router.php` 中，可以透過回傳 `false` 來讓 server 直接回應靜態檔案：

```php
<?php
// 如果請求的是實體存在的檔案，直接回傳 false 讓 server 處理
if (preg_match('/\.(?:png|jpg|jpeg|gif|css|js)$/', $_SERVER['REQUEST_URI'])) {
    return false;
}

// 其他請求都交給 index.php 處理
require __DIR__ . '/index.php';
```

## 在 Local Server 中打印訊息

剛開始使用內建 Server 時，可能會困惑：
為什麼 `echo` 或 `var_dump` 的內容沒有印到終端機？

那是因為 `echo`、`print`、`var_dump`、`print_r`
這些函式預設都是把內容寫入 **HTTP Response**，
所以你看到的不是終端機，而是瀏覽器頁面上。

如果想把訊息印到啟動 server 的終端機上，有幾種常見的方法：

### 1. 使用 `error_log()`

`error_log()` 預設會將訊息寫入 PHP 的 error log，
而內建 Server 會把 error log 直接導向 `stderr`，因此會顯示在終端機。

```php
<?php
error_log('hello from local server');

$user = ['name' => 'allen', 'age' => 30];
error_log(print_r($user, true)); // 使用 print_r 的第二個參數讓它回傳字串
```

啟動 server 後，發送請求就會在終端機看到：

```text
[Tue May 20 10:00:00 2026] PHP message: hello from local server
[Tue May 20 10:00:00 2026] PHP message: Array
(
    [name] => allen
    [age] => 30
)
```

### 2. 直接寫入 `php://stderr`

如果不想要 PHP 幫你加上時間戳記與 `PHP message:` 前綴，
可以直接打開 `php://stderr` 這個 stream，將內容寫進去。

```php
<?php
$stderr = fopen('php://stderr', 'w');
fwrite($stderr, "raw message without prefix\n");
fclose($stderr);
```

> 注意：在 CLI 模式下你可以直接用 `fwrite(STDERR, ...)`，
> 但在 built-in server 中 `STDERR` 常數**並不存在**，會丟出 `Undefined constant "STDERR"`。
> 詳細的差異請看下面的章節。

### 3. 將 `var_dump` 的結果送到 `error_log()`

`var_dump` 沒有像 `print_r` 一樣可以回傳字串的選項，
但我們可以利用 output buffering 把它的結果抓出來再丟給 `error_log()`。

```php
<?php
ob_start();
var_dump($user);
error_log(ob_get_clean());
```

> 開發時如果想要更方便的 debug 工具，也可以考慮安裝 Xdebug，
> 搭配 IDE 來進行斷點除錯，會比一直印訊息來得更有效率。

## `STDIN`、`STDOUT`、`STDERR` 是什麼？

這三個是 PHP 在 **CLI SAPI** 啟動時自動定義的常數，
本質上是「已經幫你 `fopen` 好的 file resource」，分別對應：

| 常數     | 等價於                       | 用途                   |
| -------- | ---------------------------- | ---------------------- |
| `STDIN`  | `fopen('php://stdin', 'r')`  | 讀取終端機輸入         |
| `STDOUT` | `fopen('php://stdout', 'w')` | 寫到終端機標準輸出     |
| `STDERR` | `fopen('php://stderr', 'w')` | 寫到終端機標準錯誤輸出 |

```php
<?php
// CLI 模式下可以直接拿來用，不需要 fopen
fwrite(STDOUT, "to stdout\n");
fwrite(STDERR, "to stderr\n");

$line = fgets(STDIN); // 讀取一行使用者輸入
```

可以透過 `php_sapi_name()` 確認自己現在跑在哪個 SAPI 下。

```php
echo php_sapi_name(); // CLI 為 "cli"，內建 server 為 "cli-server"
```

## `php://stdin`、`php://stdout`、`php://stderr` 是什麼？

這三個是 PHP 內建的 **stream wrapper**，
也就是一種特殊格式的 URI，可以丟給 `fopen()`、`file_put_contents()`、
`file_get_contents()` 等任何吃 filename 的函式使用。

```php
<?php
// 用 file_put_contents 直接寫入，不用自己處理 fopen / fclose
file_put_contents('php://stderr', "log line\n");

// 也可以自己 fopen 來重複寫入
$stdout = fopen('php://stdout', 'w');
fwrite($stdout, "first line\n");
fwrite($stdout, "second line\n");
fclose($stdout);
```

跟 `STDIN`/`STDOUT`/`STDERR` 常數的差別：

- **常數**：CLI SAPI 啟動時就自動 `fopen` 好的 resource，**只在 CLI 模式下存在**。
- **stream wrapper**：每次用都要自己 `fopen`，但**在所有 SAPI 下都可以用**。

## 在 Built-in Server 中的差異

`php -S` 啟動的內建 server 用的是 **cli-server SAPI**，行為跟 CLI 模式不太一樣：

| 行為                           | CLI               | Built-in Server (cli-server)                             |
| ------------------------------ | ----------------- | -------------------------------------------------------- |
| `STDIN`/`STDOUT`/`STDERR` 常數 | 已定義            | **未定義**，直接使用會噴錯                               |
| `echo`、`print`、`var_dump`    | 寫到終端機 stdout | 寫到 **HTTP Response**                                   |
| `php://stdout`                 | 寫到終端機 stdout | 寫到 server 行程的 stdout                                |
| `php://stderr`                 | 寫到終端機 stderr | 寫到 server 行程的 stderr（與 access log 同一個 stream） |
| `error_log()`（預設）          | 寫到 stderr       | 寫到 stderr                                              |

也就是說，在 built-in server 中如果你想印訊息到啟動 server 的終端機，
**不能用 `STDERR` 常數**，要用 `fopen('php://stderr', 'w')` 或 `error_log()`：

```php
<?php
// ❌ 在 built-in server 中會丟出 "Undefined constant STDERR"
fwrite(STDERR, "oops\n");

// ✅ 用 stream wrapper，CLI 與 built-in server 都能用
file_put_contents('php://stderr', "ok\n");

// ✅ error_log 預設就是寫到 stderr
error_log('ok');
```

如果想寫一份在 CLI 與 built-in server 都能跑的 debug 函式，
可以先判斷常數是否存在，或乾脆統一使用 `php://stderr`：

```php
<?php
function debug(string $msg): void
{
    file_put_contents('php://stderr', $msg . "\n");
}
```

## 參考資料

- [PHP Built-in web server](https://www.php.net/manual/en/features.commandline.webserver.php)
- [Constants - STDIN / STDOUT / STDERR](https://www.php.net/manual/en/features.commandline.io-streams.php)
- [Supported Protocols and Wrappers - php://](https://www.php.net/manual/en/wrappers.php.php)
- [error_log](https://www.php.net/manual/en/function.error-log.php)
