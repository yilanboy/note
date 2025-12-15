---
layout: default
parent: Svelte
nav_order: 4
---

# Events

## DOM Events

你可以在元素上監聽任何 DOM 事件，例如 `click`、`mouseover`、`submit` 等等。
並在事件觸發之後呼叫一個 function。

```svelte
<script>
let m = $state({ x: 0, y: 0 });

function handleMove(event) {
    m.x = event.clientX;
    m.y = event.clientY;
}
</script>


<div onpointermove={handleMove}>
    The mouse position is {m.x} x {m.y}
</div>
```

## Inline Handlers

你也可以在元素上使用 inline handlers。

```svelte
<div onpointermove={(event) => {
    m = { x: event.clientX, y: event.clientY };
}}>
    The mouse position is {m.x} x {m.y}
</div>
```

## Event Modifiers (已棄用)

> Event Modifiers 在 Svelte 5 中已經被棄用。

DOM 的 event handler 可以使用 event modifiers 來修改行為。

例如使用 `|once`，可以讓 event handler 只執行一次。

```svelte
<!-- 只有第一次點擊會有效果 -->
<button on:click|once={() => alert('clicked')}>
    Click me
</button>
```

此外還有 `|preventDefault` 可以阻止預設行為，`|stopPropagation` 可以阻止事件冒泡 ... 等。

event modifier 可以組合使用，例如 `on:click|once|preventDefault`。

## Event Modifiers (推薦)

想要修改 Event 的行為，你需要自己寫函式，並將你事件觸發的 Callback 函式包裝起來。

```svelte
<script lang="ts">
    function once(fn: ((event: Event) => unknown) | null) {
        return function (this: (event: Event) => unknown, event: Event) {
            if (fn) fn.call(this, event);
            fn = null;
        };
    }

    function preventDefault(fn: (event: Event) => unknown) {
        return function (this: (event: Event) => void, event: Event) {
            event.preventDefault();
            fn.call(this, event);
        };
    }
</script>

<button onclick={once(preventDefault(handler))}>...</button>
```

> 所謂的事件冒泡 (event bubbling)，是指當一個元素觸發了某個事件，該事件會一層一層往上傳遞到父元素，直到傳遞到 `document` 為止。

## Component Events

你可以在 component 上觸發事件。

假設我們有一個 `Inner.svelte` component，他的內容如下：

```svelte
<!-- Inner.svelte -->
<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function sayHello() {
        dispatch('message', {
            text: 'Hello!'
        });
    }
</script>

<button onclick={sayHello}>
    Click to say hello
</button>
```

我們可以在 `App.svelte` 中使用 `Inner` component，並在 `Inner` component 觸發 `message` 事件。

```svelte
<!-- App.svelte -->
<script>
    import Inner from './Inner.svelte';

    function handleMessage(event) {
        // event.detail.text is 'Hello!'
        alert(event.detail.text);
    }
</script>

<Inner on:message={handleMessage} />
```

## Event Forwarding

與 DOM 事件不同，component 事件不會冒泡。如果監聽的事件，在很深層的 component 中，那你必須將事件一層一層的傳遞到上層 component。

```svelte
<!-- 最底層的 Inner.svelte -->
<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function sayHello() {
        dispatch('message', {
            text: 'Hello!'
        });
    }
</script>

<button on:click={sayHello}>
    Click to say hello
</button>
```

然後是中間要幫忙傳遞事件的 `Outer.svelte`。

```svelte
<!-- 中間層的 Outer.svelte -->
<script>
    import Inner from './Inner.svelte';
</script>

<Inner on:message />
```

最後是最上層要接收事件的 `App.svelte`。

```svelte
<!-- 最上層的 App.svelte -->
<script>
    import Outer from './Outer.svelte';

    function handleMessage(event) {
        // event.detail.text is 'Hello!'
        alert(event.detail.text);
    }
</script>

<Outer on:message={handleMessage} />
```

Event forwarding 對於 DOM 事件也同樣可以用。

```svelte
<!-- PushButton.svelte -->
<button on:click>
    Push
</button>
```

```svelte
<!-- App.svelte -->
<script>
    import PushButton from './PushButton.svelte';

    function handlePush() {
        alert('button was pushed');
    }
</script>

<PushButton on:click={handlePush} />
```
