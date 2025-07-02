---
layout: default
parent: Database
nav_order: 7
---

# MySQL、SQLite 與 PostgreSQL 在加上 Foreign Key 上的差異。

前幾天在寫 Laravel ORM 時，發現有一句關係查詢語句在 SQLite 中非常慢。

```sql
SELECT *,
       (SELECT Count(*)
        FROM "comments" AS "laravel_reserved_1"
        WHERE "comments"."id" = "laravel_reserved_1"."parent_id") AS
           "children_count"
FROM "comments"
WHERE "post_id" = 100
  AND "parent_id" IS NULL
ORDER BY "children_count" DESC
```

使用 `EXPLAIN` 發現查詢做了全表掃描，這時我才發現 `parent_id` 竟然沒有被加上索引 (Index)。
在 `parent_id` 加上索引之後，查詢速度就變快非常多，基本上不到一秒就能返回結果。

找資料才發現，**只有 MySQL 預設會幫 Foreign Key 加上索引，但是 SQLite 與 PostgreSQL 並不會這麼做**。

所以如果你在 Laravel Database Migration 中使用這個 `foreignId` 方法來建立 Foreign Key。

```php
$table->foreignId('parent_id')
    ->nullable()
    ->constrained('comments')
    ->onDelete('cascade');
```

那麼就只有 MySQL 會加上索引，可以參考[MySQL 文件](https://dev.mysql.com/doc/refman/9.1/en/constraint-foreign-key.html)的說明。

> MySQL requires that foreign key columns be indexed; if you create a table with a foreign key constraint but no index on a given column, an index is created.

相反的，PostgreSQL 與 SQLite 並不會這麼做，可以參考[PostgreSQL 文件](https://www.postgresql.org/docs/current/ddl-constraints.html)的說明。

> Because this is not always needed, and there are many choices available on how to index, the declaration of a foreign key constraint does not automatically create an index on the referencing columns.
