---
layout: default
parent: Linux
nav_order: 6
---

# 使用 `df` 指令找出哪個資料夾佔據大量的硬碟空間

前幾天我們在 Grafana 上發現某台 VM 的硬碟空間在短時間內迅速減少。
為了找出原因，我們使用 `df` 與 `du` 指令，嘗試在 VM 中尋找到底是什麼東西佔據大量的硬碟空間。

`df` 指令是 Linux 系統中非常實用的工具，全稱為 Disk Free，主要用來顯示檔案系統的磁碟空間使用狀況。
它可以告訴你每個掛載點的總容量、已使用空間、可用空間以及使用百分比等資訊。

```bash
df -h
```

這裡的 `-h` 參數為 `--human-readable`。指令顯示結果如下。

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/root        29G  24G   4.1G  90% /
tmpfs           3.9G  4.0K  3.9G   1% /dev/shm
tmpfs           1.6G  1.5M  1.6G   1% /run
tmpfs           5.0M     0  5.0M   0% /run/lock
efivarfs        128M   26K  128M   1% /sys/firmware/efi/efivars
tmpfs            10M   16K   10M   1% /ramdisk
/dev/sda16      881M   59M  761M   8% /boot
/dev/sda15      105M  6.1M   99M   6% /boot/efi
tmpfs           794M   12K  794M   1% /run/user/1000
```

`/dev/root` 為根目錄，此時我們可以移動到根目錄，使用 `du` 指令找出哪個檔案佔據了大量的硬碟空間。

## 使用 `du` 指令找出哪個檔案佔據大量的硬碟空間

`du` 指令是 Linux 系統中用來顯示檔案及目錄所佔用的磁碟空間的強大工具。它的全稱是 Disk Usage，也就是「磁碟使用量」。

`du` 的常用選項如下：

- `-h`, `--human-readable`：以人類可讀的格式（如 KB、MB、GB）顯示輸出結果。
- `-s`, `--summarize`：只顯示指定目錄的總大小。
- `-a`, `--all`：顯示所有檔案和目錄的大小，包括空目錄。
- `-d`, `-max-depth=N`：只顯示指定深度內的目錄大小。
- `-x`, `--one-file-system`：在跨檔案系統時，不遞回計算子目錄的大小

```bash
# 在根目錄底下使用 du 指令
du -sh *
```

顯示結果 `var` 資料夾佔據大量的空間。

```text
23G var
```

接下來重複移動資料夾並使用 `du -h -d 1` 指令，發現是某個日誌檔案在短時間內被寫入大量的日誌，導致硬碟被佔滿。

## 將日誌檔案刪除並釋放硬碟空間

在使用 `rm` 指令將日誌檔案刪除後，再次使用 `df` 指令，會發現硬碟空間仍舊沒有被釋出。
這代表有程序仍舊在使用這個檔案。

使用 `lsof` 指令找出那個使用刪除檔案的程序。

```bash
lsof | egrep "deleted|COMMAND"
```

將程序重新啟動後，硬碟空間就成功的釋出了。這裡有幾個重點可以筆記：

- 使用 `rm` 等指令刪除一個檔案時，實際上只是將這個檔案在檔案系統中的目錄項刪除，讓系統知道這個檔案不再有效。但是，檔案的實際數據並不會立即從硬碟上擦除。
- `lsof` (List Open Files) 命令會列出系統中所有打開的檔案。即使一個檔案已經被標記為刪除，但只要有程序正在使用它，`lsof` 就可以找到它。

## 參考資料

- [Why is space not being freed from disk after deleting a file in Red Hat Enterprise Linux?](https://access.redhat.com/solutions/2316)
