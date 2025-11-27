---
layout: default
parent: Rust
nav_order: 42
---

# Rust Tips

記錄一些在使用 Rust 時的小技巧與建議。

## 使用 `dbg!` 巨集進行除錯

在開發過程中，經常需要查看變數的值來進行除錯。Rust 提供了一個非常方便的巨集 `dbg!`，可以快速地打印變數的值和所在的程式碼行數。

```rust
struct User {
    username: String,
    email: String,
}

#[derive(Debug)]
struct Profile {
    user: User,
    active: bool,
}

fn main() {
    let profile = Profile {
        user: User {
            username: String::from("alice"),
            email: String::from("alice@example.com"),
        },
        active: true,
    };

    dbg!(profile);// 這會打印出變數 profile 的值，並且會有縮排方便閱讀
}
```

`dbg!` 巨集會打印出變數的值，並且會顯示該變數所在的檔案和行數，這對於快速定位問題非常有幫助。

```text
[src/main.rs:22:5] profile = Profile {
    user: User {
        username: "alice",
        email: "alice@example.com",
    },
    active: true,
}
```

## 使用 `todo!` 巨集標記未完成的程式碼

在開發過程中，可能會遇到一些功能還沒有實現的情況。Rust 提供了一個 `todo!` 巨集，可以用來標記這些未完成的程式碼。

```rust
fn unimplemented_function() {
    todo!("This function is not yet implemented");
}
```

如果執行此函式，程式會 panic 並顯示 `This function is not yet implemented` 的訊息。這樣可以提醒開發者該部分程式碼還需要完成。

## Type Reuse

在 Rust 中，Trait 可以用來定義共用的行為，並且可以在多個結構體中重複使用這些行為。

```rust
trait PaymentProcessor {
    fn pay(&self, amount: f64);
}

impl PaymentProcessor for CreditCard {
    fn pay(&self, amount: f64) {
        println!("Processing credit card payment of ${}", amount);
    }
}

impl PaymentProcessor for PayPal {
    fn pay(&self, amount: f64) {
        println!("Processing PayPal payment of ${}", amount);
    }
}
```

你有兩種方式來使用這些 Trait，一是使用**泛型**，二是使用 **Trait 物件**。

首先是使用泛型的方式：

```rust
// 使用泛型
fn process_payment<T: PaymentProcessor>(processor: T, amount: f64) {
    processor.pay(amount);
}

// 上面的函式在編譯時會根據傳入的具體類型生成不同的版本

// fn checkout_with_credit_card(processor: CreditCard, amount: f64) {
//     processor.pay(amount);
// }

// fn checkout_with_paypal(processor: PayPal, amount: f64) {
//     processor.pay(amount);
// }
```

使用泛型的好處是編譯器在編譯時就能確定類型，通常會有較好的效能。然而，這也意味著每次使用不同的類型時，編譯器都會生成一個新的函式版本，可能會增加編譯時間與產出二進制檔案的大小。

接著是使用 Trait 物件的方式：

```rust
// 使用 Trait 物件
fn process_payment(processor: &dyn PaymentProcessor, amount: f64) {
    processor.pay(amount);
}

fn main() {
    let cc = CreditCard { /* 初始化 */ };
    let pp = PayPal { /* 初始化 */ };

    process_payment(&cc, 100.0);
    process_payment(&pp, 50.0);
}
```

使用 Trait 物件的好處是可以在執行時決定使用哪個具體類型（Dynamic Dispatch），這提供了更大的彈性。然而，由於 Trait 物件使用動態分派，可能會帶來一些效能上的損失。

> Rust 會透過一個小的 Lookup Table 來實現 Trait 物件的動態分派，這個表格會在執行時決定要呼叫哪個具體類型的方法。

所以這裡有個小訣竅是：

- 編寫程式時可以從 Trait 物件開始，這樣可以快速實現功能並保持快速迭代的彈性。
- 當程式穩定後，可以根據效能需求將 Trait 物件改寫為使用泛型，以提升效能。

## 使用巨集

當你的部分邏輯重複出現在多個函式或模組中時，使用巨集可以幫助你減少重複程式碼，提升維護性。

以下面的程式碼為例，不同的結構體 `User` 與 `Product`，他們有著相似的實作。

```rust
#[derive(Debug)]
struct User { id: u32, name: String}

impl User {
    fn find(id: u32) -> Option<Self> {
        Some(Self {
            id,
            name: String::from("User"),
        })
    }
    fn save(&self) -> Result<(), String> {
        Ok(())
    }
    fn delete(&self) -> Result<(), String> {
        Ok(())
    }
}

#[derive(Debug)]
struct Product { id: u32, name: String}

impl Product {
    fn find(id: u32) -> Option<Self> {
        Some(Self {
            id,
            name: String::from("Product"),
        })
    }
    fn save(&self) -> Result<(), String> {
        Ok(())
    }
    fn delete(&self) -> Result<(), String> {
        Ok(())
    }
}
```

這時我們可以考慮改用巨集來避免重複的實作。

```rust
macro_rules! model {
    // 巨集會接收一個 ident 指示的參數，並建立一個 $name 函式名稱
    ($name:ident) => {
        #[derive(Debug)]
        struct $name {
            id: u32,
            name: String,
        }

        impl $name {
            fn find(id: u32) -> Option<Self> {
                Some(Self {
                    id,
                    name: stringify!($name).to_string(),
                })
            }
            fn save(&self) -> Result<(), String> {
                Ok(())
            }
            fn delete(&self) -> Result<(), String> {
                Ok(())
            }
            // 關於 Model 的任何變更，都可以在這個巨集中直接修改，並套用到所有的 Model 類型上
            fn update(&mut self) -> Result<(), String> {
                Ok(())
            }
        }
    };
}

model!(User);
model!(Product);
```

## 簡潔的 `main.rs`

盡可能讓 `main.rs` 保持簡潔。主要邏輯寫在 `lib.rs`，並在 `main.rs` 中重複使用這些邏輯。

```text
├── Cargo.lock
├── Cargo.toml
└── src
    ├── lib.rs
    └── main.rs
```

當你的專案越來越大時，`lib.rs` 可以進一步拆分成多個模組檔案，讓程式碼更有組織性。

```text
├── Cargo.lock
├── Cargo.toml
└── src
    ├── command.rs
    ├── lib.rs
    ├── main.rs
    └── storage.rs
```

在 `lib.rs` 中匯入這些模組：

```rust
pub mod command;
mod storage;
```

如果你時常 `import` 某個常用的模組，例如 `use std::fs`，你可以考慮新建一個檔案 `prelude.rs`，並在模組中匯入它：

```text
├── Cargo.lock
├── Cargo.toml
└── src
    ├── command.rs
    ├── lib.rs
    ├── main.rs
    ├── prelude.rs
    └── storage.rs
```

```rust
// prelude.rs
pub use std::fs;
pub use std::io::{self, Read, Write};
```

```rust
// lib.rs
mod prelude;
```

```rust
// command.rs and storage.rs
use crate::prelude::*;
```

## Control Visibility

注意有哪些模組是真的需要公開的，並且使用 `pub(crate)`、`pub(super)` 或 `pub(self)` 來限制模組的可見範圍，這樣可以減少外部對內部實作的依賴，提升模組的封裝性。

```rust
// command 模組是公開的，可以被外部使用，但是注意！這不代表裡面的所有函式都是公開的
// 想要讓 command 模組裡的函式公開，需要在函式前面加上 pub 關鍵字
pub mod command;
mod storage;
mod prelude;
```

```rust
mod storage {
    pub(crate) fn save_data() {
        // 只能在當前 crate 中使用
    }

    pub(self) fn load_data() {
        // 只能在當前模組中使用
    }
}
mod command {
    mod command_children {
        pub(super) fn execute_command() {
            // 只能在父模組中使用
        }
    }
}
```

## Cargo Workspace

當你有多個相關的 Rust 專案時，可以考慮使用 Cargo Workspace 來管理這些專案。這樣可以共用相同的依賴，並且更方便地進行版本控制。

```text
my_workspace/
├── Cargo.toml
├── project_a/
│   └── src/
│       └── main.rs
└── project_b/
    └── src/
        └── main.rs
```

```toml
# my_workspace/Cargo.toml
[workspace]
members = ["project_a", "project_b"]
```

## 參考資料

[![21+ Rust Pro Tips (TOP SECRET)](https://img.youtube.com/vi/53XYcpCgQWE/maxresdefault.jpg)](https://www.youtube.com/watch?v=53XYcpCgQWE)
