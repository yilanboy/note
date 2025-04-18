# Isolation Level

## 什麼是隔離級別 (Isolation Level)？

Isolation Level 是資料庫管理系統 (Database Management System, DBMS) 提供的一種功能，用來控制多個交易 (Transaction) 之間的互動。當多個交易同時存取資料庫時，可能會發生一些問題，例如：

- Dirty Read (髒讀) 是指在一個交易 (Transaction) 中，能夠讀取到另一個尚未提交 (uncommitted) 事務所修改的資料。
  - 如果那個尚未提交的事務後來進行回滾 (Rollback)，那麼已經讀到該筆舊資料或中途狀態資料的交易，就讀到了一個「髒」的數據 -- 意即沒有真正被最終確定下來的數據。
  - Dirty Read 通常發生在最低的隔離級別，也就是 Read Uncommitted，但這個隔離級別並不常使用，目前主流資料庫預設的級別都是 Read Committed。
- Non-Repeatable Read：一個交易讀取到另一個交易已提交的資料，但在同一個交易中，再次讀取時，資料已經被修改。
- Phantom Read：一個交易讀取到另一個交易已提交的資料，但在同一個交易中，再次讀取時，資料筆數已經增加或減少。

這些問題都是因為多個交易同時存取資料庫時，資料庫管理系統沒有提供足夠的隔離性，導致資料不一致。

## 隔離級別 (Isolation Level)

為了解決這些問題，資料庫管理系統提供了不同的隔離級別 (Isolation Level)。不同的隔離級別提供不同的隔離性，也就是不同的交易之間的互動程度。

常見的隔離級別有四個：

1. Read Uncommitted
2. Read Committed
3. Repeatable Read
4. Serializable

### Read Uncommitted

Read Uncommitted 是最低的隔離級別，它允許交易讀取到其他交易尚未提交的資料。這個隔離級別的問題最多，因為它允許 Dirty Read、Non-Repeatable Read 和 Phantom Read。

### Read Committed

Read Committed 是一個比較常見的隔離級別，它保證一個交易只能讀取到其他交易已經提交的資料。這樣可以避免 Dirty Read，但仍然可能發生 Non-Repeatable Read 和 Phantom Read。

### Repeatable Read

Repeatable Read 是一個比較嚴格的隔離級別，它保證一個交易在同一個交易中多次讀取同一筆資料時，資料不會被修改。這樣可以避免 Non-Repeatable Read，但仍然可能發生 Phantom Read。

### Serializable

Serializable 是最嚴格的隔離級別，它保證一個交易在同一個交易中多次讀取同一筆資料時，資料不會被修改，並且保證一個交易在同一個交易中多次讀取同一筆資料時，資料的筆數不會被修改。這樣可以避免 Non-Repeatable Read 和 Phantom Read。

## 隔離級別的選擇

不同的隔離級別提供不同的隔離性，也就是不同的交易之間的互動程度。一般來說，隔離級別越高，資料庫管理系統的效能就越差，因為需要更多的鎖來保證隔離性。

在選擇隔離級別時，需要根據應用的需求來決定。如果應用需要高度的隔離性，可以選擇 Serializable；如果應用對隔離性要求不高，可以選擇 Read Committed。

## 參考資料

- [Isolation (database systems)](https://en.wikipedia.org/wiki/Isolation_(database_systems)
- [Transaction Isolation Levels](https://www.postgresql.org/docs/17/transaction-iso.html
