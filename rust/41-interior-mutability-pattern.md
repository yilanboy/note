---
layout: default
parent: Rust
nav_order: 41
---

# `RefCell<T>` 與內部可變性模式 (Interior Mutability)

**內部可變性 (Interior Mutability)** 是 Rust 中的一個設計模式，它允許你即使在有不可變參考 (immutable reference) 的情況下也能改變數據。這通常是透過在資料結構中使用 `unsafe` 程式碼來繞過 Rust 正常的借用規則（Borrowing Rules）來實現的。

`RefCell<T>` 就是一個實踐了內部可變性模式的型別。

## 執行時借用檢查 (Runtime Borrow Checking)

不同於 `Rc<T>`，`RefCell<T>` 代表了數據的唯一所有權。那麼它與 `Box<T>` 有什麼不同呢？

| `Box<T>`               | `RefCell<T>`              |
| :--------------------- | :------------------------ |
| **編譯時**檢查借用規則 | **執行時**檢查借用規則    |
| 若違反規則，編譯失敗   | 若違反規則，程式 `panic!` |

因為 Rust 編譯器是非常保守的，有時候我們確定程式碼是安全的，但編譯器無法分析出來（例如涉及複雜的控制流）。這時候 `RefCell<T>` 就派上用場了。

> [!IMPORTANT]
>
> `RefCell<T>` 只能用於單執行緒 (Single-Threaded) 的場景。如果你需要在多執行緒環境下使用內部可變性，請使用 `Mutex<T>` 或 `RwLock<T>`。

## 實際案例：模擬物件 (Mock Objects)

在撰寫測試代碼時，我們經常需要使用「模擬物件」來測試某個功能是否被正確調用，而不需要真正觸發實際的副作用（例如發送網路請求）。

假設我們有一個 `Messenger` trait：

```rust
pub trait Messenger {
    fn send(&self, msg: &str);
}
```

我們要測試一個會呼叫 `Messenger` 的功能，所以我們建立一個 `MockMessenger`。我們希望在 `send` 被呼叫時，把訊息記錄下來，以便稍後驗證。

**問題來了**：`send` 方法的簽名是 `&self` (不可變參考)，這意味著我們不能修改 `MockMessenger` 內部的欄位。

```rust
// 這是無法編譯的程式碼
struct MockMessenger {
    sent_messages: Vec<String>,
}

impl Messenger for MockMessenger {
    fn send(&self, msg: &str) {
        // 錯誤！無法修改 self.sent_messages，因為 self 是不可變參考
        self.sent_messages.push(String::from(msg));
    }
}
```

這時候就是 **內部可變性** 的最佳使用時機。我們可以使用 `RefCell<Vec<String>>` 來包裝訊息列表：

```rust
use std::cell::RefCell;

struct MockMessenger {
    // 使用 RefCell 包裝 Vec
    sent_messages: RefCell<Vec<String>>,
}

impl MockMessenger {
    fn new() -> MockMessenger {
        MockMessenger {
            sent_messages: RefCell::new(vec![]),
        }
    }
}

impl Messenger for MockMessenger {
    fn send(&self, msg: &str) {
        // borrow_mut() 讓我們在 &self 是一個不可變參考的情況下，
        // 獲取內部數據的可變參考 (RefMut<T>)
        self.sent_messages.borrow_mut().push(String::from(msg));
    }
}

#[test]
fn it_sends_an_over_75_percent_warning_message() {
    let mock_messenger = MockMessenger::new();
    let mut limit_tracker = LimitTracker::new(&mock_messenger, 100);

    limit_tracker.set_value(80);

    // borrow() 獲取不可變參考以進行讀取 (Ref<T>)
    assert_eq!(mock_messenger.sent_messages.borrow().len(), 1);
}
```

## `borrow` 與 `borrow_mut`

`RefCell<T>` 提供了兩個安全的方法來獲取內部的參考：

- `borrow()`: 返回 `Ref<T>`（類似 `&T`）。可以有多個。
- `borrow_mut()`: 返回 `RefMut<T>`（類似 `&mut T`）。同一時間只能有一個。

`RefCell<T>` 會在執行時記錄有多少個 `Ref` 和 `RefMut` 正在活動：

1. 每次呼叫 `borrow()`，計數器加 1；`Ref` 離開作用域時，計數器減 1。
2. 每次呼叫 `borrow_mut()`，可變借用計數器加 1；`RefMut` 離開作用域時，計數器減 1。

> [!CAUTION]
> 雖然檢查是在執行時進行，但規則依然是 **Rust 的借用規則**：在任意給定時間，你只能擁有 **一個可變參考** 或 **任意數量的不可變參考**。如果你違反了這個規則（例如在還有 `Ref` 存活時呼叫 `borrow_mut`），程式會在執行時 **Panic**。

```rust
let data = RefCell::new(5);

let a = data.borrow(); // OK
let b = data.borrow(); // OK
let c = data.borrow_mut(); // Panic! 已經有不可變借用存在，不能再進行可變借用
```
