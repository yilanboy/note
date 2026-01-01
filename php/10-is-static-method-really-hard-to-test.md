---
layout: default
parent: PHP
nav_order: 10
---

# PHP 的靜態方法難以測試？

許多寫 PHP 的人應該都聽過這句話：

「PHP 的靜態方法會讓測試不好寫。」

這聽起來像是在告誡我們盡量別用靜態方法，但這並不太正確。有些工具類別或是 Helper 方法，因為使用時並**不需要儲存狀態**，所以就沒有建立實體的需求。以 Laravel 的 [Helper](https://laravel.com/docs/master/helpers) 為例，你可以看到很多靜態方法的使用。

```php
use Illuminate\Support\Arr;

$array = ['products' => ['desk' => ['price' => 100]]];

$price = Arr::get($array, 'products.desk.price');

// 100
echo $price;
```

如果想測試靜態方法，我們可以使用單元測試。

```php
#[Test]
public function returnsCorrectPrice()
{
    $array = ['products' => ['desk' => ['price' => 100]]];

    $price = Arr::get($array, 'products.desk.price');

    $this->assertSame($price, 100);
}
```

但是在現實場景中，相較於單元測試，功能測試是比較貼近現實使用的方式，所以在應用程式開發的場景下，功能測試照理說會比單元測試更為重要。

## 為什麼測試會不好寫？

既然靜態方法可以測試，為什麼會說靜態方法不好測試呢？

有一個情況是，因為靜態方法不會產生實體，所以我們無法使用 Mock 去改變靜態方法原本的行為，當我們意圖在測試中模擬靜態方法發生錯誤的行為時，就會很困難。

以我寫的密碼金鑰登入功能為例。在用戶使用密碼金鑰登入時，會先透過 API 取得憑證請求選項。

在 API 的處理邏輯中，有一個步驟，是將憑證請求選項的物件轉換為 JSON 字串。我會使用 `Serializer` 的靜態方法 `make()` 建立一個 `$serializer` 實體，再使用 `$serializer` 的 `toJson()` 方法將憑證請求選項的物件轉換為 JSON 字串。

```php
use App\Services\Serializer;

class GeneratePasskeyAuthenticationOptionsController extends Controller
{
    public function __invoke()
    {
        // ...

        try {
            // 建立一個 serializer 實體
            $serializer = Serializer::make();
            // 將憑證請求選項的物件轉換為 JSON 字串
            $optionsJson = $serializer->toJson($options);
        } catch (SerializerException $e) {
            Log::error('Webauthn 認證選項序列化失敗', [
                'exception' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => '發生錯誤，無法序列化認證選項。',
            ], 400);
        }

        // ...

        return $optionsJson;
    }
}
```

這邊有一點需要注意，`toJson()` 方法是有可能會拋出例外的，所以如果你想要測試 `toJson()` 拋出例外的情況。上面程式碼的寫法就會讓你很難去測試。

因為我們沒有辦法使用 Mock 去替換掉 `Serializer::make()` 產生的實體。

雖然 Mockery 有一招可以讓你去 mock 靜態方法，

```php
// 使用 alias 來 mock 靜態方法
$serializerClassMock = Mockery::mock('alias:App\Services\Serializer');

// 模擬 make() 回傳一個 Mock 物件，並在呼叫 toJson() 時拋出例外
$serializerInstanceMock = Mockery::mock();
$serializerInstanceMock->shouldReceive('toJson')
    ->andThrow(new SerializerException('Serialization failed'));

$serializerClassMock->shouldReceive('make')
    ->andReturn($serializerInstanceMock);
```

但這麼做有一個問題，那就是會影響到其他測試。一旦使用 `alias`，後續的測試中如果也有使用到 `Serializer::make()`，那麼就會直接拋出例外。

所以在執行測試時，注意加上 `#[RunInSeparateProcess]` 的註解，讓這個測試在一個獨立的進程中執行。

```php
#[Test]
#[RunInSeparateProcess]
public function returns400AndLogsErrorWhenSerializationFailsInAuthentication()
{
    // ...

    $serializerInstanceMock = Mockery::mock();
    $serializerInstanceMock->shouldReceive('toJson')
        ->andThrow(new SerializerException('Serialization failed'));

    $serializerClassMock = Mockery::mock('alias:App\Services\Serializer');
    $serializerClassMock->shouldReceive('make')
        ->andReturn($serializerInstanceMock);

    // ...
}
```

## 透過 Laravel 的 Service Container 使用依賴注入

相較於直接在程式碼中使用靜態方法建立實體，我們可以在 Laravel 的 Service Container 中設定如何建立 Serializer。

```php
// app/Providers/AppServiceProvider.php

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(Serializer::class, function () {
            return Serializer::make();
        });
    }

    // ...
}
```

之後我們就可以透過依賴注入的方式，將 Serializer 的實體傳入到 Controller 中。

```php
use App\Services\Serializer;

class GeneratePasskeyAuthenticationOptionsController extends Controller
{
    // Laravel 會根據我們在 AppServiceProvider 中的設定，建立一個 Serializer 實體
    // 並透過依賴注入的方式，將這個實體傳入到 Controller 中
    public function __invoke(Serializer $serializer)
    {
        // ...

        try {
            // 將憑證請求選項的物件轉換為 JSON 字串
            $optionsJson = $serializer->toJson($options);
        } catch (SerializerException $e) {
            Log::error('Webauthn 認證選項序列化失敗', [
                'exception' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => '發生錯誤，無法序列化認證選項。',
            ], 400);
        }

        // ...

        return $optionsJson;
    }
}
```

在測試中，我們也不需要使用 `alias`，只需要將 Service Container 中的 Serializer 實體替換成 Mock 實體即可。

```php
#[Test]
public function returns400AndLogsErrorWhenSerializationFailsInAuthentication()
{
    // ...

    // 建立一個 Serializer 的 Mock 物件
    $serializerMock = Mockery::mock(Serializer::class);
    // 預期 toJson 方法會被呼叫，並拋出例外
    $serializerMock->shouldReceive('toJson')
        ->andThrow(new SerializerException('Serialization failed'));

    // 將 Mock 的 serializer 實體替換掉 Service Container 中的 serializer 實體
    $this->app->instance(Serializer::class, $serializerMock);

    // ...
}
```

使用依賴注入的方式，我們可以更輕鬆的替換掉目標實體，更方便的在測試中去模擬特殊應用場景。

## 參考資料

- [What is the difference between overload and alias in Mockery?](https://stackoverflow.com/questions/31219542/what-is-the-difference-between-overload-and-alias-in-mockery)
