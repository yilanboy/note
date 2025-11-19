---
layout: default
parent: Rust
nav_order: 30
---

# 生命週期與引用有效性

Rust 中的每一個引用都有其生命週期（lifetime），也就是引用的有效作用域。

大部分生命週期是可以推斷的，但有時候我們需要使用泛型的生命週期參數來明確指定，確保實際使用時，引用是有效的。

## 生命週期的設計是為了避免迷途參考

迷途參考 (dangling reference) 是指引用了一個已經被釋放的變數的記憶體空間。

Rust 的生命週期設計是為了避免迷途參考的產生。

```rust
{
    // 這裡宣告變數卻不賦值，乍看之下似乎違反了 Rust 不存在空值的原則
    // 但如果嘗試在賦值之前使用這個變數，就會導致出錯，這代表 Rust 確實不允許空值
    let r;

    {
        let x = 5;
        r = &x;
        // x 在這個作用域結束後就會被釋放
        // 導致 r 變成一個懸垂引用
    }

    // error[E0597]: `x` does not live long enough
    // 這裡會有 "x 活得不夠久" 的錯誤， x 已經被釋放，但 r 仍然引用著 x 的記憶體空間
    println!("r: {}", r);
}
```

Rust 編譯器有一個借用檢查器 (borrow checker)，它會確保所有借用都是有效的。

## 函式中的泛型生命週期

讓我們用一個找出最長字串的函式 `longest` 來說明泛型生命週期

```rust
// error[E0106]: missing lifetime specifier
fn longest(x: &str, y: &str) -> &str {
    // Rust 並不知道將要返回的引用是指向 x 或 y
    // 這會導致 Rust 編譯器無法確定返回的引用的生命週期
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";

    let result = longest(string1.as_str(), string2);
    println!("The longest string is {}", result);
}
```

上面的程式碼會有錯誤，因為 Rust 編譯器無法確定 `x` 和 `y` 的生命週期，也就無法確定 `result` 的生命週期。

## 生命週期的註解

為了解決剛剛提到的問題，我們可以在函式的引數中加入生命週期的註解 (Lifetime Annotation)。

```rust
// 使用 'a 註解生命週期，其中 a 是任意字母
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

這個 `'a` 說明了 `x` 和 `y` 的生命週期是相同的，而且返回值的生命週期也與 `x` 和 `y` 相同。

以下面的例子來看，這是一段可以正常執行的程式碼。

雖然 `string1` 的生命週期在外部作用域，但 `string2` 與 `result` 的生命週期都在內部作用域，因此借用檢查器會認定這是有效的程式碼。

```rust
fn main() {
    let string1 = String::from("long string is long");

    {
        let string2 = String::from("xyz");
        let result = longest(string1.as_str(), string2.as_str());
        println!("The longest string is {}", result);
    }
}
```

來看一個無法通過借用檢查器的例子。

因為 `result` 有可能指向 `string2`，但最後 `string2` 的生命週期卻比 `result` 還要短。

```rust
fn main() {
    let string1 = String::from("xyz");
    let result;

    {
        // 這裡的 string2 是比較長的字串
        // 所以可以預期 result 會指向 string2
        let string2 = String::from("longer string");
        result = longest(string1.as_str(), string2.as_str());

        // !Oops! string2 在這個作用域結束後就會被釋放
        // result 會變成一個懸垂引用
    }

    // error[E0597]: `string2` does not live long enough
    println!("The longest string is {}", result);
}
```

## 深入理解生命週期

指定生命週期參數的方式取決於函式的行為。
例如下方因為我們只會回傳 `x`，因此我們就不需要指定 `y` 的生命週期。
(雖然看起來有點怪)

```rust
fn longest<'a>(x: &'a str, y: &str) -> &'a str {
    x
}
```

注意回傳值的生命週期必須符合其中一個參數的生命週期。
如果回傳值的生命週期與參數的生命週期都不符合，那麼代表它參考的是函式本體中的值，而這會是一個迷途參考。

```rust
fn longest<'a>(x: &str, y: &str) -> &'a str {
    let result = String::from("超長的字串");

    // error[E0515]: cannot return reference to local variable `result`
    // result 在離開這個這個函式之後就會被清除
    result.as_str()
}
```

**總結來說，生命週期語法是用來連結函式中不同參數與回傳值的生命週期**，讓 Rust 確保不會產生迷途參考。

## 結構體定義中的生命週期註解

結構體也能有生命週期註解，不過我們會需要在結構體中的每個定義中都加上生命週期註解。

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    // first sentence 的生命週期與 novel 相同
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");

    // ImportantExcerpt 的生命週期與 first_sentence 相同
    // novel 在 ImportantExcerpt 離開作用域之前也不會離開作用域
    let i = ImportantExcerpt {
        part: first_sentence,
    };
}
```

## 生命週期省略

每個參考都有其生命週期，但有時候生命週期可以由借用檢查器推斷出來，因此我們可以省略生命週期註解。

例如之前的範例，雖然參數與回傳值均為參考，但仍可以編譯成功

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

Rust 有一個生命週期省略規則 (lifetime elision rules)，用來分析參考。
如果你的程式碼符合生命週期省略規則時，你就不必顯式寫出生命週期。

在函式或方法參數上的生命週期稱為輸入生命週期 (input lifetimes)，而在回傳值的生命週期則稱為輸出生命週期 (output lifetimes)。

當參考沒有顯式註解生命週期時，編譯器會用三項規則來推導。
第一個規則適用於輸入生命週期，而第二與第三個規則適用於輸出生命週期。
如果編譯器處理完這三個規則，卻仍有參考無法推斷出生命週期時，編譯器就會停止並回傳錯誤。

### 第一個規則：編譯器會給予每個參考參數一個生命週期參數

如果一個函式只有一個參數的話，就只會有一個輸入生命週期。兩個參數的話，就會有兩個輸入生命週期，以此類推。

```rust
// 這個函式有一個參數 `x`，它的生命週期是 `'a`。
fn foo<'a>(x: &'a i32) {}
// 這個函式有兩個參數 `x` 與 `y`，它們的生命週期分別是 `'a` 與 `'b`。
fn foo<'a, 'b>(x: &'a i32, y: &'b i32) {}
```

### 第二個規則：如果只有一個輸入生命週期，那麼它就會被賦予所有輸出生命週期

```rust
fn foo<'a>(x: &'a i32) -> &'a i32 {}
```

### 第三個規則：如果有多個輸入生命週期，但其中一個參考是 `&self` 或 `&mut self`，那麼 `self` 的生命週期就會被賦予所有輸出生命週期

參數中如果有 `self`，代表這是一個方法，而 `self` 的生命週期就會被賦予所有輸出生命週期。

此規則讓方法更容易讀寫，因為不用寫更多符號出來

來看幾個例子，例如下方的程式碼是符合規定，根據第一個規則與第二個規則，編譯器可以很清楚的知道參數與回傳值的生命週期。

```rust
fn first_word(s: &str) -> &str {}

// 根據第一個規則，每個參數都會有自己的生命週期，因此 s 的生命週期是 `'a`
fn first_word<'a>(s: &'a str) -> &str {}

// 根據第二個規則，如果只有一個輸入生命週期，那麼該生命週期會被賦予所有輸出生命週期
// 因此回傳值的生命週期也是 `'a`
fn first_word<'a>(s: &'a str) -> &'a str {}
```

來看一個編譯器無法判斷的例子。

```rust
fn longest(x: &str, y: &str) -> &str {}

// 根據第一個規則，每個參數都會有自己的生命週期，因此 x 與 y 的生命週期是 `'a` 與 `'b`
// 根據第二個規則，如果只有一個輸入生命週期，那麼該生命週期會被賦予所有輸出生命週期
// 但因為輸入生命週期有兩個，所以第二個規則明顯不適用
fn longest<'a, 'b>(x: &'a str, y: &'b str) -> &str {}
```

## 在方法中定義生命週期註解

當我們在有生命週期的結構體上實作方法時，結構體的生命週期註解需要在 `impl` 關鍵字後方，與結構體 `ImportantExcerpt` 後方寫上。

```rust
impl<'a> ImportantExcerpt<'a> {
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("請注意：{}", announcement);
        self.part
    }
}
```

雖然有兩個輸入生命週期，但其中一個參數是 `&self`，因此根據第三個規則，`self` 的生命週期會被賦予所有輸出生命週期。

## 靜態生命週期

有一種特殊的生命週期，稱為靜態生命週期 (static lifetime)，它的生命週期會持續整個程式的執行期間。

```rust
let s: &'static str = "我有靜態生命週期。";
```

在使用靜態生命週期時，最好想一下該參考的生命週期是否真的會存在於整個程式期間，以及是否真的該活得這麼久。
