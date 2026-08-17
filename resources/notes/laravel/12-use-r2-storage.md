# 使用 Cloudflare R2 儲存

Laravel 沒有內建 Cloudflare R2 驅動程式，不過由於 R2 的 API 與 Amazon S3 API 相容，因此可以使用 Laravel 的 S3 驅動程式存取 R2 儲存空間。

首先安裝 Flysystem 的 S3 套件：

```bash
composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
```

接著在 `config/filesystems.php` 中加入 R2 磁碟的連線設定：

```php
return [
    // ...
    'r2' => [
        'driver' => 's3',
        'key' => env('R2_ACCESS_KEY_ID'),
        'secret' => env('R2_SECRET_ACCESS_KEY'),
        'region' => 'auto',
        'bucket' => env('R2_BUCKET'),
        'url' => env('R2_URL'),
        'endpoint' => env('R2_ENDPOINT'),
        'use_path_style_endpoint' => env('R2_USE_PATH_STYLE_ENDPOINT', false),
        'throw' => false,
        'report' => false,
    ],
];
```

R2 沒有傳統意義上的 `region`，但 S3 驅動程式需要一個非空值，因此可以設定為 `auto`。

接著登入 Cloudflare，建立 R2 API token，並授予 `Workers R2 Storage` 的 `Edit` 權限。建立後，將產生的 Access Key ID 與 Secret Access Key 記下來。

將相關設定放入 `.env` 檔案：

```env
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_URL=
R2_BUCKET=
```

其中，`R2_ENDPOINT` 通常是 `https://<帳號 ID>.r2.cloudflarestorage.com`；`R2_URL` 則應填寫用來存取物件的公開網址，例如自訂網域。

完成設定後，就可以在 Laravel 中使用 R2：

```php
Storage::disk('r2')->put('file.txt', 'Hello, World!');
```

## 參考資料

- [Cloudflare R2 storage with Laravel in 5 minutes](https://medium.com/@antoine.lame/cloudflare-r2-storage-with-laravel-in-5-minutes-553a5403c6f8)
