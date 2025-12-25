---
layout: default
parent: Svelte
nav_order: 21
---

# Forwarding Attributes

在 Laravel 中，我們可以使用 `$attributes` 來接收任何寫在 Component 上的屬性。

```blade
{{-- button.blade.php --}}
<button {{ $attributes }}>Click me</button>
```

任何寫在 Component 上的屬性，都會被 `$attributes` 接收。

```blade
<x-button
    id="button"
    name="button"
    class="btn btn-primary"
    type="button"
>
    Click me
</x-button>
```

在 Svelte 中也可以使用 `HTMLInputAttributes` Type 來接收所有寫在 Component 上的屬性。

```svelte
<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  // 建立一個 interface，繼承 HTMLInputAttributes，並新增 label 和 id
  // 這代表 label 和 id 是必填的，其他屬性則繼承 HTMLInputAttributes
  interface Props extends HTMLInputAttributes {
    label: string;
    id: string;
    name: string;
    type?: string;
    value?: string;
  }

  // 接收所有 props，並解構出 label、id、type、value 和其他屬性
  let { label, id, name, type = "text", value = $bindable(""), ...rest }: Props = $props();
</script>

<div>
  <label for={id} class="block text-base font-medium text-gray-900">
    {label}
  </label>
  <div class="mt-2">
    <!-- 將 id、name、type、value 和其他屬性傳遞給 input -->
    <!-- 其中 value 是 bindable 的 -->
    <input
      {id}
      {name}
      {type}
      bind:value
      {...rest}
      class="block w-full rounded-md bg-zinc-50 px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
    />
  </div>
</div>
```
