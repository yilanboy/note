---
layout: default
parent: Rust
nav_order: 7
---

# 所有權 (Ownership)

所有權為 Rust 最獨特的功能，這讓 Rust 不需要垃圾回收就可以保障記憶體安全。

一些語言具有垃圾回收機制 (Garbage Collection)，程式會在執行時不停的尋找不再使用的記憶體，將這些記憶體釋放並歸還給作業系統。另外一些語言需要由開發者自行分配並釋放記憶體 (例如 C 語言)。

Rust 選擇第三種方式，通過**所有權**管理記憶體。

## Stack 與 Heap

在介紹 Rust 的所有權之前，先簡單的介紹什麼是 Stack 與 Heap。

Stack 與 Heap 都是程式執行時可供使用的記憶體，但是它們結構不同。

### Stack

**值存儲時時會按照順序放入，並以相反的順序取出**。

這類似疊盤子與取出盤子的方式，新放置的盤子只能疊在原放置盤子的上方，拿走盤子時也只能取下最上方的盤子。

這種取資料的方式為後進後出 (last in, first out)。

增加資料叫做 pushing onto the stack，移出資料叫做 popping off the stack。

Stack 的操作十分迅速，因為資料存取的位置總在 Stack 頂部，因此不需要尋找位置存放或是讀取資料。

另一個讓 Stack 操作快速的原因是 Stack 中所有資料都**必須占用已知且固定的大小**。

### Heap

**在編譯大小未知或是大小可能變化的資料，應該改為儲存在 Heap 上**。

Heap 是缺乏組織的，當要向 Heap 放入資料時，需要請求一定大小的空間，作業系統會在 Heap 的某處找到一塊足夠大的空間來存放資料，並將其標記為已使用，並返回一個該位置位址的指標 (pointer)，這個過程稱為在 Heap 上**分配記憶體 (allocating on the heap)**，有時候簡稱為分配 (allocating)。

**注意在 Stack 上放置資料並不被認為是分配，因為指標的大小事已知且固定的**。

訪問 Heap 上的資料會比訪問 Stack 上的資料慢，因為必須通過指標去訪問資料。

現代處理器在記憶體中跳轉次數越少就越快 (Cache)。

假設一個服務生在處理餐廳的點餐，最有效率的點餐方式就是一桌全部點完換下一桌，如果從 A 桌點完一道菜就換 B 桌點一道菜，B 桌點完又換回 A 桌點一道菜，這會導致效率很差。

因此，處理器在處理彼此位址較接近的資料 (例如 Stack) 會比較快，處理彼此位址較遠的資料 (例如 Heap) 會比較慢。

此外在 Heap 上分配大量的空間也有可能導致效率變差。

### Rust 所有權要處理的問題

當你的程式碼調用函式時，傳遞給函式的值 (包括可能指向 Heap 上資料的指標) 和函式的局部變數會被加入 Stack 中，當函式結束時，這些值就會被移出 Stack。

跟蹤哪部分程式碼正在使用 Heap 上的哪些資料，最大限度地減少 Heap 上重複資料的數量，以及清理 Heap 上不再被使用的資料，確保記憶體空間不會耗盡，這些問題正是 Rust 所有權所要處理的問題。

## 所有權規則

Rust 所有權的規則：

- 每一個值都有一個所有者 (Each value in Rust has an owner)。
- 一次只有能有一個所有者 (There can only be one owner at a time)。
- 當所有者離開作用域，這個值將被丟棄 (When the owner goes out of scope, the value will be dropped)。

## 變數作用域

舉一個例子來看變數的作用域，假設我們有一個變數。

```rust
let s = "hello";
```

這個變數從宣告的點開始直到當前作用域結束前都有效。

```rust
{
                     // s 在這裡無效，因為它尚未被宣告
    let s = "hello"; // 從這裡開始，s 是有效的
                     // 到這裡 s 依然有效
}                    // 作用域結束，s 不再有效
```

這裡有兩個重要的時間點：

- 當 `s` 被宣告進入作用域時，它是有效的。
- `s` 的有效性會一直持續到離開作用域為止。

## String 類型

字符串字面量 (string literal) 雖然很方便，但並不適合使用文本的每一種場景，因為字符串字面量是不可變的。

並不是所有字符串總是能在寫程式碼的時候提前得知，例如需要請用戶輸入的資料。

```rust
let s = "hello" // 這個 hello 就是 string literal
```

想要獲取用戶輸入的資料並儲存，可以使用 Rust 的另外一種字符串類型 `String`。

這個類型會將資料分配到 Heap 上，所以可以儲存未知大小的文本，我們可以使用 `from` 來接收我們給定的字符串並建立 `String`。

```rust
let s = String::from("hello");
```

`::` 是運算符，用來調用放置於 `String` 類型命名空間 (namespace) 底下的 `from` 函式。

注意 `String` 字符串是可以被修改的。

```rust
let mut s = String::from("hello");

s.push_str(", world!"); // push_str() 在原本的字符串後面追加字符串

println!("{}", s); // 會印出 hello, world
```

## 記憶體與分配

字符串字面值在我們編譯時就能知道其內容，所以文本直接被硬編碼 (hardcoded) 至可執行文件中，這使得字符串字面值相當高效率，這得益於它的不可變性。

對於 `String` 類型，為了支持一個可變的文本，需要在 Heap 上分配一塊用來存放未知大小的記憶體，這也代表：

- 必須在執行時向作業系統請求記憶體。
- 當我們處理完 `String` 時，需要一個將記憶體歸還給作業系統的方法。

第一點在調用 `String::from` 時就已經實現 (implementation)。

第二點根據各語言而有所不同，有垃圾回收機制的語言會幫我們處理，而沒有垃圾回收機制的語言，就需要開發者自行判讀不再使用的記憶體，並調用程式碼進行釋放。

Rust 採取了一個不同於垃圾回收的策略，**一旦擁有該記憶體的變量離開作用域，記憶體將自動釋放**。

```rust
{
    let s = String::from("hello"); // 從此處起，s 是有效的
                                   // 這裡依然可以使用 s
}                                  // 此作用域已结束，Rust 調用 drop 釋放記憶體
                                   // s 不再有效
```

當 `s` 離開作用域，Rust 會自動幫我們調用一個特殊函式 `drop` 釋放記憶體。

## 變數與資料交互的方式 : 移動 (Move)

```rust
let x = 5;
let y = x;
```

如果以其他程式碼的角度去猜測上述程式碼做了什麼，應該是將 `5` 賦值給 `x`，接著將 `x` 的值在賦值給 `y`。因此我們有兩個變數 `x` 與 `y`，且其值都是 `5`。

事實上在 Rust 中也是這麼運作的，因為 `5` 為固定的整數，所以 `x` 與 `y` 這兩個變數都被放入了 Stack 中，並在記憶體中保留了起來。

```rust
let s1 = String::from("hello");
let s2 = s1;
```

雖然與上面範例的類似，但 `String` 類型會將資料儲存在 Heap 中，Rust 為了避免效能損耗，並不會如同上面的範例，建立一個新的記憶體空間來存放 `s2`。

假設不建立記憶體而是採用指針指向同一個記憶體空間的方式 (類似 PHP 的引用)，這會與 Rust 所有權的特性相衝突。

<img src="https://allen-files.s3.ap-northeast-1.amazonaws.com/images/rust/ownership-1.jpg" alt="ownership-1" width="40%">

舉例來說，如果 `s1` 與 `s2` 都離開作用域，會導致 Rust 重複釋放相同的記憶體而出現二次釋放的錯誤 (double free)。

為了確保記憶體安全，如果**嘗試拷貝被分配的記憶體空間**，在剛才的範例中 Rust 就不會繼續認為 `s1` 有效，而是將 `s1` 的值轉移給 `s2`。

```rust
let s1 = String::from("hello");
let s2 = s1;

println!("{}, world!", s1); // error, value used here after move
```

在 Rust 中，這種操作被稱為**移動 (Move)**，如下圖所示：

<img src="https://allen-files.s3.ap-northeast-1.amazonaws.com/images/rust/ownership-2.jpg" alt="ownership-2" width="40%">

## 變數與資料交互的方式 : 克隆 (Clone)

如果我們確實需要複製 Heap 上的資料，可以使用 `clone` 這個通用函式。

```rust
let s1 = String::from("hello");
let s2 = s1.clone();

println!("s1 = {}, s2 = {}", s1, s2);
```

## 拷貝在 Stack 上的資料

如剛剛的範例。

```rust
let x = 5;
let y = x;

println!("x = {}, y = {}", x, y);
```

為什麼這裡沒有使用 `clone`，`y` 卻依然有效？

原因就在於 `5` 為整數，在編譯時就已經知道其大小並被儲存在 Stack 上，因此拷貝是很快速的，沒有必要在建立 `y` 變數之後使 `x` 無效。

Rust 有一個叫做 `Copy` 的特殊註解，可以用在類似整數這樣儲存在 Stack 上的類型。

如果一個類型擁有 `Copy` trait，舊的變數再將其賦值給其他變數後依然可以使用。

以下這些簡單標量的組合或是不需要分配記憶體的資源，其類型是 `Copy` 的。

- 所有整數類型，例如 `u32`。
- 布爾類型，例如 `bool`，只有 `true` 與 `false`。
- 所有浮點類型，例如 `f64`。
- 字符相關，例如 `char`。
- 元組，且其元素都是 `Copy` 的時候，例如 `(i32, i32)`，而 `(i32, String)` 就不是。

## 所有權與函式

當呼叫函數並傳入參數時，所有權也會跟著一起轉移進入函數。

```rust
fn main() {
    let s = String::from("hello");        // s 進入作用域

    takes_ownership(s);                   // s 的值進入函數中
                                          // 這裡 s 不再有效

    let x = 5;                            // x 進入作用域

    makes_copy(x);                        // x 應該進入函數中
                                          // 但是 x 為 i32 類型，屬於 Copy
                                          // 所以 x 後續可以繼續使用
    let nums = vec![2, 2, 1];             // nums 進入作用域
    let mut ans = 0;                      // ans 進入作用域

    for i in nums {                       // nums 進入迴圈中，所有權轉移
                                          // 如果想在迴圈結束後繼續使用 nums，可以使用 &nums 或是 nums.iter()
        ans += i;
    }                                     // 迴圈結束，nums 不再有效

    println!("{:?}", ans);


}                                         // 這裡 x 與 ans 移出了作用域,
                                          // 這裡 s 的值已經被移走，所以 s 這裡不會發生任何事情

fn takes_ownership(some_string: String) { // some_string 進入作用域
    println!("{}", some_string);
}                                         // 這裡 some_string 移出作用域並調用 drop 方法。占用的記憶體被釋放

fn makes_copy(some_integer: i32) {        // some_integer 進入作用域
    println!("{}", some_integer);
}                                         // 這裡 some_integer 移出作用域。但不會有特殊操作
```

## 返回值與作用域

返回值也可以轉移所有權。

```rust
fn main() {
    let s1 = gives_ownership();                       // gives_ownership 將返回值移給 s1
    let s2 = String::from("hello");                   // s2 進入作用域
    let s3 = takes_and_gives_back(s2);                // s2 被移動到 takes_and_gives_back 中，但返回給 s3
}                                                     // 這裡 s3 移出作用域並被 dropped，s2 已經被移走，所以不會有任何操作
                                                      // s1 移出作用域並被 dropped

fn gives_ownership() -> String {                      // gives_ownership 將返回值移動給調用它的函數
    let some_string = String::from("yours");          // some_string 進入作用域

    some_string                                       // 返回 some_string 給調用它的函數
}

// 傳入 String 並返回該值
fn takes_and_gives_back(a_string: String) -> String { // a_string 進入作用域
    a_string                                          // 返回 a_string 給調用它的函數
}
```

如果傳入函式的值，後續想要繼續使用的話，可以使用元組來返回多個值。

```rust
fn main() {
    let s1 = String::from("hello");

    let (s2, len) = calculate_length(s1);

    println!("The length of '{}' is {}.", s2, len);
}

fn calculate_length(s: String) -> (String, usize) {
    let length = s.len(); // len() 返回字符串的長度

    (s, length)
}
```

但這好像還是有點麻煩，Rust 為此提供另外一個功能，叫做引用 (references)。
