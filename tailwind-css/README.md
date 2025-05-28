---
layout: default
has_children: true
nav_order: 23
---

# Tailwind CSS

Tailwind CSS 是一個 Utility First 的 CSS 框架，
意思是框架中會盡可能的提供小型、單一樣式以及單一用途的的 Class Name。
這麼做的好處在於你可以很直觀的透過 Class Name 去調整樣式。

以下面這個卡片樣式為例子：

```html
<div class="rounded-xl bg-gray-50 p-4">
  <!-- Put your content here -->
</div>
```

`<div>` 中的每一個 Class Name，其代表的 CSS 屬性如下

```css
.rounded-xl {
  border-radius: var(--radius-xl);
}

.bg-gray-50 {
  background-color: var(--color-gray-50);
}

.p-4 {
  padding: calc(var(--spacing) * 4);
}
```

可以看到每一個 Class Name 都只提供很簡單的 CSS 樣式。
因此使用者可以從名稱很直觀的知道這個 Class Name 提供了什麼樣的 CSS 效果。
