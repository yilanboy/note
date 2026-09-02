# Bind

## Text Inputs

在 Svelte 中，可以使用 `bind` 將一個變數與一個 `<input>` 的 value 屬性綁定在一起。

```svelte
<script>
    let name = 'world';
</script>

<input bind:value={name} placeholder="Enter your name" />

<h1>Hello {name}!</h1>
```

當我們在 `<input>` 中輸入文字時，`name` 這個變數的值也會跟著改變。
而反過來也是，當我們改變 `name` 這個變數的值時，`<input>` 中的文字也會跟著改變。

## Numeric Inputs

Svelte 的 `bind` 會自動將 `<input>` 類型為 `type="number"` 與 `type="range"` 的輸入值轉換成數值。

> 在 DOM 中，所有數值都是字串。

```svelte
<script>
    let a = 1;
    let b = 2;
</script>

<label>
    <input type="number" bind:value={a} min="0" max="10" />
    <input type="range" bind:value={a} min="0" max="10" />
</label>

<label>
    <input type="number" bind:value={b} min="0" max="10" />
    <input type="range" bind:value={b} min="0" max="10" />
</label>

<p>{a} + {b} = {a + b}</p>
```

## Checkbox Inputs

在 DOM 中，checkbox 常用在兩個狀態間切換。
Svelte 中也提供 `bind` 來綁定 checkbox 的 checked 屬性。

```svelte
<script>
    let isChecked = false;
</script>

<input type="checkbox" bind:checked={isChecked} />
```

## Select Bindings

我們也可以使用 `bind:value` 將值綁定在 `<select>` 元素上。

```svelte
<script>
    let selected;

    let items = [
        { id: 1, name: 'one' },
        { id: 2, name: 'two' },
        { id: 3, name: 'three' },
    ];
</script>

<select
    bind:value={selected}
    on:change={() => console.log(`selected: ${selected.name}`)}
>
    {#each items as item}
        <!-- note the <option> values are objects, rather than strings. Svelte doesn't mind -->
        <option value={item}>{item.name}</option>
    {/each}
</select>
```

## Group Inputs

如果你有多個 `type="radio"` 與 `type="checkbox"` 相關於同一個變數，你可以使用 `bind:group` 來綁定。

```svelte
<script>
    let scoops = 1;
</script>

{#each [1, 2, 3] as number}
    <label>
        <input type="radio" name="scoops" value={number} bind:group={scoops} />

        {number}
        {number === 1 ? 'scoop' : 'scoops'}
    </label>
{/each}
```

## Select Multiple

有時候 `<select>` 可以讓使用者選擇多個選項，這時候使用 `bind:value` 來綁定一個陣列。
並在 `<select>` 中使用 `multiple` 屬性。

```svelte
<script>
    let flavours = [];
</script>

<select multiple bind:value={flavours}>
    {#each ['cookies and cream', 'mint choc chip', 'raspberry ripple'] as flavour}
        <option>{flavour}</option>
    {/each}
</select>
```

## Textarea Inputs

與一般的 `input` 類似。你也可以在 `textarea` 上使用 `bind:value`。

```svelte
<script>
    let message = '';
</script>

<textarea bind:value={message} placeholder="Enter a message"></textarea>
```
