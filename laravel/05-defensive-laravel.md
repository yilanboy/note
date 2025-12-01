---
layout: default
parent: Laravel
nav_order: 5
---

# 防禦性 Laravel 開發

本篇為 Laracasts 的教學影片 [Defensive Laravel](https://laracasts.com/series/defensive-laravel) 的學習筆記，內容主要在介紹如何利用防禦性開發技巧來提升 Laravel 應用程式的穩定性與安全性。

## 什麼是防禦性開發？

防禦性開發是一種軟體開發方法，主要目的是為了提升程式的穩定性與安全性。透過在程式中加入各種檢查與防護機制，來避免潛在的錯誤與攻擊，確保程式在面對各種異常情況時仍能正常運作。

## Strict Types

在 PHP 中，可以透過在檔案開頭加入 `declare(strict_types=1);` 來啟用嚴格型別檢查。這樣一來，PHP 就會在函式或方法被呼叫時，強制檢查傳入的參數型別是否與宣告的型別相符，而不是自動進行型別轉換。

```php
declare(strict_types=1);

function add(int $a, int $b): int {
    return $a + $b;
}

echo add(1, 2); // 正常運作，輸出 3
echo add(1, "2"); // 會拋出 TypeError
echo add(1.5, 2.5); // 會拋出 TypeError
```

啟用嚴格型別檢查可以幫助開發者更早的發現型別錯誤，提升程式的穩定性與可維護性。

> 不建議全局啟用嚴格型別檢查，因為這可能會導致與第三方套件的相容性問題。建議在每個檔案中根據需要選擇性的啟用。

## Guard Clauses And Avoiding Invalid States

Guard Clauses（守衛子句）是一種程式設計技巧，主要用來避免無效的參數進入函式或方法。

透過在函式或方法的開頭加入各種檢查，來確保傳入的參數或狀態是有效的，否則就直接拋出例外或返回錯誤。

```php
function divide(int $a, int $b): float {
    if ($b === 0) {
        throw new InvalidArgumentException("除數不能為零");
    }

    return $a / $b;
}
```

## Imutable Dates

在 PHP 中，物件預設是 Call by Reference，因此即使把我們將物件賦予給另外一個變數，我們對這個變數的任何修改都會影響到原始物件。

這個在 Laravel 中會造成一些問題，例如我們在使用 Carbon 的 `addDays` 方法時，會影響到原始的 Carbon 物件。

```php
use Illuminate\Support\Carbon;

$date = Carbon::now();

dd($date->format('Y-m-d')); // 2025-12-01

$date->addDays(1); // 會影響到 $date

dd($date->format('Y-m-d')); // 2025-12-02
```

我們可以透過 `toImmutable()` 方法來避免影響到原始物件。

```php
use Illuminate\Support\Carbon;

$date = Carbon::now()->toImmutable();

dd($date->format('Y-m-d')); // 2025-12-01

$date->addDays(1); // 不會影響到 $date

dd($date->format('Y-m-d')); // 2025-12-01
```


你也可以使用 `copy()` 方法來避免影響到原始物件。

```php
$date->copy()->addDays(1); // 不會影響到 $date
```

Laravel 的 Model Casts 也支援 Immutable Date。

```php
protected function casts(): array {
    return [
        'due_date' => 'immutable_datetime',
    ];
}
```