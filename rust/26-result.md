---
layout: default
parent: Rust
nav_order: 26
---

# Result 與可恢復錯誤

如果錯誤沒有嚴重到必須停止程式時，可以使用 `Result`。

例如開啟一份檔案，如果檔案不存在，可以嘗試建立檔案。

**`Result` 列舉有兩個成員，分別是 `Ok` 與 `Err`。而 `<T, E>` 中的 `T` 與 `E` 為泛型**。

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

讓我們嘗試呼叫一個會返回 `Result` 的函式 `File::open()`。

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");
}
```

如果檔案存在則返回 `Ok` 反之不存在則返回 `Err`，如下所例：

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => {
            panic!("There was a problem opening the file: {:?}", error)
        },
    };
}
```

如果檔案不存在顯示的訊息。

```text
thread 'main' panicked at 'There was a problem opening the file: Error { repr:
Os { code: 2, message: "No such file or directory" } }', src/main.rs:9:12
```

## 配對不同的錯誤

在剛才的程式碼中，`File::open` 無論失敗原因是什麼都會觸發 `panic!`。然而，我們實際上可以取得詳細的錯誤原因，並根據不同的錯誤做出不同的處理。

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Tried to create file but there was a problem: {:?}", e),
            },
            other_error => panic!("There was a problem opening the file: {:?}", other_error),
        },
    };
}
```

`File::open` 返回的 `Err`，其值類型為 `io::Error`，他有一個 `kind()` 方法可以取得詳細的錯誤類型，其中 `ErrorKind::NotFound` 代表檔案不存在。

如果檔案不存在就使用 `File::create` 建立檔案，但建立檔案也有可能失敗，因此需要 `match` 來處理。

仔細看可能會發現 `match` 有點太多，我們可以把上述的程式碼修改成。

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt").map_err(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("Tried to create file but there was a problem: {:?}", error);
            })
        } else {
            panic!("There was a problem opening the file: {:?}", error);
        }
    });
}
```

## 失敗時 panic 的簡寫 `unwrap` 與 `expect`

有時候要處理的錯誤太多，連續使用一堆 `match`，會讓程式碼變的冗長。

`Result<T, E>` 定義了很多方法來處理各種情況，其中一種是 `unwrap`，如果是返回 `Ok`，則 `unwrap` 會返回 `Ok` 中的值，反之則呼叫 `panic!`。

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").unwrap();
}
```

如果 `hello.txt` 不存在，`unwrap` 會幫我們呼叫 `panic!`，並提供錯誤訊息。

```bash
thread 'main' panicked at 'called `Result::unwrap()` on an `Err` value: Error {
repr: Os { code: 2, message: "No such file or directory" } }',
src/libcore/result.rs:906:4
```

我們可以使用 `expect` 來說明 `unwrap` 返回的錯誤訊息，讓訊息能更加貼近實際的錯誤情形。

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").expect("Failed to open hello.txt");
}
```

顯示的錯誤訊息如下，可以發現統一的錯誤訊息被換成我們在 `expect` 中設定的訊息。

```bash
thread 'main' panicked at 'Failed to open hello.txt: Error { repr: Os { code:
2, message: "No such file or directory" } }', src/libcore/result.rs:906:4
```

## 傳播錯誤 (Propagating)

當編寫一個可能會失敗的函式時，除了可以在這個函式中處理錯誤，你也可以讓調用函式的人自行決定該如何處理這個錯誤，稱為傳播 (propagating) 錯誤。

下面這段程式碼是一個從文件中讀取用戶明的函式。如果文件不存在或不能讀取，函式會把錯誤返回給調用它的程式碼。

```rust
use std::io;
use std::io::Read;
use std::fs::File;

// 這個函式會返回一個 Result<T, E>
// T 的具體類型是 String，E 的具體類型是 io::Error
// 如果函式沒有遇到錯誤，會返回一個包含 String 的 Ok 值
fn read_username_from_file() -> Result<String, io::Error> {
    let f = File::open("hello.txt");

    let mut f = match f {
        Ok(file) => file,
        // 如果有錯誤錯誤，直接將錯誤返回
        Err(e) => return Err(e),
    };

    let mut s = String::new();

    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}
```

## 傳播錯誤的簡寫 `?`

上面的寫法可以用 `?` 簡寫成下面的寫法：

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;
    let mut s = String::new();

    // 如果沒有錯誤，將繼續執行下面的 Ok(s)，反之則返回 Err
    f.read_to_string(&mut s)?;

    Ok(s)
}
```

> [!IMPORTANT]
>
> match 表達式與 `?` 所做的事情有點不同。
>
> `?` 會將錯誤傳遞給 `from` 函式，它定義在標準庫的 `From` trait 中，**用來將錯誤從一個類型轉換到另外一個類型**。
>
> 當 `?` 調用 `from` 時，會自動將錯誤轉成當前函式返回的錯誤類型也就是 `io::Error`。
>
> 即使函式有可能因為多種原因而發生錯誤，但只要錯誤類型有實現 from 函式來定義如何轉換這些錯誤類型，`?` 會自動幫你進行轉換。

`?` 可以使用鏈式寫法。

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut s = String::new();

    File::open("hello.txt")?.read_to_string(&mut s)?;

    Ok(s)
}
```

或是使用更簡短的 `fs` 函式。

```rust
use std::io;
use std::fs;

fn read_username_from_file() -> Result<String, io::Error> {
    fs::read_to_string("hello.txt")
}
```

## `?` 只能用於返回 `Result` 的函式

底下 `main()` 返回值的類型預設為空 tuple 也就是 `()`，不符合 `?` 的要求。

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt")?;
}
```

嘗試編譯上面的程式碼會出現下面的錯誤。

```text
error[E0277]: the `?` operator can only be used in a function that returns `Result` or `Option` (or another type that implements `std::ops::Try`)
 --> src/main.rs:4:13
  |
4 |     let f = File::open("hello.txt")?;
  |             ^^^^^^^^^^^^^^^^^^^^^^^^ cannot use the `?` operator in a function that returns `()`
  |
  = help: the trait `std::ops::Try` is not implemented for `()`
  = note: required by `std::ops::Try::from_error`
```

可以修改 `main` 函式，讓其返回一個 `Result<T, E>`。

> main 可以返回 Result 為 1.26 版本之後加入的新特性

```rust
use std::error::Error;
use std::fs::File;

fn main() -> Result<(), Box<dyn Error>> {
    let f = File::open("hello.txt")?;

    Ok(())
}
```

> [!NOTE]
>
> `Box<dyn Error>` 被稱為 **trait 物件** (trait object)。可以暫時將 `Box<dyn Error>` 理解為任何類型的錯誤。

## 讓函式回傳 `Result<T, E>` 是 Rust 的最佳實踐？

不一定，但如果你寫的函式是有高機率發生錯誤的話，回傳 `Result<T, E>` 是一個良好的習慣，
這清楚表明這個函式是有可能會發生錯誤的，呼叫之後應該要考慮錯誤發生的情況並進行處理。

詳細請參考這篇 [Stack Overflow 提問](https://stackoverflow.com/questions/70855252/is-it-a-good-practice-to-always-return-a-resultt-e-from-functions)。

