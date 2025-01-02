---
layout: default
parent: Svelte
nav_order: 13
---

# Classes and Styles

## Class Directive

你可以根據一個值來添加或移除一個元素的 class。

> 現在這個方式已經不推薦了，建議使用 Class Attributes

```svelte
<script>
    let active = true;

    function toggle() {
        active = !active;
    }
</script>

<button
    type="button"
    class="button {active ? 'active' : ''}"
    on:click={toggle}
>
    I'm a button
</button>

<style>
    button .active {
        background-color: #ff0;
    }
</style>
```

你也可以將其拆開成兩個屬性：

```svelte
<button
    type="button"
    class="button"
    class:active={active}
    on:click={toggle}
>
    I'm a button
</button>
```

如果變數的名稱與 class 的名稱相同，你可以使用 `class:active` 來簡化：

```svelte
<button
    type="button"
    class="button"
    class:active
    on:click={toggle}
>
    I'm a button
</button>
```

## Class Attributes

Svelte 在 5.16 加入了 Class Attributes 這個新功能，
你可以在 `class` 中使用 Object 或是 Array，然後根據條件動態調整 Class Name。

如果你有多個 Class Name 需要根據條件動態調整。
過去使用 Class Directive 可以這樣寫。

```svelte
<button
    type="button"
    class="button"
    class:active={active}
    class:bg-green-500={active}
    class:deactive={!active}
    class:bg-gray-200={!active}
    on:click={toggle}
>
    I'm a button
</button>
```

上面的寫法可以改為使用 Class Attributes 來精簡。

```svelte
<button
    type="button"
    class={{
        button: true,
        'active bg-green-500': active,
        'deactive bg-gray-200': !active,
    }}
    on:click={toggle}
>
    I'm a button
</button>
```

上面的寫法是使用 Object，如果要使用 Array 也可以。

```svelte
<button
    type="button"
    class={[
        true && 'button',
        active && 'active bg-green-500',
        !active && 'deactive bg-gray-200',
    ]}
    on:click={toggle}
>
    I'm a button
</button>
```

> 我個人認為 Object 寫法較為好懂。

## Style Directive

同樣的方式也可以使用在 style 上：

```svelte
<script>
    let isRed = true;
</script>

<div style="color: {isRed ? 'red' : ''}">
    This will be red
</div>

<div
    style:color={isRed ? 'red' : ''}
>
    This will be red too
</div>
```

## Component Styles

你可以傳入一個 CSS 變數來設定元件的樣式：

```svelte
<!-- App.svelte -->
<Box --color="red" />
```

```svelte
<!-- Box.svelte -->
<div class="box" />

<style>
    .box {
        width: 5em;
        height: 5em;
        border-radius: 0.5em;
        margin: 0 0 1em 0;
        /* 這裡接收外部傳入 Box component 的 CSS 變數 --color */
        background-color: var(--color, #ccc);
    }
</style>
```
