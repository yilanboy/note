# Motion (動態效果)

## Tweens

Svelte 提供了 `tweened` 這個函式，可以簡單的建立一個由 A 轉變至 B 的平滑動畫。

以下方的 progress bar 為例，使用點擊按鈕來改變 progress bar 的進度。可以發現進度條的變化有一個簡易的動畫效果。

```svelte
<script>
    import { tweened } from 'svelte/motion';

    const progress = tweened(0);
</script>

<progress value={$progress}></progress>

<button on:click={() => progress.set(0.5)}> 50% </button>

<button on:click={() => progress.set(1)}> 100% </button>
```

還可以使用 `svelte/easing` 來增加其他動畫效果。

```svelte
<script>
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    const progress = tweened(0, {
        duration: 400,
        easing: cubicOut,
    });
</script>
```

## Spring

`spring` 功能與 `tweened` 類似，提供了一種 Q 彈的效果動畫，`spring` 更適合時常變更值的場景。

```svelte
<script>
    import { spring } from 'svelte/motion';

    let coords = spring(
        { x: 50, y: 50 },
        {
            stiffness: 0.1,
            damping: 0.25,
        },
    );

    let size = spring(10);
</script>
```
