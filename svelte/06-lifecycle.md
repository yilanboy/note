---
layout: default
parent: Svelte
nav_order: 6
---

# Lifecycle

每個 Component 都有自己的生命週期，當 Component 被建立、更新或銷毀時，會觸發不同的生命週期方法。

## onMount

`onMount` 方法會在 Component 被建立後觸發，我們可以在這個方法中做一些初始化的動作，例如：註冊事件監聽器、初始化一些資料等等。

```svelte
<script lang="ts">
    import { onMount } from 'svelte';

    onMount(() => {
        console.log('onMount');
    });
</script>
```

如果在 `onMount` 中回傳一個函式，這個函式會在 Component 卸載時被呼叫。

```svelte
<script lang="ts">
    import { onMount } from 'svelte';

    onMount(() => {
        console.log('onMount');

        return () => {
            console.log('onDestroy');
        };
    });
</script>
```

## onDestroy

`onDestroy` 方法會在 Component 卸載時觸發。

```svelte
<script lang="ts">
    import { onDestroy } from 'svelte';

    onDestroy(() => {
        console.log('onDestroy');
    });
</script>
```

## tick

Svelte 中並沒有 "after update" 的 Hook，但是你可以使用 `tick` 來實現類似的功能。

`tick` 與其他生命週期方法不同，你可以在任何地方呼叫它。它會回傳一個 promise，並且立刻將等待中的狀態更新套用到 DOM 上。

當你更新了 Component 的狀態 (state)，Svelte 其實並不會立刻更新 DOM，而是會在下一個 microtask 執行更新。這樣做的好處是可以將多次的資料更新合併成一次，以避免產生太多次的 DOM 更新。

```svelte
<script>
    import { tick } from 'svelte';

    let text = $state(`Select some text and hit the tab key to toggle uppercase`);

    // you have to use async functions
    async function handleKeydown(event) {
        if (event.key !== 'Tab') return;

        event.preventDefault();

        // `this` is the <textarea> element
        const { selectionStart, selectionEnd, value } = this;
        const selection = value.slice(selectionStart, selectionEnd);

        const replacement = /[a-z]/.test(selection)
            ? selection.toUpperCase()
            : selection.toLowerCase();

        text =
            value.slice(0, selectionStart) +
            replacement +
            value.slice(selectionEnd);

        // use tick to make sure the DOM has updated
        await tick();

        this.selectionStart = selectionStart;
        this.selectionEnd = selectionEnd;
    }
</script>

<textarea
    value={text}
    onkeydown={handleKeydown}
/>

<style>
    textarea {
        width: 100%;
        height: 100%;
        resize: none;
    }
</style>
```
