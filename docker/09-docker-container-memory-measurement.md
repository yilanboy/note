---
layout: default
parent: Docker
nav_order: 9
---

# Docker 容器記憶體量測指南

## 快速查看 — 即時用量與上限

```bash
sudo docker stats <容器名稱> --no-stream
```

**參數說明：**

- `sudo` — 以 root 權限執行，Docker 指令通常需要 root 才能存取容器資訊
- `docker stats` — 顯示容器的即時資源使用狀況（CPU、記憶體、網路、磁碟 I/O）
- `<容器名稱>` — 指定要查看的容器名稱或 ID，例如 `fluent-bit`
- `--no-stream` — 只擷取一次當下的數據後立即結束，不持續更新；若不加此參數則會像 `top` 一樣持續刷新

**輸出範例：**

```text
CONTAINER ID   NAME         CPU %   MEM USAGE / LIMIT   MEM %
5585bea453f6   fluent-bit   0.02%   22.33MiB / 128MiB   17.44%
```

**欄位說明：**

- **MEM USAGE** — 容器目前實際使用的記憶體量（以 cgroup 計算，包含 page cache）
- **LIMIT** — 建立容器時透過 `--memory` 設定的記憶體上限
- **MEM %** — 目前用量佔上限的百分比

## 行程層級詳細分析 — VmRSS / VmPeak

`docker stats` 的數字包含 page cache，不一定能反映行程真實的記憶體用量高峰。若要查看行程本身的 RSS（常駐記憶體）與歷史峰值，可直接從主機讀取 Linux `/proc` 虛擬檔案系統：

```bash
sudo cat /proc/$(sudo docker inspect <容器名稱> --format '{{.State.Pid}}')/status \
  | grep -E 'Name|VmRSS|VmPeak|VmSwap'
```

**指令拆解說明：**

1. `sudo docker inspect <容器名稱> --format '{{.State.Pid}}'`
   - `docker inspect` — 取得容器的詳細設定與狀態資訊（JSON 格式）
   - `--format '{{.State.Pid}}'` — 使用 Go template 語法，只擷取容器主行程的 PID（行程 ID）

2. `$( ... )` — Shell 的指令替換（command substitution），將括號內指令的輸出作為外層指令的參數

3. `/proc/<PID>/status` — Linux 核心為每個行程提供的虛擬檔案，記錄該行程的記憶體使用詳情

4. `grep -E 'Name|VmRSS|VmPeak|VmSwap'`
   - `grep` — 篩選符合條件的行
   - `-E` — 啟用擴展正規表示式（Extended Regex），允許用 `|` 表示「或」
   - `'Name|VmRSS|VmPeak|VmSwap'` — 只顯示包含這四個關鍵字的行

**輸出範例：**

```text
Name:   fluent-bit
VmPeak:    99768 kB   # 行程啟動以來的記憶體使用最高峰
VmRSS:     20892 kB   # 目前常駐於實體記憶體的大小
VmSwap:        0 kB   # 被置換到磁碟的記憶體大小
```

| 欄位       | 意義                                          | 用途                           |
| ---------- | --------------------------------------------- | ------------------------------ |
| **VmPeak** | 行程啟動至今使用過的最高記憶體量              | 用來決定容器記憶體上限的基準值 |
| **VmRSS**  | 目前實際佔用的實體記憶體（Resident Set Size） | 反映當下的記憶體壓力           |
| **VmSwap** | 已被置換（swap）到磁碟的記憶體量              | 對延遲敏感的服務應維持為 0     |

## 查看容器設定的記憶體上限

```bash
sudo docker inspect <容器名稱> --format '{{.HostConfig.Memory}}'
```

**參數說明：**

- `docker inspect` — 取得容器的完整設定資訊
- `--format '{{.HostConfig.Memory}}'` — 使用 Go template 語法，只擷取 `HostConfig.Memory` 欄位，回傳值為 **bytes（位元組）**

**常見數值對照：**

- `134217728` = 128 MB（128 × 1024 × 1024）
- `33554432` = 32 MB（32 × 1024 × 1024）
- `0` = 未設上限（unlimited）

## 如何決定適合的記憶體上限

1. 在正常負載下收集 **VmPeak**；若可能，也在 BGP 收斂風暴等突發情境下收集。
2. 在 VmPeak 基礎上加約 **33% 的緩衝空間**，以吸收突發峰值。
3. 用 `docker stats` 確認穩定狀態下的 MEM % 應遠低於 50%。

**本專案實際案例（Azure / AWS FC 節點的 fluent-bit）：**

| 指標            | 數值                             |
| --------------- | -------------------------------- |
| 觀測到的 VmPeak | ~96–97 MiB                       |
| 舊上限          | 32 MB → 容易觸發 OOMKill         |
| 新上限          | 128 MB（VmPeak 之上約 33% 緩衝） |
| 穩定狀態 MEM %  | ~17%                             |

## 查看 OOMKill 歷史記錄

```bash
sudo docker inspect <容器名稱> --format 'RestartCount: {{.RestartCount}}  OOMKilled: {{.State.OOMKilled}}'
```

**參數說明：**

- `{{.RestartCount}}` — 容器自建立以來的重啟次數；若數值不為 0，代表容器曾因故重啟
- `{{.State.OOMKilled}}` — 布林值，`true` 表示容器最近一次是因 OOM（記憶體不足）被核心強制終止

**判斷原則：**

- `RestartCount` 不為 0 且記憶體上限偏低 → 高度懷疑曾發生 OOMKill
- `OOMKilled: true` → 確認最近一次重啟為 OOM 觸發

OOMKill 的危險在於 fluent-bit 的 in-memory buffer 會全部遺失，導致日誌在你最需要觀察的時刻（BGP 收斂、網路風暴）無聲無息地消失。
