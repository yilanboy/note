# 利用科學與 CSS 變數來設定邊框圓角

Tailwind CSS 的作者最近開始製作一系列的影片 - Build UIs that don't suck，
這一系列影片會介紹一些網頁設計的心法與使用 Tailwind CSS 的小技巧。

在網頁設計中，有一種設計相當常見，就是一個元素包住另外一個元素，並擁有各自的 `border-radius` 樣式。

```html
<div class="... rounded-4xl p-3"> 
  <div class="... rounded-3xl">
    <!-- Your content -->
  </div>
</div>
```

比較有經驗的開發者知道，裡面的元素，它使用的 `border-radius` 數值必須比外面的元素小。
因此可以看到外面的元素使用 `rounded-4xl`，裡面的元素使用 `rounded-3xl`。

根據 Tailwind CSS 的作者所說，雖然從肉眼上看，樣式效果相當正常，
但實際上這個設定只是很接近正確的數值，並不完全正確。

## 裡面元素的邊框圓角設定

根據 Tailwind CSS 的作者所說，裡面元素的邊框圓角的數值，
**應該是外面元素的邊框圓角 (border-radius) 的數值減去內邊距 (padding) 的數值**。

因此裡面元素的 Class Name 應該修改成以下的方式。

```html
<div class="... rounded-4xl p-3">
  <div class="... rounded-[calc(var(--radius-4xl)-(--spacing(3)))]">
    <!-- Your content -->
  </div>
</div>
```

多虧了強大的 Tailwind CSS 編譯器，
我們可以直接在 Class Name 中使用 CSS 的函式 `calc` 來進行運算。

> 這裡的 `--spacing(3)` 為 Tailwind CSS 提供的[函式語法](https://tailwindcss.com/docs/functions-and-directives#functions)。
>
> CSS 支援用戶自行宣告函式的功能雖然有提案，但尚未正式支援。

不過這種做法有另外一個問題，如果我想修改外面元素的 `border-radius` 與 `padding` 的話，
裡面元素的 Class Name 也同樣需要修改，這其實有點麻煩，也不好維護。

## 使用 CSS 變數

Tailwind CSS 允許你在 Class Name 中宣告 CSS 變數。
我們可以使用變數將外面元素與裡面元素的圓角設定連結起來。

```html
<div
  class="... rounded-(--card-radius) p-(--card-padding) [--card-radius:var(--radius-4xl)] [--card-padding:--spacing(3)]"
>
  <div class="... rounded-[calc(var(--card-radius)-var(--card-padding))]">
    <!-- Your content -->
  </div>
</div>
```

> `rounded-(--card-radius)` 為 `rounded-[var(--card-radius)]` 的簡潔寫法。

如此一來，當我們修改外面元素的邊框圓角，裡面元素的邊框圓角也會跟著一起變更。

## 參考資料

- [Tailwind CSS - Adding Custom Styles](https://tailwindcss.com/docs/adding-custom-styles)
