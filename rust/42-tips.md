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

## 參考資料

[![21+ Rust Pro Tips (TOP SECRET)](https://img.youtube.com/vi/53XYcpCgQWE/maxresdefault.jpg)](https://www.youtube.com/watch?v=53XYcpCgQWE)
