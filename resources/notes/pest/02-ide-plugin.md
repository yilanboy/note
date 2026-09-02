# IDE Plugin

Pest 官方有提供多種 IDE 的 plugin，詳細可以上官方網站查看 : [Pest - IDE plugins](https://pestphp.com/docs/ide-plugins)

## PhpStorm 的功能

- 安裝好 plugin 之後，如果你測試檔案是用 Pest 寫的，那麼 icon 就會變成 Pest 的 icon
- 每個 Pest 測試檔案的最上方都會有一個按鈕可以讓你直接執行該檔案的測試
- 此外點選 Menu -> Navigate -> File Structure 就可以查看該測試檔案所包含的所有測試

    - Mac 快捷鍵為 `Cmd + F12`
    - Windows 快捷鍵為 `Ctrl + F12`

- 可以使用 `Shift x 2` 直接搜尋測試名稱並跳轉
- 支援 Pest 的 `expect()` API，如果你在 `Pest.php` 中有客製的 `expect` 方法，這個 plugin 會在 autocompletion 中顯示
- 在 Laravel 的 `tests` 資料夾上，可以點選右鍵選擇 More Run/Debug -> Run 'tests(Pest) with Coverage' 執行測試並顯示覆蓋度
    - 測試執行完畢之後，會在檔案列表中顯示每個檔案的測試覆蓋度
    - 在 Menu -> Run -> Hide coverage 中可以關閉檔案列表測試覆蓋度的顯示

## 參考資料

[![Discovering the Pest Plugin](https://img.youtube.com/vi/umVUEq4yGIQ/sddefault.jpg)](https://www.youtube.com/watch?v=umVUEq4yGIQ)
