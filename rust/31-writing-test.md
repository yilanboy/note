---
layout: default
parent: Rust
nav_order: 31
---

# 如何寫測試

一個測試函式通常會有三個步驟

1. 設置任何需要的資料或狀態
2. 執行你想要測試的程式碼
3. 判定結果是否符合預期

如果你用 `cargo new <lib-name> --lib` 新建立一個 library 專案時，預設會有一個測試範例

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
```

`#[test]` 詮釋會指出這是一個測試函式。而 `assert_eq!` 則是一個斷言巨集，如果兩個參數不相等，則會產生一個錯誤訊息。

> `#[cfg(test)]` 當中的 `cfg` 代表「configuration」，這個詮釋會告訴 Rust 編譯器，只有在執行測試時才會編譯這個模組。

可以使用 `cargo test` 來執行專案中全部測試。

```text
running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

可以看到上述測試結果有個 `0 ignored`，某些情況下，你可以選擇忽略測試。

測試也可以根據名稱進行過濾，例如只想執行 `it_works` 開頭的測試，可以使用 `cargo test it_works`。

嘗試一下讓測試失敗。

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // ...

    #[test]
    fn it_will_panic() {
        panic!("Make this test fail")
    }
}
```

此時結果會顯示。

```text
running 2 tests
test tests::it_will_panic ... FAILED
test tests::it_works ... ok

failures:

---- tests::it_will_panic stdout ----
thread 'tests::it_will_panic' panicked at src/lib.rs:17:9:
Make this test fail
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::it_will_panic

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

當測試失敗時，會顯示測試結果是 `FAILED` 並顯示錯誤訊息，方便開發者找出問題。

## 透過 `assert!` 巨集檢查結果

標準函式庫提供 `assert!` 巨集，可以用來檢查結果是否是預期的。

例如以之前的檢查某長方形是否可以包含另一個長方形的範例，我們可以使用 `assert!` 巨集來檢查結果。

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        let larger = Rectangle {
            width: 10,
            height: 10,
        };

        let smaller = Rectangle {
            width: 5,
            height: 5,
        };

        assert!(larger.can_hold(&smaller));
    }
}
```

## 使用 `assert_eq!` 和 `assert_ne!` 巨集檢查是否相等或不相等

`assert_eq!` 和 `assert_ne!` 巨集可以用來檢查兩個值是否相等或不相等。

```rust
pub fn add_two(a: i32) -> i32 {
    // 故意寫錯成 + 3
    a + 3
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_adds_two() {
        assert_eq!(4, add_two(2));
    }
}
```

執行測試後會發現測試沒有通過，並且測試結果會明確告訴你 `` assertion failed: `(left == right)` ``，並顯示 `left` 與 `right` 的值。

```text
running 1 test
test tests::it_adds_two ... FAILED

failures:

---- tests::it_adds_two stdout ----
thread 'tests::it_adds_two' panicked at src/lib.rs:12:9:
assertion `left == right` failed
  left: 4
 right: 5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::it_adds_two

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

## 加入自訂失敗訊息

我們可以客製化失敗顯示的訊息，用來幫助我們更好的理解錯誤發生的原因。

```rust
// 故意寫錯成一個只會顯示 Hello! 的函式
pub fn say_hello_to(name: &str) -> String {
    String::from("Hello!")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_can_say_hello() {
        let result = say_hello_to("Allen");

        assert!(
            result.contains("Allen"),
            "顯示不正確，顯示結果為 `{}`", // {} 會替換成下一個參數 result 的內容
            result
        );
    }
}
```

測試結果顯示如下：

```text
running 1 test
test tests::it_can_say_hello ... FAILED

failures:

---- tests::it_can_say_hello stdout ----
thread 'tests::it_can_say_hello' panicked at src/lib.rs:14:9:
顯示不正確，顯示結果為 `Hello!`
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::it_can_say_hello

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

## 透過 `should_panic` 檢查恐慌

除了判斷值是否符合預期，判斷一個程式是否如預期般拋出錯誤也很重要。

例如之前的猜數字，使用者可以猜測 1 ~ 100 之間的數字，如果使用者輸入超過範圍的數字，則應該拋出錯誤。

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("猜測數字必須介於 1 到 100 之間，你輸入的是 {}。", value);
        }

        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

但是這樣的測試有個問題，基本上只要拋出錯誤都會通過測試。如果我們想確認錯誤訊息是否符合預期，可以在 `should_panic` 中使用 `expected` 參數。

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected = "猜測數字必須介於 1 到 100 之間")]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

這樣當錯誤訊息不包含字串 `猜測數字必須介於 1 到 100 之間` 時，測試也會失敗。

## 在測試中使用 `Result<T, E>`

我們可以讓測試在失敗時，不是直接 panic，而是回傳 `Result<T, E>`。

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() -> Result<(), String> {
        if 2 + 2 == 4 {
            Ok(())
        } else {
            Err(String::from("二加二不等於四"))
        }
    }
}
```

測試中回傳 `Result<T, E>` 讓你可以在測試本體中使用問號運算子，這樣能方便地寫出任何運算回傳 `Err` 時該失敗的測試。

不過不能將 `#[should_panic]` 詮釋用在使用 `Result<T, E>` 的測試。要判斷一個操作是否回傳 `Err` 的話，不要在 `Result<T, E>` 數值後加上 `?`，而是改用 `assert!(value.is_err())`。
