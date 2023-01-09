# 查看測試覆蓋度 (Code Coverage)

Laravel 在 `test` 指令中可以使用 `--coverage` 顯示程式碼的測試覆蓋度

測試覆蓋程度這個功能由 PHP 的擴展 [Xdebug](https://xdebug.org/) 所提供，所以使用之前必須確認有安裝 Xdebug

```ini
pecl install xdebug
```

並在 Xdebug 的設定檔案中開啟 coverage mode

```ini
xdebug.mode=coverage
```

如果你是使用 [Laravel Sail](https://laravel.com/docs/9.x/sail) 開發環境的話，需要在 `.env` 檔案中加上一個變數，重新建立容器之後，容器中的 Xdebug 就會開啟 coverage mode

```ini
SAIL_XDEBUG_MODE=coverage
```

設定好之後就可以在執行測試時，使用 `--coverage` 來顯示測試覆蓋度

```bash
php artisan test --coverage
```

你可以自己定義最低的測試覆蓋程度應該是多少百分比，低於這個百分比，指令就會拋出 `exit(1)` 的錯誤，可以在 CI (Continuous Integration) 中用來中斷布署流程的進行

```bash
php artisan test --coverage --min=40
```

指令執行後的顯示結果如下 (前半段省略)

```text
...
  Notifications/PostComment  ................................................................................. 100.0 %
  Policies/CommentPolicy  .................................................................................... 100.0 %
  Policies/Policy  ........................................................................................... 100.0 %
  Policies/PostPolicy  ....................................................................................... 100.0 %
  Policies/UserPolicy  ....................................................................................... 100.0 %
  Providers/AppServiceProvider  .............................................................................. 100.0 %
  Providers/AuthServiceProvider  ............................................................................. 100.0 %
  Providers/BroadcastServiceProvider ........................................................................... 0.0 %
  Providers/EventServiceProvider  ............................................................................ 100.0 %
  Providers/RouteServiceProvider  ............................................................................ 100.0 %
  Rules/MatchOldPassword  .................................................................................... 100.0 %
  Rules/Recaptcha .............................................................................................. 0.0 %
  Services/FileService  ...................................................................................... 100.0 %
  Services/FormatTransferService 17 ........................................................................... 83.3 %
  Services/PostService 46, 57..75, 62..109 .................................................................... 40.5 %
  Services/SettingService  ................................................................................... 100.0 %
  View/Components/AppLayout  ................................................................................. 100.0 %
  helpers 3, 30..34 ........................................................................................... 50.0 %

  Total Coverage .............................................................................................. 80.6 %
```

測試覆蓋度可以讓你更清楚的知道還有哪邊的程式碼沒有測試到，是個相當方便且重要的功能