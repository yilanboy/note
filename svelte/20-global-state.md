---
layout: default
parent: Svelte
nav_order: 20
---

# Global state

Svelte 5 的 `$state` 除了可以在元件內部使用之外，還可以用來創建全域狀態 (global state)，讓你可以在多個元件之間共享狀態。

首先建立一個 `shared.svelte.js` 檔案，並在其中使用 `$state` 來定義全域狀態：

```javascript
// shared.svelte.js
export const counter = $state({
  count: 0,
});
```

在其他元件中，你可以匯入這個全域狀態並使用它：

```svelte
<script lang="ts">
    import { counter } from './shared.svelte.js';

    function increment() {
        counter.count += 1;
    }
</script>

<button onclick={increment}>
    Count: {counter.count}
</button>
```

## 參考資料

- [Universal Reactivity - Basic Svelte](https://svelte.dev/tutorial/svelte/universal-reactivity)
- [Runes and Global state: do's and don'ts](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/)
