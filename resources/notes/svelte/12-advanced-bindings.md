# Advanced-bindings

## Contenteditable bindings

當元素有 `contenteditable` 屬性時，可以使用 `bind:innerHTML` 來綁定內容。

```svelte
<script>
    let html = '<p>hello world!</p>';
</script>

<div bind:innerHTML={html} contenteditable />
```

## Each Block Bindings

你可以在 `each` 迴圈中使用 `bind` 來綁定迭代的值。

```svelte
{#each todos as todo, i}
    <input bind:value={todo.text} />
{/each}
```

> 注意當修改元素中的值時，用來迭代的原始陣列也會被修改。

## Media

Svelte 在 `<audio>` 和 `<video>` 元素上提供了 7 個唯讀性綁定：

- `duration`：影片的總時長（以秒為單位）
- `buffered`：一個包含 `{ start, end }` 物件的陣列
- `seekable`：同上
- `played`：同上
- `seeking`：boolean 值
- `ended`：boolean 值
- `readyState`：0 到 4（含）之間的數字

與 5 個雙向 (two-ways) 綁定：

- `currentTime`：影片目前的時間點，以秒為單位
- `playbackRate`：影片的播放速度，1 為正常速度
- `paused`：暫停 (英文這裡說到 self-explanatory，意指不言自明)
- `volume`：音量，為 0 到 1（含）之間的數字
- `muted`：靜音，boolean 值，true 時為靜音

此外，`<video>` 還有 `videoWidth` 與 `videoHeight` 這兩種綁定。

## Dimensions (尺寸)

所有 block 元素都有 `clientWidth` 與 `clientHeight` 這兩種唯讀綁定。

```svelte
<script>
    let w;
    let h;
    let size = 42;
    let text = 'edit this text';
</script>

<label>
    <input type="range" bind:value={size} min="10" max="100" />
    font size ({size}px)
</label>

<div bind:clientWidth={w} bind:clientHeight={h}>
    <span style="font-size: {size}px" contenteditable>{text}</span>
    <span class="size">{w} x {h}px</span>
</div>
```

> 這個做法會需要一些額外的計算，因此不建議在大量的元素上使用。

## This

可以使用 `this` 綁定來指定某個元素。

```svelte
<script>
    let canvas;

    onMount(() => {
        // "hi"
        console.log(canvas.getAttribute('say'));
    });

    // ...
</script>

<canvas say="hi" bind:this={canvas} />
```

> 變數 `canvas` 會保持 `undefined` 直到綁定的元素被頁面載入。

## Component bindings

你可以在元件上使用 `bind` 來綁定元件的屬性。

```svelte
<Keypad bind:value={pin} on:submit={handleSubmit} />
```

```svelte
<!-- Keypad.svelte -->
<script>
    export let value = '';

    // ...
</script>

<!-- ... -->
```

> 使用 Svelte 的元件綁定時要謹慎，如果使用過多，尤其是在沒有「唯一數據來源」的情況下，可能會很難追蹤應用程式中資料的流動。

## Binding to Component Instances

你可以在元件上使用 `bind:this` 來綁定元件的實例。

```svelte
<!-- Canvas.svelte -->
<script>
    // ...

    function clear() {
        // ...
    }
</script>
```

```svelte
<!-- App.svelte -->
<script>
    import Canvas from './Canvas.svelte';

    let canvas;

    // ...
</script>

<Canvas bind:this={canvas} />

<!-- ... -->

<button on:click={() => canvas.clear()}> clear </button>
```
