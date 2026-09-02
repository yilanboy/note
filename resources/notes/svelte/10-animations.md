# Animations

剛剛的 `crossfade` 雖然可以讓 Todo List 在勾選項目時有移動的效果，但其他項目的遞補移動卻沒有。

這時候我們可加上 `flip` 來讓其他項目的遞補移動也有動畫效果。

```svelte
<script>
    import { flip } from 'svelte/transition';

    // ...
</script>

<!-- ... -->

<li
    class:done
    in:receive={{ key: todo.id }}
    out:send={{ key: todo.id }}
    animate:flip={{ duration: 300 }}
>
    <!-- ... -->
</li>
```

> 請注意，所有動畫都是透過 CSS 應用的，而不是 JavaScript，這意味著它們不會阻塞（或被阻塞）主執行緒。
