---
layout: default
parent: Git
nav_order: 7
---

# Revert 合併後的修改提交

在工作上與別人合作寫程式的時候，基於保險與禮貌，我們不能隨隨便便 Reset 別人的提交，而是應該使用 Revert 產生一個新的提交來撤銷原本的修改。

Revert 的指令相單簡單，不過如果你是想要 Revert 一個已經合併後的提交（Commit），那麼做法上會跟一般的提交有些不同，接下來就來簡單的說明一下。

## Revert 合併後的修改提交

簡單舉個例子，假設你現在有從別人的專案 Folk 出來的專案，然後我們剛剛從源專案拉下一個最新的合併提交。

嘗試一下對合併後的提交使用 Revert。

```bash
git revert HEAD --no-edit
```

應該會看到下面這個錯誤：

```text
error: commit 81561ca74c129f05df3b4c749b1c219e29d56abb is a merge but no -m option was given.
fatal: revert failed
```

這個錯誤之所以會發生，是因為**一個合併後的提交會有兩個父提交（Parent Commit）**，你必須要告訴 Git 你想 Revert 回哪一個父提交，我們使用 `git log` 查看這個提交的資訊。

```text
commit 81561ca74c129f05df3b4c749b1c219e29d56abb (HEAD -> main, origin/main, origin/HEAD)
Merge: b7a69245 8c46058e
Author: allen <allen@email.com>
Date:   Tue Jul 1 10:36:24 2025 +0800

    Merge pull request #1131 from allen/update-docker-logging-driver

    update docker logging driver from json-file to local
```

你可以看到這個 `81561ca` 這個合併提交有一個 `Merge` 資訊，裡面有兩個父提交的雜湊值。第一個父提交的雜湊值 `b7a69245` 代表的是合併時的目標分支最新的提交，第二個父提交的雜湊值 `8c46058e` 則是合併時的來源分支最新的提交。

> 假設我有一個 A 分支，如果我把 B 分支合併進來，那麼 A 分支為合併時的目標分支，B 分支為來源分支。

你可以使用 `git diff` 查看這兩個提交之間的差異，看看有哪些地方被修改。

```bash
git diff b7a69245 8c46058e
```

一般來說，如果想要 Revert 合併提交，通常是選擇 Merge 裡面的第一個父提交，也就是將 `-m` 指定為 `1`。

```bash
git revert 81561ca -m 1
```

執行指令後，你就會看到當前分支上多出了一個新的提交，這個提交將合併後的修改 Revert 回去第一個父提交了。

```text
commit 24f0310967b71db312c294363910b5e945aa0a5d
Author: Allen <allen@email.com>
Date:   Wed Jul 2 11:39:05 2025 +0800

    Revert "Merge pull request #1131 from allen/update-docker-logging-driver"

    This reverts commit 81561ca74c129f05df3b4c749b1c219e29d56abb, reversing
    changes made to b7a69245fd13cfdf5529453a96560263c1214218.
```

## 參考資料

- [How do I revert a merge commit that has already been pushed to remote?](https://stackoverflow.com/questions/7099833/how-do-i-revert-a-merge-commit-that-has-already-been-pushed-to-remote)
