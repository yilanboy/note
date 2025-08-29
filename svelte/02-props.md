---
layout: default
parent: Svelte
nav_order: 2
---

# Props

## Declaring Props

如果你需要將變數從父元件傳遞到子元件，你可以在子元件使用 `$props` 關鍵字來宣告子元件的 Props：

```svelte
<script>
  let { name } = $props;
</script>
```

然後你就可以在父元件中使用 `name="world"` 將 `world` 傳入子元件中：

```svelte
<script>
    import Nested from './Nested.svelte';
</script>

<Nested name="world" />
```

## Default Values

你可以在宣告 Props 的時候指定預設值：

```svelte
<script>
  let { name = 'world' } = $props;
</script>
```

## Spread Props

假設我們有一個元件叫做 `PackageInfo`，它有四個 Props：`name`、`speed`、`version`、`website`。

```svelte
<script>
  let { name, speed, version, website } = $props;

  let href = $derived(`https://www.npmjs.com/package/${name}`);
</script>

<p>
    The <code>{name}</code> package is {speed} fast. Download version {version} from
    <a {href}>npm</a> and <a href={website}>learn more here</a>
</p>
```

你可以使用下面的方式將這四個 Props 傳入子元件：

```svelte
<script>
  import PackageInfo from './PackageInfo.svelte';

  const pkg = {
    name: 'svelte',
    speed: 'blazing',
    version: 4,
    website: 'https://svelte.dev'
  };
</script>

<PackageInfo
    name={pkg.name}
    speed={pkg.speed}
    website={pkg.website}
/>
```

也可以使用 `...` 來將物件的所有屬性傳入子元件：

```svelte
<PackageInfo {...pkg} />
```
