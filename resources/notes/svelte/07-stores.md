# Stores

有時候你會想要在不同的 component 之間共享一個值，這時候你可以使用 store。

## Writeable Store

在 Svelte 中，store 是一個簡單的物件，並擁有一個訂閱 `subscribe` 的方法，當 store 的值改變時，所有訂閱它的 component 都會被通知到。

首先新增一個 `stores.js` 檔案，並且在裡面建立一個 store。

```js
// stores.js
import { writable } from 'svelte/store';

export const count = writable(0);
```

接下來建立一個幫 `count` +1 的 component。

```svelte
<!-- Increment.svelte -->
<script>
    import { count } from './stores.js';

    function increment() {
        count.update((n) => n + 1);
    }
</script>

<button on:click={increment}> + </button>
```

建立一個幫 `count` -1 的 component。

```svelte
<!-- Decrement.svelte -->
<script>
    import { count } from './stores.js';

    function decrement() {
        count.update((n) => n - 1);
    }
</script>

<button on:click={decrement}> - </button>
```

接著在 `App.svelte` 中引入 increment 與 decrement 的 component，並顯示 `count` 的值。

```svelte
<script>
    import { count } from './stores.js';
    import Increment from './Increment.svelte';
    import Decrement from './Decrement.svelte';

    let count_value;

    count.subscribe((value) => {
        count_value = value;
    });
</script>

<h1>The count is {count_value}</h1>

<Increment />
<Decrement />
```

## Auto-Subscriptions

上面的例子有個潛在的問題，如果在 component 被銷毀之前沒有取消訂閱，那麼就會導致 memory leak。

我們可以使用 `onDestroy` 來取消訂閱。

```svelte
<script>
    import { onDestroy } from 'svelte';
    import { count } from './stores.js';

    // ...

    let count_value;

    const unsubscribe = count.subscribe((value) => {
        count_value = value;
    });

    onDestroy(unsubscribe);
</script>
```

> 呼叫 subscribe 方法會回傳一個 unsubscribe 方法，可以用來取消訂閱。

每次取消訂閱都要呼叫 `unsubscribe` 這個方法，這樣做很麻煩，所以 Svelte 提供了 `auto-subscriptions` 的功能，只要在 `subscribe` 前面加上 `$` 符號，就可以自動取消訂閱。

```svelte
<script>
    import { count } from './stores.js';

    // ...
</script>

<h1>The count is {$count}</h1>

<!-- ... -->
```

> Svelte 會禁止使用者在命名變數時使用 `$` 符號當作前綴。

## Readable Store

除了 writable store 之外，Svelte 還提供了 readable store，readable store 只能被訂閱，不能被更新。

例如顯示時間的 store，通常是不允許被修改的。

```js
// stores.js

import { readable } from 'svelte/store';

// new Date() is the initial value, you can set it null or undefined
// the start function is called when the store get its first subscriber
export const time = readable(new Date(), function start(set) {
    const interval = setInterval(() => {
        set(new Date());
    }, 1000);

    // the stop function is called when the last subscriber unsubscribes
    return function stop() {
        clearInterval(interval);
    };
});
```

```svelte
<script>
    import { time } from './stores.js';
</script>

<h1>The time is {$time.toLocaleTimeString()}</h1>
```

## Derived Store

你可以根據其他 store 的值來計算出一個新的 store，這種 store 叫做 derived store。

```js
// stores.js

import { readable, derived } from 'svelte/store';

export const time = readable(new Date(), function start(set) {
    const interval = setInterval(() => {
        set(new Date());
    }, 1000);

    return function stop() {
        clearInterval(interval);
    };
});

const start = new Date();

// create a new store that is derived from the time store
export const elapsed = derived(time, ($time) =>
    Math.round(($time - start) / 1000),
);
```

## Custom Stores

只要物件有 `subscribe` 方法，就可以被當作 store 使用。
除此之外，你也可以在物件中加入你自己的方法。

```js
// stores.js

import { writable } from 'svelte/store';

function createCount() {
    const = { subscribe, set, update } = writable(0);

    return {
        subscribe,
        increment: () => update(n => n + 1),
        decrement: () => update(n => n - 1),
        reset: () => set(0)
    };
}

export const count = createCount();
```

```svelte
<script>
    import { count } from './stores.js';
</script>

<h1>The count is {$count}</h1>

<button on:click={count.increment}>+</button>
<button on:click={count.decrement}>-</button>
<button on:click={count.reset}>reset</button>
```

## Store Binding

你可以將 store 綁定到 DOM 元素上，這樣當 store 的值改變時，DOM 元素的值也會跟著改變，反之亦然。

```svelte
<script>
    import { name } from './stores.js';
</script>

<h1>Hello {$name}!</h1>

<input bind:value={$name} />

<button on:click={() => ($name += '!')}> Add exclamation mark! </button>
```
