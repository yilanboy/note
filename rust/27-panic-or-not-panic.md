---
layout: default
parent: Rust
nav_order: 27
---

# 什麼時候使用 `panic!`？什麼時候使用 `Result`？

如果發生 `panic!`，就代表程式會立即中斷，並且沒有恢復的可能性。

使用 `Result`，就代表將將發生問題點的處理方式，交由調用的人來決定。

## 程式碼原型與測試都非常適合使用 `panic!`

如果你只是單純的想要用簡單的程式碼展示一些概念，現階段並不需要強健的錯誤處理程式碼來讓程式碼變得複雜又難以理解，可以考慮直接使用 `panic!`。

如果方法調用在測試中失敗了，我們會希望整個測試都是失敗的，因此建議直接使用 `panic!`。

## 雖然我們知道絕對不會 `Err`，但調用 `Result` 也沒有問題

即使我們透過其他的邏輯來確保 Result 會是 `Ok` 時，調用 `unwrap` 也是可以的。

```rust
use std::net::IpAddr;

let home: IpAddr = "127.0.0.1".parse().unwrap()
```

例如上方的例子中，我們硬編碼一個有效的 IP 地址 `"127.0.0.1"`，因此 `parse()` 返回的 `Result` 必定會是 `Ok`。

雖然這麼做有點多此一舉，但 IP 字符串的來源未來可能是用戶輸入而非硬編碼，到時候就需要更完整的方式來處理 `Result`。

## 錯誤處理指導原則

有可能會導致有害的狀態應該使用 `panic!`，有害狀態指的是協議或是不可變性被打破的狀態，例如無效的值。

> 什麼是不可變性 (invariant)？
>
> 不可變性是指某些條件在程式執行期間必須始終保持為真的規則。
> 例如，假設我們有一個表示年齡的變數，我們可以定義一個不可變性條件，該條件規定年齡必須始終為非負數。
> 如果程式碼嘗試將年齡設置為負數，這將違反不可變性條件，可能會導致程式出現錯誤或不一致的行為。

有害狀態不包含**預期會偶爾發生的錯誤**。

當錯誤是可以被預期時，使用 `Result` 會比 `panic!` 更合適。

當對值進行操作時，應該驗證值是否有效，並在其判定為無效時使用 `panic!`。
這主要出於安全原因，嘗試操作無效的資料有可能會暴露程式碼漏洞，例如訪問數組中不存在的索引。

當你的程式碼充滿許多對值有效性的檢查時，你可能會使用 `if` 來檢查值的有效性，但這有可能讓程式碼變得冗長，
以之前猜數字為例，用戶猜的數字必須在 1 到 100 之間。

```rust
loop {
    // 省略

    let guess: i32 = match guess.trim().parse() {
        Ok(num) => num,
        Err(_) => continue,
    };

    if guess < 1 || guess > 100 {
        println!("The secret number will be between 1 and 100.");
        continue;
    }

    match guess.cmp(&secret_number) {
        // 省略
    };
}
```

更建議的方式是使用 Rust 的類型系統，我們可以定義一個 `Guess` 類型，
你必須要使用 `new()` 方法來建立你要猜的數字，`new()` 方法只接受 1 到 100 間的數字。

最後使用 `value()` 方法返回你建立的值，這裡使用 getter 來取得值，
因為 `value` 在 Guess 中是私有的，確保值只能被 `new()` 所建立，且無法變更。

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess value must be between 1 and 100, got {}.", value);
        }

        Guess {
            value
        }
    }

    pub fn value(&self) -> i32 {
        self.value
    }
}
```

## 總結

`panic!` 巨集用於表示一個程式無法處理的狀態，遇到此情況時，程式將停止執行，而非繼續使用無效或錯誤的值。

Rust 的類型系統中，`Result` 列舉表示操作可能會失敗，調用者可以自行處理成功或失敗的狀況。

在適當的情境下，使用 `panic!` 和 `Result` 可讓程式在面對不可避免的錯誤時更為可靠。

## 參考資料

- [Using unwrap() in Rust is Okay](https://burntsushi.net/unwrap/#what-is-a-runtime-invariant)
