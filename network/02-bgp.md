---
layout: default
parent: Network
nav_order: 2
---

# BGP

BGP (Border Gateway Protocol) 是網際網路的郵政服務。在現實世界中，當有人將信封投進郵筒時，郵政服務就會選擇一條快速且高效的路線，將信封頭遞給收件人。同樣的，當有人在網際網路發送資料時，BGP 會負責找尋所有能到達資料收件者的路徑，並選擇最佳的路由將資料傳遞給收件者。在這個過程中，資料可能會在不同的自治系統間傳遞。

> 需要注意的是，BGP 是規定路由怎麼傳遞的協議，而不是規定流量怎麼傳遞的協議。當路由透過 BGP 傳遞後，實際的流量會透過路由規則進行傳遞。

## 什麼是自治系統 (Autonomous System，AS)

網際網路是由成千上萬個自治系統組成的，自治系統本身也是一個小型網路，一個由大型組織 (通常是 ISP) 運行的大型路由器池。各家 ISP 會透過 BGP 來交換自家自治系統的路由資料，確保當傳遞的資料需要跨自治系統時，也能將資料送往正確的位置。

AS 會帶有自己的編號 (number)，範圍為 16 位元，也就是 0 ~ 65535 ($2^{16}$)。

## eBGP 與 iBGP

BGP 的連線可以分為 eBGP (external) 或是 iBGP (internal)，這取決兩個 BGP 是否擁有相同的 AS 編號，如果 AS 編號不相同為 eBGP，相同則為 iBGP。

iBGP 如果收到來自 eBGP 的路由更新，會將這個路由更新傳遞給其他 iBGP 的鄰居 (neighbor)。

```text
R1 (AS 100) ---- eBGP ---- R2 (AS 200) ---- iBGP ---- R3 (AS 200)

R1 IP: 192.168.1.1
R2 IP: 192.168.1.2
R3 IP: 192.168.1.3
```

R2 如果收到來自 R1 的路由更新，會將這個路由更新傳遞給 R3。

此時如果看 R2 的路由表，會發現有一個來自 R1 的路由更新，並且這個路由的下一跳 (next-hop) 是 R1 的 IP。

```bash
show ip route
```

**需要注意的是**，當 R2 把路由傳遞給 R3 時，下一跳的 IP 並不會改變，仍然是 R1 的 IP。
這樣會導致 R3 無法將資料傳遞給 R1，因為 R3 並沒有辦法直接訪問 R1。

所以我們需要設定 `next-hop-self`，讓 R2 在把路由更新傳遞給 R3 時，將下一跳改成自己的 IP。

```text
neighbor ibgp next-hop-self force
```

## eBGP Policy

FRRouting 要建立 eBGP peering 會要求設定過濾政策 (policy)，如果不設定的話就無法更新路由。如果真的不想設定政策，可以在 `vtysh` 中設定。

```bash
# 進入 vtysh
sudo vtysh

# 進入設定
config t

no bgp ebgp-requires-policy
```

想設定政策的話可以使用 `ip prefix-list` 與 `route-map` 來設定。

```bash
# 進入 vtysh
sudo vtysh

# 進入設定模式
config t

# 新增名為 R1-FILTER 的 ip prefix list
ip prefix-list R1-FILTER seq 5 permit 11.50.96.0/21
ip prefix-list R1-FILTER seq 10 permit 11.60.96.0/19

# 離開設定模式
end

# 查看 ip prefix list
show ip prefix list
# ip prefix-list R1-FILTER: 2 entries
#    seq 5 permit 11.50.96.0/21
#    seq 10 permit 11.60.96.0/19

# 進入設定模式
config t

# 設定 route map，過濾掉剛剛 ip prefix list 中設定為 permit 的內容
# 這裡的 10 為優先順序
route-map R1-FILTER deny 10
match ip address prefix-list R1-FILTER
# 沒有設定 match，代表所有情況
route-map R1-FILTER permit 20

end

show route-map
# route-map R1-FILTER, deny, sequence 10
#   Match clauses:
#     ip address prefix-lists: R1-FILTER
#   Set clauses:
#   Policy routing matches: 0 packets, 0 bytes
# route-map R1-FILTER, permit, sequence 20
#   Match clauses:
#   Set clauses:
#   Policy routing matches: 0 packets, 0 bytes

config t

# 進入 bgp 34512 的設定
router bgp 34512

neighbor 192.168.12.1 router-map R1-FILTER in
```

## BGP 選路規則

BGP 有一套選路規則 (Path Selection Rules)，當收到多條路由時，會根據這些規則來選擇最佳路由。

- Preferred Value (較高的優先權值)
- Local Preference (較高的本地優先權)
- 優選本地路由 (本地宣告的路由優於別人傳播的路由)
- AS Path (較短的 AS Path)
- Origin
- MED
- EBGP 路由優於 IBGP 路由
- BGP 下一跳 IGP Metric 較小的路由
- 以上全部相同，則為等價路由

每個規則可以記住三個點。

- 預設值 (Default)，例如 Preferred Value 預設值為 0，Local Preference 預設值為 100。
- 傳達範圍。Preferred Value 只影響本地路由，Local Preference 只影響本地 AS。
- 作用方式，數值越大，優先權越高，還是數值越小，優先權越高

### Preferred Value

- 預設值為 0，數值越高，優先權越高。
- 可以使用 Route Policy 來設定 Preferred Value，讓不同的路由走不同的路。

### Local Preference

- 預設值為 100，數值越高，優先權越高。範圍為本地 AS，不影響其他 AS。
- 從 eBGP 鄰居收到的路由，Local Preference 不會被帶入本地 AS，所以查看路由表會發現 Local Preference 的值都是 空值。
- 路由傳給 iBGP 鄰居時，如果 Local Preference 為空值，則會帶上預設值 100 並傳給 iBGP 鄰居。
- 如果路由有設定 Local Preference，只有在收到空值的 Local Preference 時，才會去覆蓋 Local Preference。
- 可以使用 Route Policy 來設定 Local Preference，讓不同的路由走不同的路。

### 優選本地路由

- 本地宣告的路由優於別人傳播的路由。
- 可以使用 `network` 指令來宣告本地路由。

### AS Path

- 默認穿越過一個 AS 後，會打上一個 AS Path。
- AS Path 越短，優先權越高。
- AS Path 可以避免回路 (loop)，因為如果收到的路由中有自己的 AS 編號，代表這個路由是回到自己的 AS，會被捨棄。

### Origin

Origin 有三種值，分別為 IGP、EGP 和 Incomplete。

- IGP (Interior Gateway Protocol)：代表路由是從 IGP (例如 OSPF、RIP) 宣告的，優先權最高，符號為 `i`。
- EGP (Exterior Gateway Protocol)：代表路由是從 EGP 宣告的，優先權次之，符號為 `e`。
- Incomplete：代表路由是從其他方式 (例如 static route) 宣告的，優先權最低，符號為 `?`。

如果通過以上三種方式學到相同 BGP 路由前綴，那麼優先選擇順序是 IGP > EGP > Incomplete。

### MED (Multi-Exit Discriminator)

- 預設值為 0，數值越小，優先權越高。
- MED 僅在兩個 AS 之間傳遞，收到 MED 的 AS 不會將 MED 傳遞給其他 AS。
- MED 在同一個 AS 內會互相傳遞，但出了 AS 就會拿掉。

### EBGP 路由優先於 IBGP 路由

- 當收到相同的路由前綴時，EBGP 的路由優先於 IBGP 的路由。

## 參考資料

- [什麼是 BGP？ | 解釋 BGP 路由](https://www.cloudflare.com/zh-tw/learning/security/glossary/what-is-bgp/)
- [About Border Gateway Protocol (BGP)](<https://www.watchguard.com/help/docs/help-center/en-US/Content/en-US/Fireware/dynamicrouting/bgp_about_c.html?tocpath=Fireware%7CConfigure%20Network%20Settings%7CRoutes%20and%20Routing%7CAbout%20Border%20Gateway%20Protocol%20(BGP)%7C_____0>)
- [Prefix List and Route Maps with BGP](https://www.youtube.com/watch?v=ozDa2agSIXc)
- [FRRouting BGP Documentation](https://docs.frrouting.org/en/latest/bgp.html)
