# Transition

Svelte 的 `transition` 可以為元素的變化提供一個簡單的效果。

```svelte
<script>
    import { fade } from 'svelte/transition';
    let visible = true;
</script>

<label>
    <input type="checkbox" bind:checked={visible} />
    visible
</label>

{#if visible}
    <!--  transition:fade 會讓字體的出現與消失有一個淡進與淡出的效果 -->
    <p transition:fade>Fades in and out</p>
{/if}
```

## 加入變數控制動畫效果

`transition` 中的 `fly` 可以讓元素從一個位置飛到另一個位置，我們使用變數來設定飛過去的位置。

```svelte
<script>
    import { fly } from 'svelte/transition';
    let visible = true;
</script>

<label>
    <input type="checkbox" bind:checked={visible} />
    visible
</label>

{#if visible}
    <!-- 當元素消失時向下飛動並漸漸消失，元素出現時則反過來 -->
    <p transition:fly={{ y: 200, duration: 2000 }}>Fades in and out</p>
{/if}
```

## In and Out

你可以讓元素在出現時有一個效果，在消失時有另一個效果。

```svelte
<script>
    import { fade, fly } from 'svelte/transition';
    let visible = true;
</script>

<label>
    <input type="checkbox" bind:checked={visible} />
    visible
</label>

{#if visible}
    <!-- 元素出現時會由下往上飛出，但消失時是簡單的淡出 -->
    <p in:fly={{ y: 200, duration: 2000 }} out:fade>Flies in and out</p>
{/if}
```

## 客製化自己的動畫

你可以自訂自己的動態效果，例如剛剛使用的 `fade`，他的函式其實長這個樣子：

```js
function fade(node, { delay = 0, duration = 400 }) {
    // 取得傳入元素 node 的透明度
    // + 為 unary operator，可以將字串轉為數字
    const o = +getComputedStyle(node).opacity;

    // 回傳的物件可以有以下屬性：
    // delay: 延遲多久後開始動畫
    // duration: 動畫的持續時間
    // easing: 緩動效果，調整數值變化的速度
    // css: 動畫的效果
    return {
        delay,
        duration,
        // t 為 0 ~ 1 之間的數字，代表動畫的進度
        // 當動畫是 in 時，t 會從 0 到 1
        // 當動畫是 out 時，t 會從 1 到 0
        css: (t) => `opacity: ${t * o}`,
    };
}
```

## 使用 JavaScript 來客製動畫

雖然 CSS 可以做出很多動畫效果，但有些效果還是需要 JavaScript 來實現，例如打字機的效果。

```svelte
<script>
    let visible = false;

    function typewriter(node, { speed = 1 }) {
        const valid =
            node.childNodes.length === 1 &&
            node.childNodes[0].nodeType === Node.TEXT_NODE;

        if (!valid) {
            throw new Error(
                `This transition only works on elements with a single text node child`,
            );
        }

        const text = node.textContent;
        const duration = text.length / (speed * 0.01);

        return {
            duration,
            tick: (t) => {
                const i = Math.trunc(text.length * t);
                node.textContent = text.slice(0, i);
            },
        };
    }
</script>

<label>
    <input type="checkbox" bind:checked={visible} />
    visible
</label>

{#if visible}
    <p transition:typewriter>The quick brown fox jumps over the lazy dog</p>
{/if}
```

## 動畫觸發事件

在動畫的進行過程中，你可以觸發一些事件，例如在動畫開始時觸發 `onstart` 事件，在動畫結束時觸發 `onend` 事件。

```svelte
<p
    transition:fly={{ y: 200, duration: 2000 }}
    on:introstart={() => (status = 'intro started')}
    on:outrostart={() => (status = 'outro started')}
    on:introend={() => (status = 'intro ended')}
    on:outroend={() => (status = 'outro ended')}
>
    Flies in and out
</p>
```

## Key Blocks

Key blocks 可以讓你追蹤值的變化，來摧毀並重新建立元素。
這個功能可以用在當你想根據值的變化來套用動畫，而不是只有元素出現與消失時才使用動畫。

```svelte
<!-- 只要 i 發生變化，key block 中的元素就會被刪除並重新建立 -->
{#key i}
    <p in:typewriter={{ speed: 5 }}>
        {messages[i] || ''}
    </p>
{/key}
```

## Deferred transitions

當你的元素會從一個位置移動到另外一個位置時，可以使用 `crossfade` 來提供一個移動的效果。

`crossfade` 會回傳 `send` 與 `receive` 兩個函式，分別用來設定元素的移動效果。

```javascript
// transition.js
import { crossfade } from 'svelte/transition';
import { quintOut } from 'svelte/easing';

export const [send, receive] = crossfade({
    duration: (d) => Math.sqrt(d * 200),

    fallback(node, params) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;

        return {
            duration: 600,
            easing: quintOut,
            css: (t) => `
        transform: ${transform} scale(${t});
        opacity: ${t}
      `,
        };
    },
});
```

以常見的 Todo List 為例子，當你勾選一個項目時，該項目會有一個移動的效果，將項目移動到已完成的項目列表中。

```svelte
<script>
    import { send, receive } from './transition.js';

    // ...
</script>

<!-- ... -->

<li
    class:done
    in:receive={{ key: todo.id, duration: 400 }}
    out:send={{ key: todo.id, duration: 400 }}
>
    <!-- ... -->
</li>
```
