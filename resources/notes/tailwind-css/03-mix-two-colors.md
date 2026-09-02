# 取得介於兩個顏色之間的顏色

Tailwind CSS 預設提供了豐富的色盤，每一種顏色都有 `50`、`100`、`200`、`300` ... `950` 等色階，
讓我們可以依照需求選擇最適合的顏色：

```css
@theme {
    --color-zinc-50: oklch(98.5% 0 0);
    --color-zinc-100: oklch(96.7% 0.001 286.375);
    --color-zinc-200: oklch(92% 0.004 286.32);
    --color-zinc-300: oklch(87.1% 0.006 286.286);
    --color-zinc-400: oklch(70.5% 0.015 286.067);
    --color-zinc-500: oklch(55.2% 0.016 285.938);
    --color-zinc-600: oklch(44.2% 0.017 285.786);
    --color-zinc-700: oklch(37% 0.013 285.805);
    --color-zinc-800: oklch(27.4% 0.006 286.033);
    --color-zinc-900: oklch(21% 0.006 285.885);
    --color-zinc-950: oklch(14.1% 0.005 285.823);
}
```

不過在使用 Tailwind CSS 的時候，我還是常常會覺得相鄰兩個色階在視覺上的差距有點太大。

舉個例子，如果用 `zinc-900` 當作背景色，我有時會覺得太深；但如果改用 `zinc-800`，又會覺得有點太淺。
因此我會想要有一個介於 `zinc-900` 和 `zinc-800` 之間的顏色，但 Tailwind CSS 預設並沒有提供 `zinc-850` 這個色階。

後來我發現可以在 CSS 中使用 `color-mix()` 函式混合兩個顏色，藉此得到介於兩者之間的顏色。

```css
@theme {
    --color-zinc-850: color-mix(
        in oklch,
        var(--color-zinc-800),
        var(--color-zinc-900)
    );
}
```

在沒有指定比例的情況下，`color-mix()` 會預設以 `50%` 對 `50%` 混合兩個顏色。
透過這個方式，就能得到比 `zinc-800` 深、但比 `zinc-900` 淺的顏色。

## 參考資料

- [MDN 文件 - color-mix](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/Values/color_value/color-mix)
