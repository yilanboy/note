# Miscellaneous

## The `@debug` tag

除了可以使用 `console.log` 來 debug，Svelte 還提供了 `@debug` tag，可以用來觸發瀏覽器的 Debugger。

```svelte
<script>
    let foo = 'bar';
</script>

<!-- 暫停渲染並印出 foo 的值 -->
{@debug foo}
```
