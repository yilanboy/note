---
layout: default
parent: Rust
nav_order: 37
---

# 使用 `Box<T>` 指向堆積上的資料

Rust 中有一個智慧指標（Smart Pointer）功能叫做 Box。

**Box 允許你將資料儲存到堆積 (Heap) 上。同時會有一個堆疊 (Stack) 儲存指向堆積資料的指標 (Pointer)**。

```rust
fn main() {
    let b = Box::new(5);
    println!("b = {}", b);
} // b 在這裡被釋放。堆積上的值會被釋放，同時指向堆積的指標也會被釋放。
```

Box 在遞迴資料結構中非常有用，因為它允許你的資料有一個已知的大小 (因為資料是一個固定的指標)。

一般的遞迴資料結構會有不確定的大小，因為它的大小取決於遞迴的深度。

```rust
enum List {
    Cons(i32, List),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    // 這樣的寫法會造成編譯錯誤
    // 每個 Cons 的大小是不確定的，因為每個 Cons 都包含另一個 List，而這個 List 又包含另一個 Cons，以此類推
    // 因此編譯器無法判別出它需要多少空間才能儲存一個 List 的數值
    let list = Cons(1, Cons(2, Cons(3, Nil)));
}
```

我們可以使用 `Box` 來解決這個問題，因為 `Box` 的指標有一個已知的大小

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    // Cons 變體需要的大小為 i32 加上儲存 Box 指標的空間
    // 這樣的寫法就不會造成編譯錯誤，因為 Cons 變體的大小是已知的
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
}
```
