---
layout: default
parent: Laravel
nav_order: 6
---

# Laravel Pennant

Laravel Pennant 是一個用來管理功能旗標 (Feature Flag) 的輕量套件。

你可以用來管理新功能是否開放給使用者使用，當新功能尚未準備好時，可以先將功能關閉，或是只開放給部分使用者使用。


## 如何使用

假設你有一個新的頁面只想開放給管理員使用，你可以在 `AppServiceProvider.php` 的 `boot` 方法中加入以下的程式碼：

```php
use Laravel\Pennant\Feature;

public function boot(): void
{
    Feature::define('new-checkout', function (User $user) {
        // 回傳一個 boolean 值
        return $user->isAdmin();
    });
}
```

然後在你的控制器中，你可以使用 `Feature::active('new-checkout')` 來檢查使用者是否有權限訪問該頁面。

```php
public function index()
{
    if (Feature::active('new-checkout')) {
        return view('new-checkout');
    }

    return view('checkout');
}
```

在預設情況下，Laravel Pennant 會將功能旗標的值儲存在資料庫中，但也可以儲存在記憶體中。

除了單純的 Boolean 值之外，你也能儲存其他型別的值，例如字串。

```php
use Laravel\Pennant\Feature;

public function boot(): void
{
    Feature::define('new-button-color', function (User $user) {
        return Arr::random(['red', 'green', 'blue']);
    });
}
```


之後就可以在你的控制器中使用 `Feature::value('new-button-color')` 來取得功能旗標的值。

```php
public function index()
{
    $buttonColor = Feature::value('new-button-color');

    return view('index', ['buttonColor' => $buttonColor]);
}
```

## 參考資料

- [Laravel Pennant](https://laravel.com/docs/master/pennant)