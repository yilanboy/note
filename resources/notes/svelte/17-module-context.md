# Module Context

## Sharing Data Between Components

在很少的情況下，你需要在不同的元件之間共享數據。

假設你有一個音樂播放元件，當你的畫面上有多個播放元件時，你會希望同一時間只有一個元件在播放音樂。
這就代表當我們在一個元件中點擊播放時，我們需要通知其他元件停止播放。

我們可以使用 `<script context="module">` 來做到。

```svelte
<!-- Player.svelte -->
<!-- 這段 script 只會執行一次，且會在元件初始化之前執行 -->
<!-- 所有元件都會使用一樣的 current -->
<script context="module">
    let current;
</script>

<!-- ... -->

<audio
    {src}
    bind:currentTime={time}
    bind:duration
    bind:paused
    on:play={(e) => {
        // 取得當前播放音樂的元素
        const audio = e.currentTarget;

        // 如果要播放音樂的元素與 current 變數存放的元素不同，則暫停 current 元素播放的音樂
        if (audio !== current) {
            current?.pause();
            // 將當前播放音樂的元素放到 current 變數中
            current = audio;
        }
    }}
    on:ended={() => {
        time = 0;
    }}
/>
```

## Exports

你可以將元件中的方法，透過 `export` 關鍵字將其公開給其他元件使用。

```svelte
<!-- Player.svelte -->
<script context="module">
    let current;

    export function stopAll() {
        current?.stop();
    }
</script>

<!-- ... -->
```

```svelte
<!-- App.svelte -->
<script>
    import Player, { stopAll } from './Player.svelte';

    // ...
</script>

<!-- ... -->

<button on:click={stopAll}> Stop All </button>
```
