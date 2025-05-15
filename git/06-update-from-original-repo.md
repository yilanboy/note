---
layout: default
parent: Git
nav_order: 6
---

# 跟上原始專案的更新

如果你的專案是從某一個專案 fork 出來的，當原始專案有更新時，你可以使用 `git pull` 來跟上原始專案的更新。

首先列出專案的遠端節點，通常只有一個 `origin`，也就是你 fork 出來的專案。

```bash
git remote -v

# origin	git@github.com:yilanboy/starter-kit.git (fetch)
# origin	git@github.com:yilanboy/starter-kit.git (push)
```

然後加入原始專案的遠端節點，遠端節點的名稱可以自行命名，我這裡使用 `upstream`。

```bash
git remote add upstream https://github.com/original-repo/starter-kit.git
```

再次列出專案的遠端節點，可以看到多了一個 `upstream`。

```bash
git remote -v

# upstream  https://github.com/original-repo/starter-kit.git (fetch)
# upstream  https://github.com/original-repo/starter-kit.git (push)
# origin    git@github.com:yilanboy/starter-kit.git (fetch)
# origin    git@github.com:yilanboy/starter-kit.git (push)
```

接下來就可以使用 `gut fetch` 來下載原始專案的更新了。

```bash
git fetch upstream

# 合併原始專案的更新到當前分支
git merge upstream/main

# 推送到自己的遠端專案
git push origin main
```

## 參考資料

- [為你自己學 Git - 怎麼跟上當初 fork 專案的進度？](https://gitbook.tw/chapters/github/syncing-a-fork)
