---
layout: default
parent: Rust
nav_order: 38
---

# 透過 Deref (解參考) 取得指標追蹤的值

我們常用的參考 `&` 就是一種指標。在 Rust 中，指標無法與一般的值進行比較，因為它們屬於不同的類型。
這個時候需要透過 `*` 這個解參考運算子 (Dereference Operator) 來取得指標指向的值。

```rust
fn main() {
    let x = 5;
    let y = &x;

    assert_eq!(5, x);
    // 因為 y 是參考 x 的值，代表 y 是一種指標，其儲存的資料是「指向 x 所代表的值」
    // 所以 y 無法與一般的值進行比較，下方的輸出結果為
    // error[E0277]: can't compare `{integer}` with `&{integer}`
    assert_eq!(5, y);

    // 這時我們需要使用解參考運算子 * 將 y 進行解參考，取得 y 所指向的值
    assert_eq!(5, *y);
}
```

Box 這種智慧指標也可以使用解參考運算子。

```rust
fn main() {
    let x = 5;
    let y = Box::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

## 定義自己的智慧指標

`Box<T>` **本質上就是定義成只有一個元素的元組結構體**，我們可以定義自己的智慧指標。

```rust
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}
```

雖然成功的寫出一個自己的智慧指標，但這個智慧指標因為缺少對 Deref 特徵的實作，因此 Rust 無法對其進行解參考。

```rust
fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    // error[E0614]: type `MyBox<{integer}>` cannot be dereferenced
    assert_eq!(5, *y);
}
```

## 替自己智慧指標實作 Deref 特徵

```rust
use std::ops::Deref;

impl<T> Deref for MyBox<T> {
    // 定義了一個供 Deref 特徵使用的關聯型別
    type Target = T;

    // 這裡的 &self 是 MyBox<T>
    fn deref(&self) -> &Self::Target {
        // 返回 MyBox<T> 元組的第一個元素
        // 這裡之所有要加上普通參考 &，是因為我們不希望該數值的所有權從 self 中被移出
        &self.0
    }
}
```

> [!NOTE]
>
> 關聯型別 (Associated Types) 是一種與 trait 相關聯的類型。
> 它們允許我們在 trait 定義中指定某些類型，而這些類型會在實現該 trait 時具體化。
> 提高代碼的靈活性和可讀性。

當 Rust 進行解參考時，實際上是執行我們實作的 `deref` 方法。

雖然我們看到的是 `*y`，但實際上 Rust 執行的是 `y.deref()`。

## 函式與方法的隱式強制解參考

強制解參考 (Deref Coercion) 是指 Rust 會自動對有實作 Deref 特徵的指標進行解參考。
例如從某一個型別參考轉換成其他型別的參考。

舉例來說，當有需要時，強制解參考可以轉換 `&String` 成 `&str`，
**因為** `String` **有實作** `Deref` **特徵並能用它來回傳** `&str`。

```rust
fn hello(name: &str) {
    println!("Hello, {name}!");
}

fn main() {
    let m = MyBox::new(String::from("Rust"));
    // 注意 m 解參考後返回的值 &String 類型
    // 此時為了符合 hello 參數的類型，Rust 會再度將 &String 解參考並返回 &str 類型
    hello(&m);

    // 如果 Rust 沒有強制解參考，那麼我們就只能這樣寫
    // & 和 [..] 會從 String 中取得等於整個字串的字串切片
    hello(&(*m)[..])
}
```

## 強制解參考如何處理可變性

當 Rust 發現型別與特徵實作符合以下三種情況時，它就會進行強制解參考：

- 第一種情況是從**不可變參考**變成**不可變參考**。從 `&T` 轉成 `&U`，且 `T` 有實作 `Deref` 到某個型別 `U`
- 第二種情況是從**可變參考**變成**可變參考**。從 `&mut T` 到 `&mut U`，且 `T` 有實作 `DerefMut` 到某個型別 `U`
- 第三種情況是從**可變參考**變成**不可變參考**。從 `&mut T` 到 `&U`，且 `T` 有實作 `Deref` 到某個型別 `U`

在 Rust 中，**不可變參考永遠不可能強制解參考成可變參考**。

## 為什麼 Rust 會有這樣的設計？

這個設計主要解決了兩個問題：**「人體工學（易用性）」** 與 **「安全性」** 的平衡。

### 1. 為了方便（Ergonomics）

如果沒有強制解參考，寫程式會非常痛苦。智慧指標（Smart Pointers）用起來就像是它包裝的那個值，消除了「包裝層」帶來的語法雜訊。

### 2. 為了安全（Borrowing Rules）

Rust 規定 **「不可變參考永遠不可能強制解參考成可變參考」** 是為了嚴格遵守 **借用規則**：

> 同一時間，你要嘛有多個讀者（`&T`），要嘛只有一個寫者（`&mut T`）。

如果 Rust 允許 `&T` 自動轉成 `&mut U`，這會發生災難：

- 你手上只有一張「參觀證」（`&T`，代表可能還有別人在參觀）。
- 結果 Rust 自動幫你換成了一張「施工證」（`&mut U`）。
- 你開始修改資料，結果導致其他持有「參觀證」的人看到正在被修改、不一致的資料，甚至引發 Data Race（資料競爭）。

### 總結

Rust 的這個設計是為了讓你：

1. **寫得爽**：不用一直手動解參考（`*`）或轉型。
2. **活得久**：確保在自動方便的同時，原本的借用規則（Borrow Checker）不會被打破。權限只能「維持」或「降級」（可變 -> 不可變），絕對不能自動「升級」（不可變 -> 可變）。
