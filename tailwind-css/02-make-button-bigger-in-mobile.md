# 讓按鈕在移動設備上更大一些

在桌面設備上，網頁中的一些按鈕設計可能會小一點 (可能是為了設計 or 好看)，
對於可以精準點擊的滑鼠游標來說，小按鈕在使用體驗上不會有問題，
但在移動設備上，過小的按鈕可能會讓用戶的大拇指在觸控時，難以精確的點擊。

```html
<!-- 這個只有 size-6 的按鈕，在桌面設備上用滑鼠點擊可能相當容易，設計上也很好看 -->
<!-- 但在移動設備上，size-6 可能就有點過小了，對用戶的拇指不太友善 -->
<button
  type="button"
  class="flex size-6 items-center justify-center rounded-md transition hover:bg-zinc-900/15"
  aria-label="Toggle navigation"
>
  <!-- ... -->
</button>
```

在不改變按鈕外觀與設計的前提下，如果想要讓按鈕的點擊範圍在移動設備上大一點，可以怎麼做呢？
Tailwind CSS 的作者提供了一個很酷的方式。

就是在 `<button>` 裡面直接加上一個大一點 `<span>` 標籤。

```html
<button
  type="button"
  class="relative flex size-6 items-center justify-center rounded-md transition hover:bg-zinc-900/15"
  aria-label="Toggle navigation"
>
  <!-- 在 button 裡面加上一個大一點的 span 標籤，尺寸為 size-12 -->
  <!-- 透過 absolute 絕對定位，讓 span 不影響其他元素的排版 -->
  <!-- 使用 top-1/2 left-1/2 -translate-1/2 實現置中的效果  -->
  <!-- 這可以讓按鈕在不改變大小與設計的狀況下，讓點擊範圍大一點 -->
  <span class="absolute top-1/2 left-1/2 size-12 -translate-1/2"></span>
  <!-- ... -->
</button>
```

雖然這個方法很好的解決了按鈕在移動裝置上不夠大的問題，
但是你會發現在桌面設備上，當滑鼠只是靠近但還沒移動到按鈕上時，就會觸發按鈕的 `hover` 樣式。
這是因為只要進入 `<span>` 的範圍，就會觸發 `<button>` 的 `hover` 效果。

你當然可以用 `md:hidden`，透過螢幕大小來判斷要不要隱藏 `<span>`，
但是作者請我們仔細思考一下，這樣的做法真的是對的嗎？

## 要不要顯示 `<span>` 應該是要用螢幕大小來判斷嗎？

實際上並不是，**應該是根據用戶是否是使用手指來觸控才對**。
CSS 本身提供了一個語法，可以判斷用戶是使用滑鼠游標還是使用手指觸控來瀏覽網頁。

```css
/* 如果用戶是使用滑鼠游標，就顯示以下的效果 */
@media (pointer: fine) {
  /* ... */
}

/* 如果用戶是使用手指觸控，就顯示以下的效果 */
@media (pointer: coarse) {
  /* ... */
}
```

在 Tailwind CSS 中，雖然沒有提供 `pointer` 的 Variant Class Name，
但我們可以使用 Tailwind CSS 的客製化 Variant 功能。

```html
<!-- 使用 [@media(pointer:fine)]:hidden，當用戶使用滑鼠游標時，隱藏 span -->
<span
  class="absolute top-1/2 left-1/2 size-12 -translate-1/2 [@media(pointer:fine)]:hidden"
></span>
```
