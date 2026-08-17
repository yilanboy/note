# 有與沒有 `mb_` 的差異

PHP 中有一些字串函式會提供兩個版本：一個是沒有 `mb_` 前綴的版本，另一個則是有 `mb_` 前綴的版本。

這裡的 `mb` 是 **multibyte** 的縮寫，意思是「多位元組」。有 `mb_` 前綴的函式通常由 `mbstring` 擴充套件提供，專門處理 UTF-8 等多位元組編碼的字串。

## 有沒有 `mb_` 前綴的差異

沒有 `mb_` 前綴的函式，通常以單位元組或 ASCII 的方式處理字串。若資料只包含英文字母、數字與常見符號，通常沒有問題；但遇到中文或其他 Unicode 字元時，可能無法正確計算長度、切割字串或轉換大小寫。

有 `mb_` 前綴的函式，會依照指定的字元編碼處理多位元組字串，能較正確地處理中文、日文、韓文及其他 Unicode 文字。不過，使用前必須確認 PHP 已啟用 `mbstring` 擴充套件。

例如，PHP 中常見的成對函式包括：

| 一般版本       | 多位元組版本      | 用途           |
| -------------- | ----------------- | -------------- |
| `strlen()`     | `mb_strlen()`     | 計算字串長度   |
| `substr()`     | `mb_substr()`     | 擷取字串       |
| `strtolower()` | `mb_strtolower()` | 將字串轉成小寫 |
| `strtoupper()` | `mb_strtoupper()` | 將字串轉成大寫 |

## ASCII 與 UTF-8 是什麼？

> **ASCII**（American Standard Code for Information Interchange）是一套早期的字元編碼標準，主要表示英文字母、數字與常見控制字元。標準 ASCII 使用 7 個位元（bit)，可以表示 128 個字元，例如 `A`、`a`、`0` 與空白。

> **UTF-8** 是 Unicode 的一種變長字元編碼，可以表示世界上大多數語言的文字。ASCII 字元在 UTF-8 中仍然使用 1 個位元組（byte），但中文等字元通常會使用多個位元組。例如，`A` 佔 1 個位元組，而中文「你」通常佔 3 個位元組。

因此，直接使用只適合 ASCII 或單位元組的函式處理 UTF-8 字串，可能會把一個字元的多個位元組拆開，導致結果不正確。

## 以 `mb_strtolower()` 為例

`strtolower()` 與 `mb_strtolower()` 都可以將英文字串轉換成小寫，但對字元編碼的支援不同。

### `strtolower()`

`strtolower()` 主要適合處理 ASCII 字串：

```php
$result = strtolower('Hello WORLD');

// hello world
```

在 PHP 8.2 及之後，`strtolower()` 只會將 ASCII 範圍內的英文字母 `A-Z` 轉成 `a-z`，而且不受目前 locale 影響。因此，當字串可能包含非 ASCII 字元時，不應依賴它進行完整的 Unicode 大小寫轉換。

### `mb_strtolower()`

`mb_strtolower()` 使用 Unicode 規則處理多位元組字串，適合 UTF-8 等編碼：

```php
$result = mb_strtolower('Hello WORLD Ä Ö Ü', 'UTF-8');

// hello world ä ö ü
```

建議明確指定字元編碼：

```php
$result = mb_strtolower($value, 'UTF-8');
```

使用前要確認 PHP 已啟用 `mbstring` 擴充套件，否則可能會出現 `Call to undefined function mb_strtolower()`。

中文沒有大小寫之分，所以以下程式碼中的中文不會被轉換，但其中的英文字母仍會處理：

```php
$result = mb_strtolower('你好 PHP', 'UTF-8');

// 你好 php
```

## 實務建議

- 確定資料只包含 ASCII 時，可以使用沒有 `mb_` 前綴的函式。
- 資料可能包含中文、日文、韓文或其他 Unicode 文字時，優先使用對應的 `mb_` 函式。
- 使用 `mb_*` 函式前，確認伺服器已啟用 `mbstring`。
- 大小寫轉換不等於完整的字串正規化；若要做帳號、電子郵件或搜尋關鍵字比較，仍要一併考慮 Unicode 正規化與資料庫排序規則。

## 一句話總結

> 沒有 `mb_` 前綴的函式適合處理單純的 ASCII 字串；有 `mb_` 前綴的函式則適合處理 UTF-8 等多位元組字串。
