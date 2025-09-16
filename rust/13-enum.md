---
layout: default
parent: Rust
nav_order: 13
---

# 列舉 (Enum)

用來定義一組有意義的資料類型。

## 定義列舉

我們來定義一組 IP 類型的集合，IP 只有兩種，IPv4 與 IPv6，不會有其他種，這種情況很適合用列舉。

```rust
enum IpAddrKind {
    V4,
    V6,
}
```

`IpAddrKind` 為一個自定義的列舉，其中的 `V4` 與 `V6` 為該列舉的**成員**。

## 列舉值

可以由下方的方式來創建 `IPAddrKind` 成員的實例。

```rust
enum IpAddrKind {
    V4,
    V6,
}

let four = IpAddrKind::V4;
let six = IpAddrKind::V6;
```

注意列舉的成員位於其標示符的命名空間中。

因為 `IpAddrKind` 為我們自定義的資料類型，所以能用來註明函式的參數類型。

```rust
enum IpAddrKind {
    V4,
    V6,
}

fn route(ip_type: IpAddrKind) {
    // ...
}

route(IpAddrKind::V4);
route(IpAddrKind::V6);
```

也能夠搭配 struct 來做使用，定義一個 `IpAddr` struct，其中的 `kind` 為 `IpAddrKind` 類型。

接下來的實例在創建時，`kind` 就只能夠使用 `IpAddrKind` 類型的成員。

```rust
enum IpAddrKind {
    V4,
    V6,
}

struct IpAddr {
    kind: IpAddrKind,
    address: String,
}

let home = IpAddr {
    kind: IpAddrKind::V4,
    address: String::from("127.0.0.1"),
};

let loopback = IpAddr {
    kind: IpAddrKind::V6,
    address: String::from("::1"),
};
```

上述方法可以用另外一種更簡潔的方式表示。

直接將值放入列舉的成員中，這樣列舉可以直接替代 struct。

```rust
enum IpAddr {
    V4(String),
    V6(String),
}

let home = IpAddr::V4(String::from("127.0.0.1"));

let loopback = IpAddr::V6(String::from("::1"));
```

每個成員還可以處理不同類型和數量的資料，例如 IPv4 改儲存為四組數字的集合。

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

let home = IpAddr::V4(127, 0, 0, 1);

let loopback = IpAddr::V6(String::from("::1"));
```

因為 IP 類型的資料很常見，因此 Rust 標準庫有提供一組可以拿來使用的[定義](https://doc.rust-lang.org/std/net/enum.IpAddr.html)

雖然標準庫有提供一個 `IpAddr` 的定義，但因為我們沒有將它的定義引入作用域中，所以我們可以定義自己的 `IpAddr` 而不會發生衝突

```rust
struct Ipv4Addr {
    // --snip--
}

struct Ipv6Addr {
    // --snip--
}

enum IpAddr {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}
```

下方的 `Message` 列舉中的每個成員，其成員類型各不相同：

- `Quit` 沒有關連任何資料。
- `Move` 包含一個匿名 struct。
- `Write` 包含單獨一個 `String`。
- `Change` 包含三個 `i32`。

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}
```

如果改用 struct 來定義上述的列舉，可能的方式如下

```rust
struct QuitMessage; // 類單元結構體
struct MoveMessage {
    x: i32,
    y: i32,
}
struct WriteMessage(String); // 元組結構體
struct ChangeColorMessage(i32, i32, i32); // 元組結構體
```

這種方式讓我們無法像列舉一樣，定義一種能夠處理不同類型結構體的函式。

struct 與列舉都可以使用 `impl` 來定義方法。

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

impl Message {
    fn call(&self) {
        // ...
    }
}

let m = Message::Write(String::from("hello"));
m.call();
```

`call()` 方法使用了 `self` 來獲取調用方法的值。這個例子中，創建了一個值為 `Message::Write(String::from("hello"))` 的變數 `m`，而且這就是當 `m.call()` 運行時 `call()` 方法中的 `self` 的值。

## Option

`Option` 是 Rust 標準庫中提供的一種列舉，其定義了一種非常廣泛且普遍的使用場景，一個值要麼有值，要麼沒值。

**Rust 並沒有很多其他語言中有的空值 (Null) 功能**。空值是一個值，它代表沒有值。在有空值的語言中，變數總是這兩種狀態之一，空值和非空值。

空值的問題在於當你嘗試像一個非空值那樣使用一個空值，會出現某種形式的錯誤。因為空和非空的屬性無處不在，非常容易出現這類錯誤。

雖然空值常常引發錯誤，但其嘗試表達的概念仍然是有意義的：因為某種原因目前無效或缺失的值。

雖然 Rust 並沒有空值，不過標準庫內確實擁有一個可以表示其存在或不存在概念的列舉。這個列舉就是 `Option`。

```rust
enum Option {
    Some(T),
    None,
}
```

`Some` 是一個泛型類型參數，這裡的 T 可以代表任何一種類型。

因為 `Option` 很常使用，所以 Rust 將其包含於 prelude 中，`Option` **與其成員，不用將其顯式引入作用域就可以使用**。

```rust
let some_number = Some(5); // 雖然沒有特別寫明 Option::Some(5)，但這裡的 Some 依舊是 Option 的成員
let some_string = Some("a string");

let absent_number: Option<i32> = None;
```

如果使用 `None`，需要告訴 Rust `Option` 為什麼類型，因為編譯器無法通過 `None` 值去推斷 `Some` 的類型。

下方這段程式碼會出現問題，明明都屬於 `i8` 類型，為什麼無法相加？

```rust
let x: i8 = 5;
let y: Option<i8> = Some(5);

let sum = x + y; // error: the trait bound `i8: std::ops::Add<std::option::Option<i8>>` is not satisfied
```

錯誤訊息表明 Rust 不知道該如何將 `Option<i8>` 與 `i8` 相加，因為他們類型不同。

當在 Rust 中註明類型為 `i8` 時，編譯器會知道它總是擁有一個值，我們可以自信的使用而無需做空值檢查。

而使用 `Option<i8>` 就需要特別注意可能會有空值的情況產生，編譯器會確保我們在使用值之前，是否處理了為空值的情況。

在對 `Option` 進行 `T` 的運算之前必須先將其轉換為 `T`，這能幫助我們最常遇到的問題，**假設某值不為空但其實為空的情況**。

只要一個值不是 `Option` 類型，我們就可以安全的認定這個值不為空。

這是 Rust 經過深思熟慮的設計決策，藉由限制空值的泛濫以增加 Rust 代碼的安全性。
