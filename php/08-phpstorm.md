---
layout: default
parent: PHP
nav_order: 8
---

# PHPStorm

PHPStorm 為 Jetbrains 推出的 PHP IDE，是寫 PHP 的好幫手，這裡記錄一些我習慣在 PHPStorm 中調整的設定。

## 程式碼樣式

### 使用 Laravel Pint 的程式碼風格

在 Settings -> Editor -> Code Style -> PHP 中。

點選右上角的 Set from... 然後選擇 **Laravel**。

### 對齊陣列的值

在 Settings -> Editor -> Code Style -> PHP -> Wrappings and Braces 底下。

勾選 Array Initializer 底下的 **Align key-value pairs**。

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

## 參考資料

- [Formatting code: getting aligned array setups](https://www.reddit.com/r/phpstorm/comments/17apa05/formatting_code_getting_aligned_array_setups/)
- [Cmd+Shift+A hotkey opens Terminal with "apropos" search instead of the Find Action dialog](https://intellij-support.jetbrains.com/hc/en-us/articles/360005137400-Cmd-Shift-A-hotkey-opens-Terminal-with-apropos-search-instead-of-the-Find-Action-dialog)
