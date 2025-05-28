---
layout: default
parent: TypeScript
nav_order: 2
---

# Interface 與 Type 在 TypeScript 中的差異

在 TypeScript 中，你可以用 `interface` 和 `type` 這兩個關鍵字，來定義一個自己的類別。

```typescript
interface Person {
  name: string;
  age: number;
}

const person: Person = {
  name: "John",
  age: 30,
};
```

有趣的是，除了 `interface`，你也可以使用 `type` 做到一樣的事情。

```typescript
type Person = {
  name: string;
  age: number;
};

const person: Person = {
  name: "John",
  age: 30,
};
```

那麼問題就來了，這兩個關鍵字有什麼差別？

## 對於組合類型處理的不同

在寫程式的時候，你一定會碰到一種情況，就是組合不同的類型。以其他語言來形容的話，就好像一個類別需要實作多個介面。

什麼是組合兩個以上的類型？請看下面的範例：

```typescript
interface Foo {
  id: number;
}

interface Bar {
  name: string;
}

// 組合不同介面形成一個新的介面
interface FooBar extends Foo, Bar {}

const foobar: FooBar = {
  id: 1,
  name: "John",
};
```

上面的程式也可以改用 `type` 來寫。

```typescript
type Foo = {
  id: number;
};

type Bar = {
  name: string;
};

type FooBar = Foo & Bar;

const foobar: FooBar = {
  id: 1,
  name: "John",
};
```

這樣看起來 `interface` 與 `type` 好像真的沒有什麼不同，但實際上，兩者對於組合類型的處理還是有一些差異。
舉一個笨笨的例子，假設要組合的多個類型中，**它們同時有著同樣名稱但類型不同的屬性**，會發生什麼事情？

```TypeScript
interface Foo {
  id: number;
}

interface Bar {
  id: string;
}

// Foo 與 Bar 有著同樣的屬性 id，但類型卻不相同
// 這樣組合起來會發生什麼事情呢？
interface FooBar extends Foo, Bar {}
```

TypeScript 編譯器會很直接的跟你說請不要做這種笨笨的事情。

```text
ts: Interface 'FooBar' cannot simultaneously extend types 'Foo' and 'Bar'.
Named property 'id' of types 'Foo' and 'Bar' are not identical.
```

但是如果我們改用 `type` 來寫，情況就不同了，編譯器不會對這種笨笨的事情表達任何意見。
而是很貼心的幫你把衝突的屬性類型改為 `never`。

```typescript
type Foo = {
  id: number;
};

type Bar = {
  id: string;
};

// 這裡不會報錯
type FooBar = Foo & Bar;

// 但是 id 的類型會變成 never
type Id = FooBar["id"];
```

雖然貼心，但這麼做顯然是不對的。為什麼 interface 可以偵測到笨笨的行為，而 type 卻不行呢？
這就要來說說它們對於處理組合類型上的差異？

當編譯器在編譯 `interface` 的組合類型時，會建立一個扁平的物件類型去偵測是否有衝突的屬性，但 `type` 就不會這麼做了，
它只是很單純的遍歷並合併所有的屬性，所以你才會看到為什麼剛剛的 `id` 會變成 `never` 類型，
因為同時符合 `string` 與 `number` 的類型根本就不存在。

## 所以我應該使用 `interface`？

實際上也不一定，如果單單只討論 `interface` 與 `type` 有沒有效能上的差別，可以說是完全沒有差別。
唯一有差別的是在組合類型上，`interface` 擁有較快的編譯速度，所以如果你對效能近乎苛求，那麼會比較建議你使用 `interface`。

> 最近 TypeScript 的編譯器已經宣布要移植到 GO 語言上了，編譯速度可以達到過去的 10 倍以上，
> 所以組合類型的編譯速度差距，有可能會更顯得無所謂了（但追求效能毫無疑問是工程師的本性啊）。
>
> 詳細可以參考這篇文章 — [A 10x Faster TypeScript](https://devblogs.microsoft.com/typescript/typescript-native-port/)

## 參考資料

- [Type vs Interface: Which Should You Use?](https://www.totaltypescript.com/type-vs-interface-which-should-you-use)
- [Preferring Interfaces Over Intersections](https://github.com/microsoft/Typescript/wiki/Performance#preferring-interfaces-over-intersections)
