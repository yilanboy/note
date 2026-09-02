# Actions

Actions 本質上是元素級生命週期 (element-level lifecycle) 的函式，會在元素被建立時呼叫。常常用在

- 第三方庫的整合
- 圖片的惰性載入
- 工具提示 (tooltips)
- 新增自訂事件處理程序

## `use:` 語法

```svelte
<script>
    /** @type {import('svelte/action').Action}  */
    function foo(node) {
        // the node has been mounted in the DOM

        return {
            destroy() {
                // the node has been removed from the DOM
            },
        };
    }
</script>

<!-- 當元素被建立時，就會呼叫 foo 函式 -->
<!-- 當元素被刪除時，就會呼叫 foo 函式回傳的 destroy() -->
<div use:foo />
```

## 加入變數

Actions 也可以傳入變數。下方是一個整合 tippy.js 的例子：

```svelte
<script>
    import tippy from 'tippy.js';
    import 'tippy.js/dist/tippy.css';
    import 'tippy.js/themes/material.css';

    let content = 'Hello!';

    function tooltip(node, options) {
        // { content: 'Hello!', theme: 'material'}
        console.log(options);

        const tooltip = tippy(node, options);

        return {
            destroy() {
                tooltip.destroy();
            },
        };
    }
</script>

<input bind:value={content} />

<button use:tooltip={{ content, theme: 'material' }}> Hover me </button>
```
