---
layout: default
parent: Rust
nav_order: 41
---

# `RefCell<T>` 與內部可變性模式

因為 Rust 編譯器較為保守的關係，
在某些情況下，即使你知道程式碼的借用方式沒有問題，但還是有可能無法通過 Rust 的編譯。
這時候就可以考慮使用 `RefCell<T>`。

`RefCell<T>` 允許在執行時檢查可變參考，你可以改變 `RefCell<T>` 內部的數值，就算 `RefCell<T>` 是不可變的。

> 類似於 `Rc<T>`，`RefCell<T>` 也只能用於單一執行緒（Single-Threaded）的場合。

在某些特定情況，我們會想要有一個可以改變數值的方法，但該數值對其他程式碼而言仍然是不可變的。
例如撰寫測試時常用到的模擬物件 (Mock Objects)。
