---
layout: default
parent: Rust
nav_order: 40
---

# `Rc<T>` 參考計數智慧指標

有些情況會需要讓一個數值能有數個擁有者，這個數值會在沒有任何一個擁有者時才會清除。

就好像一台電視打開後有很多人在觀看一樣，只有當電視沒有人要看時，電視才會關閉。

```rust
// 這裡使用 Rc 標注 List 會有多個擁有者
enum List {
    Cons(i32, Rc<List>),
    Nil,
}

use crate::List::{Cons, Nil};
// 因為 Rc<T> 並沒有包含在 prelude 中，因此需要使用 use 陳述式來將 Rc<T> 引入作用域
use std::rc::Rc;

fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
    // b 與 c 也是 a 的擁有者
    let b = Cons(3, Rc::clone(&a));
    let c = Cons(4, Rc::clone(&a));
}
```

這裡也雖然可以使用一般的 `clone` 來複製一個 `a` 給 `b` 與 `c`。
但是 `clone` 屬於深拷貝，不像 `Rc::clone` 的呼叫只會增加參考計數，這耗費的資源就相對少很多。

## 克隆 `Rc<T>` 實例會增加其參考計數

每次使用 Rc 克隆，計數器都會 +1，我們可以使用 `strong_count` 來查看目前的計數。

```rust
use std::rc::Rc;
use crate::List::{Cons, Nil};

enum List {
    Cons(i32, Rc<List>),
    Nil,
}

fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
    println!("建立 a 後的計數 = {}", Rc::strong_count(&a));

    let b = Cons(3, Rc::clone(&a));
    println!("建立 b 後的計數 = {}", Rc::strong_count(&a));

    {
        let c = Cons(4, Rc::clone(&a));
        println!("建立 c 後的計數 = {}", Rc::strong_count(&a));
    }

    println!("c 離開作用域後的計數 = {}", Rc::strong_count(&a));
}
```

上述程式碼的輸出結果為：

```text
建立 a 後的計數 = 1
建立 b 後的計數 = 2
建立 c 後的計數 = 3
c 離開作用域後的計數 = 2
```

可以看到 `c` 在離開作用域並且被清除之後，Rc 計數器也因此 -1。

> `Rc<T>` 只能用於單一執行緒（Single-Threaded）的場合。
