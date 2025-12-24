---
layout: default
parent: Rust
nav_order: 39
---

# Drop

Drop 特徵可以讓你自訂數值離開作用域時的行為。

你可以對任何型別實作 Drop 特徵，例如釋放檔案或是網路連線資源。

`Box<T>` 的 Drop 特徵，讓其在離開作用域時會釋放在堆積上指向的記憶體空間。

```rust
struct CustomSmartPointer {
    data: String,
}

// Drop 包含在 prelude 中，因此不需要特別引入
impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("釋放 CustomSmartPoint 的資料 `{}`", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer {
        data: String::from("我的東東"),
    };

    let d = CustomSmartPointer {
        data: String::from("其他東東"),
    };

    println!("CustomSmartPointers 建立完畢");
}

```

執行結果如下，可以看到 `c` 與 `d` 再離開作用域之後，依序打印出釋放訊息：

```text
CustomSmartPointers 建立完畢
釋放 CustomSmartPoint 的資料 `其他東東`
釋放 CustomSmartPoint 的資料 `我的東東`
```

## 提早釋放記憶體

Rust 不允許你自行呼叫 `Drop` 特徵的 `drop` 方法來釋放記憶體。是因為想避免重複釋放(double free) 的錯誤。

```rust
fn main() {
    let c = CustomSmartPointer {
        data: String::from("某些資料"),
    };
    println!("CustomSmartPointer 建立完畢。");

    // error[E0040]: explicit use of destructor method
    // explicit destructor calls not allowed
    // help: consider using `drop` function: `drop(c)`
    c.drop();

    println!("CustomSmartPointer 在 main 結束前就被釋放了。");
}
```

如果真的想提早釋放記憶體的話，可以使用標準函式庫提供的 `std::mem::drop()` 函式。

```rust
fn main() {
    let c = CustomSmartPointer {
        data: String::from("某些資料"),
    };

    println!("CustomSmartPointer 建立完畢。");

    drop(c);

    println!("CustomSmartPointer 在 main 結束前就被釋放了。");
}
```

顯示結果如下：

```text
CustomSmartPointer 建立完畢。
釋放 CustomSmartPointer 的資料 `某些資料`!
CustomSmartPointer 在 main 結束前就被釋放了。
```
