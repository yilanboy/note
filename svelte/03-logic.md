---
layout: default
parent: Svelte
nav_order: 3
---

# Logic

## If Blocks

在 Svelte 中，如果想要根據條件來決定要渲染哪個元件，可以使用 `if` 指令。

```svelte
<script>
    let count = $state(0);

    function increment() {
        count += 1;
    }
</script>

<button onclick={increment}>
    Clicked {count} {count === 1 ? 'time' : 'times'}
</button>

{#if count > 10}
    <p>Count is greater than 10</p>
{/if}
```

## Else Blocks

如果你想要在 `if` 指令的條件不成立時渲染一個元件，可以使用 `else` 指令。

```svelte
{#if count > 10}
    <p>Count is greater than 10</p>
{:else}
    <p>Count is between 0 and 10</p>
{/if}
```

> `#` 符號代表一個 block 的開始。
>
> `:` 符號代表延續一個 block。
>
> `/` 符號代表一個 block 的結束。

## Else If Blocks

如果想要在 `else` 上再加上一個判斷的話，可以使用 `if else`。

```svelte
{#if count > 10}
    <p>Count is greater than 10</p>
{:else if count < 0}
    <p>Count is less than 0</p>
{:else}
    <p>Count is between 0 and 10</p>
{/if}
```

## Each Blocks

如果想要根據陣列的內容來渲染一系列多個元件，可以使用 `each` 指令。

```svelte
<script>
    const color = ['red', 'green', 'blue'];
    let selected = color[0];
</script>

<div>
    {#each colors as color}
        <button
            aria-current={selected === color}
            aria-label="{color}"
            style="background-color: {color}"
            on:click={() => selected = color}
        >
        </button>
    {/each}
</div>
```

你可以將前面提到的 `...` 用在 `each` 上。

```svelte
{#each [...colors] as color}
    <button
        aria-current={selected === color}
        aria-label="{color}"
        style="background-color: {color}"
        on:click={() => selected = color}
    >
    </button>
{/each}
```

你可以在 `each` 中宣告第二個參數，代表當前迴圈的索引 (key)。

```svelte
{#each colors as color, i}
    <button
        aria-current={selected === color}
        aria-label="{color}"
        style="background-color: {color}"
        onclick={() => selected = color}
    >
        {i + 1}
    </button>
{/each}
```

## Keyed Each Blocks

默認情況下，當你修改 `each` 中的項目時，Svelte 會在 block 末尾添加和刪除項目。如果你想修改的並不是 block 末尾的項目，那麼修改的效果可能不會和你預期的一樣。

為了讓 Svelte 追蹤 `each` 中每個項目的變化，你可以提供一個 `key` 屬性。

```svelte
{#each items as item (item.id)}
    <div>{item.text}</div>
{/each}
```

注意 `key` 屬性必須是一個唯一的值，否則 Svelte 會拋出一個錯誤 `Cannot have duplicate keys in a keyed`。

## Await Blocks

大多數 Web 應用程序在某些時候都必須處理異步數據。 Svelte 可以輕鬆地直接在標記中等待 Promise 的值：

```svelte
{#await promise}
    <p>...waiting</p>
{:then number}
    <p>The number is {number}</p>
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}
```

如果你知道 promise 的結果不會改變，你可以省略 `catch`。

```svelte
{#await promise then value}
    <p>The value is {value}</p>
{/await}
```
