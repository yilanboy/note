---
layout: default
parent: PHP
nav_order: 9
---

# 使用 HTML Sanitizer 來過濾不安全的 HTML 內容

只要網站有能讓使用者輸入文字的地方，例如常見的所見即所得（WYSIWYG）編輯器，就需要設定一個機制來過濾掉不安全的 HTML 內容以避免 XSS（Cross-site scripting）攻擊。

我的部落格當然也有實作這部分的機制。在 XSS 過濾上，原本我使用的是 [HTML Purifier](https://github.com/ezyang/htmlpurifier) 這個套件，下面是根據我的需求所寫的過濾設定：

```php
public static function purifierHtml(string $html): string
{
    $config = HTMLPurifier_Config::createDefault();

    $config->set('Core.Encoding', 'utf-8');
    // 設置配置的名稱
    $config->set('HTML.DefinitionID', 'content');
    // 建立過濾規則的快取
    $config->set('Cache.SerializerPath', '/tmp/cache');

    // 預設幫外部連結補上 target="_blank" 與 rel="noreferrer noopener"
    $config->set('HTML.TargetBlank', true);
    // 預設幫外部連結補上 rel="nofollow"
    $config->set('HTML.Nofollow', true);

    // 清除過濾規則的快取，只在開發環境下使用
    if (! app()->isProduction()) {
        $config->set('Cache.DefinitionImpl', null);
    }

    $def = $config->maybeGetRawHTMLDefinition();

    if (! is_null($def)) {
        // 圖片元素
        $def->addElement('figure', 'Block', 'Flow', 'Common');
        // 圖片底下的說明文字元素
        $def->addElement('figcaption', 'Block', 'Flow', 'Common');
        // 影片嵌入元素
        $def->addElement(
            'oembed', // 標籤名稱
            'Block', // 元素本身的類型，可以選擇 Inline 或是 Block
            'Flow', // 子元素的類型，Flow 代表子元素可以是 Inline、Block 或者是單純的字串
            'Common', // 可用的屬性集合，例如 style、class、id 或者是 title
            ['url' => 'URI'] // 允許哪些額外的屬性
        );
    }

    $purifier = new HTMLPurifier($config);

    return $purifier->purify($html);
}
```

某天我看到 Laravel News 文章介紹 Symfony 也有一個套件叫做 [HTML Sanitizer](https://symfony.com/doc/current/html_sanitizer.html)，也是用來處理 XSS 過濾，而且寫法採用流暢介面（Fluent Interface），所以寫起來相當直觀。在看了文件之後，我二話不說就將 htmlpurifier 換成了 HTML Sanitizer。

接下來簡單的介紹 HTML Sanitizer 該如何使用。

## HTML Sanitizer 的設定

首先使用 Composer 安裝 HTML Sanitizer。

```bash
composer require symfony/html-sanitizer
```

HTML Sanitizer 的過濾規則採用 W3C 的 [Sanitizer API](https://wicg.github.io/sanitizer-api/)。你可以使用 `allowStaticElements()` 取得最基本的過濾規則。

```php
use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

$config = new HtmlSanitizerConfig->allowStaticElements();

$htmlSanitizer = new HtmlSanitizer($config);

// 不安全的 HTML（可能由 WYSIWYG 編輯器產生出來的內容）
$unsafePostContents = "...";

// 使用 Sanitizer 產生出安全的 HTML
$safePostContents = $htmlSanitizer->sanitize($unsafePostContents);
```

基礎規則除了 `allowStaticElements()`，你也可以使用 `allowSafeElements()`。這個基礎規則會連 CSS（CSS Injection）與點擊劫持（Click-Jacking）都過濾掉。

```php
$config = new HtmlSanitizerConfig->allowSafeElements();
```

基礎規則可能會過濾掉一些你想要的屬性。你可以使用 `allowAttribute()` 來避免你想要的屬性被過濾掉。

```php
$config = new HtmlSanitizerConfig
    ->allowSafeElements()
    // 在 p 元素上允素 style 屬性
    ->allowAttribute(attribute: 'style', allowedElements: ['p']);
```

你也可以強制特定元素上必須具備特定屬性。

```php
$config = new HtmlSanitizerConfig
    ->allowSafeElements()
    // 強制 a 元素上必須要有 target="_blank" 屬性
    ->forceAttribute(element: 'a', attribute: 'target', value: '_blank');
```

如果你想要的元素會被過濾掉，你可以使用 `allowElement()` 避免它被過濾掉。

```php
$config = new HtmlSanitizerConfig
    ->allowSafeElements()
    // 允許 oembed 元素，並允許 url 與 class 屬性
    ->allowElement(element: 'oembed', allowedAttributes: ['url', 'class']);
```

HTML Sanitizer 預設有 20,000 字元的上限，用來避免 DoS 攻擊。如果你不想要這個限制的話，可以使用 `withMaxInputLength()` 將其關掉。

```php
$config = new HtmlSanitizerConfig
    ->allowSafeElements()
    // 不限制字元數量上限
    ->withMaxInputLength(maxInputLength: -1);
```

> 字元長度的計算使用 `strlen()`。
>
> 這裡選擇關掉上限的原因是我已經使用 Laravel Validation 來限制字元長度的最大值了。

改用 HTML Sanitizer 後的過濾設定如下：

```php
public static function sanitizeHtml(string $html): string
{
    $htmlSanitizer = new HtmlSanitizer(
        new HtmlSanitizerConfig()
            ->allowSafeElements()
            ->allowAttribute(attribute: 'data-language', allowedElements: 'pre')
            ->allowAttribute(attribute: 'class', allowedElements: ['span', 'code', 'figure'])
            ->allowAttribute(attribute: 'style', allowedElements: ['p', 'figure'])
            ->forceAttribute(element: 'a', attribute: 'rel', value: 'noopener noreferrer')
            ->forceAttribute(element: 'a', attribute: 'target', value: '_blank')
            ->allowElement(element: 'oembed', allowedAttributes: ['url', 'class'])
            ->withMaxInputLength(maxInputLength: -1)
    );

    return $htmlSanitizer->sanitize($html);
}
```

看起來比原本 HTML Purifier 精簡非常多，超讚。

## 參考資料

- [HTML Sanitizer](https://symfony.com/doc/current/html_sanitizer.html)
- [HTML Sanitizer API](https://wicg.github.io/sanitizer-api/)
- [HTML Purifier Customize](http://htmlpurifier.org/docs/enduser-customize.html)
- [https://aszx87410.github.io/beyond-xss/ch3/css-injection/](https://aszx87410.github.io/beyond-xss/ch3/css-injection/)
- [不識廬山真面目：Clickjacking 點擊劫持攻擊](https://blog.huli.tw/2021/09/26/what-is-clickjacking/#clickjacking-%E6%94%BB%E6%93%8A%E5%8E%9F%E7%90%86)
