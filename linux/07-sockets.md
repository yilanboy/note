---
layout: default
parent: Linux
nav_order: 7
---

# 什麼是 Sockets

Sockets 是作業系統為了不同進程之間的溝通而提供的一層抽象層，不論是在同一台機器上還是透過網路跨越多台機器。

Socket = IP Address + Port Number，可以用來標識網路上的一個通訊端點。

> 所以 192.168.1.5:22 就是一個 Socket。

Socket 運作在 OSI 模型的傳輸層（Layer 4），會將資料打包成 TCP（Transmission Control Protocol） 或 UDP（User Datagram Protocol）封包，並透過網路層（Layer 3）傳送到目的地。
所以 TCP 與 UDP 也是 Socket 的主要通訊協定。

除了網路，Socket 也可以用於同一台機器上的進程間通訊（Inter-Process Communication, IPC），例如 Unix Domain Sockets（簡稱 UDS）。UDS 的速度通常比透過網路的 Socket 快，例如 PostgreSQL 與 Redis 的客戶端指令工具都是使用 UDS。

UDS 不使用 IP Address 與 Port Number，而是使用檔案系統中的路徑來標識通訊端點，例如 `/var/run/postgresql/.s.PGSQL.5432` 或者是 `/tmp/app.sock`，所以速度會比透過網路的 Socket 快很多。

## 什麼是 Anonymous Pipes？

Anonymous Pipes（匿名管道）是一種用於在同一台機器上的不同進程之間進行通信的機制。它們通常用於父子進程之間的數據傳輸。匿名管道是單向的，意味著數據只能從一個端點流向另一個端點。它們不需要命名，因此只能在創建它們的進程及其子進程之間使用。

## 什麼是 Ephemeral Ports？

Ephemeral Ports（臨時端口）是操作系統在需要時動態分配給應用程序的短暫端口號。這些端口號通常用於客戶端應用程序在與服務器建立連接時使用。Ephemeral Ports 的範圍通常在 49152 到 65535 之間，但具體範圍可能因操作系統而異。當應用程序關閉連接後，這些端口號會被釋放並可供其他應用程序使用。

## 什麼是 File Descriptor？

File Descriptor（文件描述符）是操作系統用來表示打開的文件、Socket 或其他輸入/輸出資源的整數標識符。在 Unix 和類 Unix 系統中，文件描述符是非負整數，通常從 0 開始分配。標準輸入、標準輸出和標準錯誤分別對應文件描述符 0、1 和 2。文件描述符允許程序通過統一的接口來讀寫不同類型的資源。
