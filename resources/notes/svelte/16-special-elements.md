# Special Elements

Svelte 有提供一些特別元素，用來幫助你更好的建置前端應用程式。

## `<svelte:self>`

一個元件是無法在自己的模板中引用自己的，但是你可以使用 `<svelte:self>` 來代替。

常見的例子是顯示如樹狀結構般的資料夾與檔案。
因為資料夾底下可能有另外一個資料夾，這代表資料夾的元件，底下可能還需要一個資料夾元件。

我們在元件中無法引入自身，但可以使用 `<svelte:self>`。

```svelte
<!-- Folder.svelte -->

{#if file.files}
    <!-- 使用 svelte:self 代表自己  -->
    <svelte:self {...file} />
{:else}
    <File {...file} />
{/if}
```

## `<svelte:component>`

`<svelte:component>` 元素可以讓你在 runtime 時，動態的載入元件。

```svelte
<script>
    import Foo from './Foo.svelte';
    import Bar from './Bar.svelte';

    let component = Foo;
</script>

<!-- 這邊會顯示 Foo 元件 -->
<svelte:component this={component} />
```

## `<svelte:element>`

與 `<svelte:component>` 類似， `<svelte:element>` 元素可以讓你在 runtime 時，動態的載入 HTML 元素。

```svelte
<script>
    let element = 'div';
</script>

<!-- 這邊會顯示 div 元素 -->
<svelte:element this={element}>Hello!</svelte:element>
```

## `<svelte:window>`

`<svelte:window>` 可以讓你將事件監聽器加到 `window` 物件上。

```svelte
<script>
    function handleKeydown(event) {
        console.log(event.key);
    }
</script>

<svelte:window on:keydown={handleKeydown} />
```

## `<svelte:window>` Bindings

`<svelte:window>` 也可以使用 `bind` 來綁定某些屬性，例如 `scrollY`。

```svelte
<script>
    let y = 0;
</script>

<!-- 使用 bind:scrollY 綁定滾動條的值 -->
<svelte:window bind:scrollY={y} />
```

## `<svelte:body>`

`<svelte:body>` 可以讓你將事件監聽器加到 `document.body` 物件上。

```svelte
<svelte:body
    on:mouseenter={() => (showCat = true)}
    on:mouseleave={() => (showCat = false)}
/>
```

## `<svelte:document>`

`<svelte:document>` 可以讓你監聽 document 物件的事件，例如 `selectionchange`。

```svelte
<svelte:document on:selectionchange={handleSelectionChange} />
```

## `<svelte:head>`

`<svelte:head>` 可以讓你在 `<head>` 中插入新的元素。

```svelte
<svelte:head>
    <link rel="stylesheet" href="/stylesheets/{selected}.css" />
</svelte:head>
```

> 在伺服器端渲染 (SSR) 模式下，`<svelte:head>` 的內容將與 HTML 的其餘部分分開傳回。

## `<svelte:options>`

`<svelte:options>` 可以讓你調整 Svelte 編譯時的設定。

你可以設定一個元件的 immutable 屬性，當 immutable 設定為 `true` 時，
如果元件內部的值更新，他就會將元件刪除並重新建立元件，而非單純更新元件內的元素：

```svelte
<!-- 通常會放在元件的最上面 -->
<svelte:options immutable />
```

## `<svelte:fragment>`

`<svelte:fragment>` 元素可讓你將內容放置在 slot 中，但不需要將其包裝在容器 DOM 元素中。

```svelte
<!-- 一般的 slot 用法 -->
<!-- 會連 <div slot="box"> 都一起被放入元件的 <slot name="box"> 中 -->
<div slot="box">
    <h2>Box</h2>
    <span>This is a box</span>
</div>

<!-- 使用 <svelte:fragment> -->
<!-- 只會將 <h2> 與 <span> 放入元件的 <slot name="box"> 中 -->
<svelte:fragment slot="box">
    <h2>Box</h2>
    <span>This is a box</span>
</svelte:fragment>
```
