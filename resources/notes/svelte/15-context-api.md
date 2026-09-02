# Context API

## `setContext` and `getContext`

Context API 為元件提供了一種相互「對話」的機制，無需將資料和函數作為 props 傳遞，也無需調度大量事件。

```svelte
<!-- ComponentA.svelte -->
<script>
    import { setContext } from 'svelte';

    setContext('componentA', {
        sayHello,
    });

    function sayHello() {
        alert('hello!');
    }
</script>
```

```svelte
<!-- ComponentB.svelte -->
<script>
    import { getContext } from 'svelte';

    function useAnotherComponentSayHello() {
        getContext('componentA').sayHello();
    }
</script>

<button on:click={useAnotherComponentSayHello}> Say hello </button>
```
