# Static Analysis

靜態分析 (Static Analysis) 是指在不執行程式的情況下，透過程式碼的分析，來找出程式碼中的錯誤。

PHP 有一個靜態分析工具 [PHPStan](https://phpstan.org/)，可以幫助我們找出 PHP 程式碼中的錯誤。

## 在 Laravel 專案中使用 PHPStan

Laravel 因為使用了不少 PHP 的魔術方法 (Magic Method)，所以在使用 PHPStan 時，會有很多的錯誤訊息，因此我們需要使用 [Larastan](https://github.com/nunomaduro/larastan) 來幫助我們處理這些錯誤訊息。

安裝 Larastan。

```bash
composer require nunomaduro/larastan:^2.0 --dev
```

然後在 Laravel 資料夾底下新增 `phpstan.neon` 檔案，內容如下：

```neon
includes:
    - ./vendor/nunomaduro/larastan/extension.neon

parameters:

    paths:
        - app/

    level: 5
```
