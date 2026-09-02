# Svelte

Svelte 是一個新穎的現代前端框架。

與其他前端框架相比，他並不是將整個框架包在前端網頁中，而是採用預先編譯的方式，
因此相較於其他框架，打包後的檔案會更小，效能會更好。

此外 svelte 的語法也非常容易學習，幾乎快要與原生 javascript 相同。

比較一下 vue 與 svelte 在宣告狀態的寫法 (declare state)。

## 語法比較

### Vue 3

```vue
<script setup>
import { ref } from 'vue';
const name = ref('John');
</script>

<template>
    <h1>Hello {{ name }}</h1>
</template>
```

### Svelte

```svelte
<script>
    let name = 'John';
</script>

<h1>Hello {name}</h1>
```

語法上是不是簡單很多呢？

## Component

在 Svelte 中，component 是可以重複使用的元件。

一個完整的 App 可能會包含一個或多個 component，每一個 component 都會包含 JavaScript、CSS 與 HTML。

Component 間是相互獨立的，彼此不會互相干擾。

下方是一個最簡單的 component：

```svelte
<script>
    let name = 'Svelte';
</script>

<!-- 大括號代表要使用 svelte 中的變數 --><h1>Hello {name}!</h1>
```

大括號中可以使用 JavaScript 的方法。

```svelte
<h1>Hello {name.toUpperCase()}!</h1>
```

## Dynamic Attributes

如剛在我們使用大括號 `{}` 來綁定元素的內容，我們也可以使用 `{}` 來綁定元素的屬性。

```svelte
<script>
    let src = '/image.gig';
</script>

<img {src} alt="Just a image" />
```

> 注意在 A11y 中，img 必須要有 alt 屬性

如果變數名稱與 HTML 屬性名稱相同，可以使用簡寫的方式：

```svelte
<script>
    let src = '/image.gig';
</script>

<img {src} alt="Just a image" />
```

## Styling

你可以使用 `<style>` 標籤來為你的元件加入樣式。這些樣式只會影響到你的元件，而不會影響到其他元件。

```svelte
<p>Hello World!</p>

<style>
    /* this style will only effect this component */
    p {
        color: red;
    }
</style>
```

## Nested Component

在 Svelte 中，你可以將 component 嵌套在其他 component 中。

假設我們現在有兩個 components，分別是 `App.svelte` 與 `Nested.svelte`。

```svelte
<!-- Nested.svelte --><p>This is another paragraph.</p>
```

```svelte
<!-- App.svelte -->
<script>
    import Nested from './Nested.svelte';
</script>

<p>This is a paragraph.</p>
<!-- use the nested component -->
<Nested />
```

## HTML Tags

在預設的情況下，字串只會被當成一個單純的字串，而不會被當成 HTML。

如果你想要讓字串被當成 HTML，你可以使用 `{@html}`。

```svelte
<script>
    let string = `this string contains some <strong>HTML!!!</strong>`;
</script>

<p>{@html string}</p>
```
