# Component Composition

## Slots

你可以使用 `<slot />` 來定義一個 component 的內容：

```svelte
<!-- Card.svelte -->
<div class="card">
    <slot />
</div>
```

```svelte
<!-- App.svelte -->
<Card>
    <h2>Hello!</h2>
    <p>It's a beautiful day.</p>
</Card>
```

## Named Slots

你可以使用 `slot="name"` 來定義一個有名稱的 slot，將元素放在 component 的指定位置：

```svelte
<!-- Card.svelte -->
<div class="card">
    <slot name="header" />

    <slot />
</div>
```

```svelte
<!-- App.svelte -->
<Card>
    <h2 slot="header">This is a header</h2>

    <h2>Hello!</h2>
    <p>It's a beautiful day.</p>
</Card>
```

## Slot Fallbacks

Slot 也可以有預設內容。當外部沒有傳入內容，就直接使用預設內容：

```svelte
<!-- Card.svelte -->
<div class="card">
    <slot name="header">
        <h2>Default header</h2>
    </slot>

    <slot />
</div>
```

## Slot Props

Slot 可以設定屬性：

```svelte
<!-- Card.svelte -->
<div class="card">
    <slot {item} />
</div>
```

```svelte
<script>
    let isRed = true;
</script>

<!-- App.svelte -->
<Card let:item={isRed}>
    <h2 style:color={isRed ? 'red' : ''}>Hello!</h2>
</Card>
```

## Checking for Slot Content

你可以根據 slot 是否有傳入內容，來決定要不要顯示元件的內容：

```svelte
<!-- 如果沒有使用 slot="header" 傳入內容，下面的區塊就不顯示了 -->
{#if $$slots.header}
    <div class="header">
        <slot name="header" />
    </div>
{/if}
```
