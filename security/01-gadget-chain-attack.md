---
layout: default
parent: Security
nav_order: 1
---

# 在升級 Laravel 13 時認識的「小工具鏈攻擊」

前陣子 Laravel 13 正式發布！所以我也開始來升級自己部落格的 Laravel 版本了。沒想到在進入 AI 時代後，連升級框架都能請 AI 代勞。Laravel 官方推出的 Laravel Boost 套件提供了升級 Laravel 13 的 Skill 文件，只要將你的 Laravel Boost 套件升級到 2.0，並設定好 Skill 文件：

```bash
composer require laravel/boost --dev

php artisan boost:install
```

之後就可以打開 AI Agent 輸入 `/laravel-boost:upgrade-laravel-v13` 指令，請 AI 開始幫你升級框架。AI 會開始修改 `composer.json` 中的版本號碼並執行更新，還會跑測試看看升級後有沒有問題，十分方便。

[![Upgrading to Laravel 13 is a skill away](https://img.youtube.com/vi/yRrfS-W4iyM/maxresdefault.jpg)](https://www.youtube.com/watch?v=yRrfS-W4iyM)

結果沒想到升級結束後，一打開網頁就是大大的 500 伺服器錯誤。

![500 error](https://blobs.docfunc.com/images/2026_04_17_14_10_35_4cec5b4897a9.png)

看樣子目前的 AI 暫時還無法取代人類工程師，雖然出現錯誤，但我心裡卻有一種幸好這個世界還需要我的雀躍 🤣。

仔細查閱錯誤訊息與升級文件後，發現問題出在 Laravel 13 的快取系統新增了一項 `serializable_classes` 設定。該設定的預設值為 `false`，意味著快取預設不再允許儲存任何 PHP 物件。這項改動的主要目的，是為了防範因反序列化（Unserialize）物件所引發的「小工具鏈攻擊」（Gadget Chain Attack）。

```php
// config/cache.php

[
    /*
    |--------------------------------------------------------------------------
    | Serializable Classes
    |--------------------------------------------------------------------------
    |
    | This option controls which classes may be unserialized from the cache.
    | Setting this to false prevents PHP object unserialization entirely,
    | which hardens your application against deserialization attacks.
    |
    | If your application stores PHP objects in cache, list the allowed
    | classes here. Use `true` to allow all classes (not recommended).
    |
    */

    'serializable_classes' => false,
]
```

所以我原本快取熱門標籤與推薦連結的方式就會導致錯誤，因為快取的對象是 Eloquent Collection。

```php
$popularTags = Cache::remember('popularTags', now()->addDay(), function () {
    // 取出標籤使用次數前 20 名
    return Tag::withCount('posts')
        ->orderByDesc('posts_count')
        ->limit(20)
        ->get();
});

$links = Cache::remember('links', now()->addDay(), function () {
    return Link::all();
});
```

解決方法也很簡單，在 `serializable_classes` 放行可以序列化的類別即可：

```php
// config/cache.php

[
    'serializable_classes' => [
        Tag::class,
        Link::class,
    ],
]
```

或是改為快取陣列，不要序列化 Eloquent 物件：

```php
$popularTags = Cache::remember('popularTags', now()->addDay(), function () {
    return Tag::withCount('posts')
        ->orderByDesc('posts_count')
        ->limit(20)
        ->get()
        ->toArray();
});

$links = Cache::remember('links', now()->addDay(), function () {
    return Link::all()
        ->toArray();
});
```

因為我在測試中使用的快取為儲存在記憶體中的 `array`，而 `array` 預設是不會對物件進行序列化的，所以 CI 測試並沒有幫我抓到物件不能序列化的錯誤。

```php
'stores' => [

    'array' => [
        'driver' => 'array',
        'serialize' => false,
    ],

    // ...
],
```

> 這也是為什麼我們常說 CI 環境要與正式環境相同，因為有些錯誤在不同的環境下不會出現。

雖然這個問題不難處理，但身為工程師就是要打破沙鍋問到底，我剛好可以藉著這次機會來認識什麼是小工具鏈攻擊。

## 什麼是小工具鏈攻擊？

在網路安全領域中，小工具鏈攻擊（又被稱為 POP Chain，Property Oriented Programming）是一種進階的攻擊技術。簡單來說，它利用了 PHP 的序列化（serialize）與反序列化（unserialize）機制，在惡意字串被反序列化的過程中，巧妙的觸發一系列物件的魔術方法（Magic Methods），進而串連執行任意程式碼。

### 由 AI 提供的 PHP 範例

要構成小工具鏈，通常需要具備幾個條件：

1. 觸發點（Kick-off）：通常是會自動執行的魔術方法，如 `__destruct()` 或 `__unserialize()`。
2. 小工具（Gadgets）：攻擊者透過控制物件屬性，讓程式的執行流程從一個方法跳躍到另一個原本無直接關聯的方法。
3. 終點（Sink）：最終執行危險操作的地方，例如 `system()`、`file_put_contents()` 或 `eval()`。

假設我們的應用程式原始碼中存在以下兩個類別：

```php
class ProcessRunner {
    public $command;

    public function execute() {
        // 終點 (Sink)：執行系統指令
        system($this->command);
    }
}

class DatabaseLogger {
    public $db;

    public function __destruct() {
        // 觸發點 (Kick-off)：物件被銷毀時會自動呼叫
        // 原本的用意可能是呼叫資料庫連線的 execute()
        $this->db->execute();
    }
}
```

在正常的系統運作下，`DatabaseLogger` 的 `$db` 屬性會是一個穩定的資料庫連線物件。然而，如果攻擊者找到了一個可以輸入惡意序列化字串的漏洞（例如未經檢查的 Cookie 或直接寫入的 Cache），他們就可以自己構造出一條「工具鏈」：

```php
// === 攻擊者的視角 ===
$runner = new ProcessRunner();
$runner->command = "whoami"; // 植入惡意指令

$logger = new DatabaseLogger();
$logger->db = $runner; // 將原本預期是 DB 的屬性，偷換成 ProcessRunner 物件

// 產生惡意的序列化字串，將其送到受害網站
echo serialize($logger);
// 輸出：O:14:"DatabaseLogger":1:{s:2:"db";O:13:"ProcessRunner":1:{s:7:"command";s:6:"whoami";}}
```

當受害網站不安全的將這串字串反序列化時：

```php
// === 受害者的應用程式 ===
$payload = 'O:14:"DatabaseLogger":1:{s:2:"db";O:13:"ProcessRunner":1:{s:7:"command";s:6:"whoami";}}';

// 應用程式將字串還原成物件
unserialize($payload);

// 當程式執行結束，DatabaseLogger 物件被銷毀，觸發 __destruct()。
// 接著它呼叫了 $this->db->execute()。
// 因為 $this->db 已經被竄改成 ProcessRunner，所以實際上執行了 ProcessRunner 的 execute()。
// 最終觸發了 system("whoami")，攻擊者成功執行了系統指令！
```

了解這個簡單的攻擊原理後，就能明白為什麼 Laravel 13 開始預設禁止快取序列化物件。快取的底層實作經常會依賴序列化機制，若應用程式不慎將使用者可控的內容寫入快取，或是快取伺服器遭到惡意操作，當 Laravel 嘗試讀取並反序列化這些資料時，就可能面臨遠端程式碼執行（RCE）的嚴重風險。

沒想到升級個框架還能學到資安知識，真的是賺到了 😆。

## 參考資料

- [Deserialization: What the Heck *Actually* Is a Gadget Chain?](https://medium.com/@dub-flow/deserialization-what-the-heck-actually-is-a-gadget-chain-1ea35e32df69)
- [PHP deserialization attacks and a new gadget chain in Laravel](https://blog.quarkslab.com/php-deserialization-attacks-and-a-new-gadget-chain-in-laravel.html)
