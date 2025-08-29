---
layout: default
parent: Svelte
nav_order: 1
---

# Svelte 5 的即時反應 (Reactivity)

Svelte 5 引入了 **runes** 來控制即時反應，使其更加明確和強大。核心概念是使用 `$state` 來宣告反應性狀態。

## 使用 `$state` 的基本即時反應

要創建一個反應性變數，你可以使用 `$state` 來初始化它。對此變數的任何更改都將自動觸發 DOM 的更新。

```svelte
<script>
  let count = $state(0);

  function increment() {
    count += 1;
  }
</script>

<button onclick={increment}>
  Clicked {count}
  {count === 1 ? 'time' : 'times'}
</button>
```

在 Svelte 5 中，即時反應不再是**基於賦值 (assignment)**。相反地，`$state` 創建了一個 Svelte 會追蹤的訊號 (signal)。當訊號的值發生變化時，Svelte 就會知道要更新什麼。

## 使用 `$derived` 的衍生狀態

有時候，你會希望某個狀態是依賴於其他狀態計算而來的。你可以使用 `$derived` 來創建一個計算值，當其依賴項發生變化時，它會自動重新計算。

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>

<button onclick={() => count++}>
  Count: {count}
</button>

<p>{count} doubled is {doubled}</p>
```

## 使用 `$effect` 來根據狀態變化執行程式碼

要在狀態變化時執行某些程式碼，你可以使用 `$effect`。這對於日誌記錄、數據獲取或與瀏覽器 API 互動等操作非常有用。當內部的反應性值發生變化時，`$effect` 裡的程式碼將會重新執行。

```svelte
<script>
  let count = $state(0);

	$effect(() => {
    // 每當 'count' 變化時，這段程式碼就會執行
		console.log(`The count is now ${count}`);

		if (count > 10) {
			alert(`Count is dangerously high!`);
		}
	});
</script>

<button onclick={() => count++}>
  Count: {count}
</button>
```

## 更新陣列和物件

有了 Svelte 5 的 runes，更新陣列和物件變得更加直觀。因為 `$state` 創建了深層的、具反應性的物件，所以你可以直接使用標準的變異方法，如 `.push()`、`.pop()`、`.splice()` 等，即時反應將如預期般運作。

你不再需要重新賦值變數來觸發更新。

```svelte
<script>
  let numbers = $state([1, 2, 3]);

  function addNumber() {
    // 這在 Svelte 5 中會觸發即時反應
    numbers.push(numbers.length + 1);
  }

  function removeLast() {
    // 這也同樣有效
    numbers.pop();
  }
</script>

<button onclick={addNumber}>
  Add a number
</button>

<button onclick={removeLast}>
  Remove last number
</button>

<p>Numbers: {numbers.join(', ')}</p>
```

與舊版 Svelte 相比，這大大簡化了狀態管理。
