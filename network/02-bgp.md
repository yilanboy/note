---
layout: default
parent: Network
nav_order: 2
---

# BGP

BGP (Border Gateway Protocol) 是網際網路的郵政服務。在現實世界中，當有人將信封投進郵筒時，郵政服務就會選擇一條快速且高效的路線，將信封傳遞給收件人。同樣的，當有人在網際網路發送資料時，BGP 會負責找尋所有能到達資料收件者的路徑，並選擇最佳的路由將資料傳遞給收件者。在這個過程中，資料可能會在不同的自治系統間傳遞。

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

neighbor 192.168.12.1 route-map R1-FILTER in
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

## BGP 額外特性

- EBGP 路由衰減 (BGP Route Dampening)：解決不穩定路由的問題。

## FRRouting 的簡單設定

### FRRouting BGP 設定檔案結構

我們 FRRouting 的 BGP 設定檔案結構可以分為以下幾個部分：

- `ip prefix-list ...`
- `bgp as-path access-list ...`
- `route-map ...`
- BFD
  - Profile
  - Peer
- router bgp
  - global settings
  - peer-group
  - neighbor

**第一個部分**為 IP Prefix List。參數說明可以參考 [FRRouting 的文件](https://docs.frrouting.org/en/latest/filter.html#ip-prefix-list)

```text
ip prefix-list aws-1 seq 10 permit 10.96.0.0/16 le 16
ip prefix-list aws-1 seq 20 permit 10.97.0.0/15 le 17
ip prefix-list aws-1 seq 30 permit 10.98.0.0/14 le 16
ip prefix-list aws-1 seq 31 permit 10.99.0.0/16 le 16
ip prefix-list aws-1 seq 40 permit 10.100.0.0/14 le 16
ip prefix-list aws-1 seq 50 permit 10.101.0.0/15 le 16
ip prefix-list aws-1 seq 60 permit 10.102.0.0/14 le 16
ip prefix-list aws-1 seq 70 permit 10.103.0.0/15 le 16
```

這些 IP Prefix List 用於定義一組 IP 前綴，用於過濾或匹配特定的路由。

詳細說明該如何解讀這些規則，以 `10.98.0.0/15 le 17` 與 `10.97.0.0/15 ge 17` 為例：

首先 `10.98.0.0/15` 這個前綴是表示 Network ID 的範圍，即 `10.97.0.0` 到 `10.98.0.0`。
接著的 `le 17` 表示匹配的前綴長度小於或等於 17。

`le` 表示 less than or equal to，另外還有 `ge` 表示 greater than or equal to。

所以 `10.98.0.0/15 le 17` 代表的是匹配下面的 CIDR 前綴：

- `10.98.0.0/15`
- `10.98.0.0/16`
- `10.98.0.0/17`
- `10.99.0.0/15`
- `10.99.0.0/16`
- `10.99.0.0/17`

以此類推的話，`10.98.0.0/15 ge 17` 代表的是匹配下面的 CIDR 前綴：

- `10.98.0.0/17`
- `10.99.0.0/17`

> 在 CIDR 表示法當中，`/16` 這個斜線後的數字稱為 Prefix Length (前綴長度) 或 Bit Mask（位元遮罩），
> 表示前 16 位元為網路位址 (Network ID)，後 16 位元為主機位址 (Host ID)。
>
> `le 16` 表示匹配的前綴長度長度小於或等於 16。

例如接下來我們可以使用 Route Map 來匹配這些前綴，並設定一些屬性，例如社群屬性 (Community Attribute)。

> BGP 社群屬性廣泛用於路由過濾和路由選擇。

```text
route-map aws-redistribute-selector permit 100
  description 'apply aws super net tag 4453'
  match ip address prefix-list aws-1
  set community additive 64972:4453
exit
```

> `additive` 關鍵字表示在現有的社群屬性基礎上添加新的社群屬性，而不是替換掉現有的社群屬性。

**第二個部分**為 AS Path Access List。參數說明可以參考 [FRRouting 的文件](https://docs.frrouting.org/en/latest/filter.html#bgp-as-path-access-list)

```text
bgp as-path access-list as-azure seq 10 permit ^646[5-6][0-9]$
```

這條 AS Path Access List 規則使用正規表達式來篩選 BGP 路由更新中的自治系統路徑 (AS Path)，
允許任何 AS Path 僅包含一個 AS 編號，且該編號在 64650 到 64669 範圍內的路由。

後續一樣可以在 Route Map 中使用這個 AS Path Access List 來匹配路由，並設定一些屬性，例如 MED。

```text
route-map from-azure permit 100
  ...
  match as-path as-azure
  ...
exit
```

### 建立鄰居

以下範例展示如何在 FRRouting 中設定 BGP 鄰居關係，包含 BFD (Bidirectional Forwarding Detection) 監控和 BGP 基本設定。

#### BFD 設定說明

BFD 用於快速偵測鄰居連線狀態，相比於 BGP，BFD 提供更多參數來讓你判斷什麼時候鄰居的連線狀態是異常的，
當連線中斷時能夠迅速切換路由。

以下是幾個常見 BFD 參數說明：

- `detect-multiplier 3`：偵測倍數，連續 3 次未收到回應就判定連線中斷
- `transmit-interval 300`：傳送間隔 300 毫秒
- `receive-interval 300`：接收間隔 300 毫秒
- `echo transmit-interval 50`：Echo 模式傳送間隔 50 毫秒
- `echo receive-interval 50`：Echo 模式接收間隔 50 毫秒
- `passive-mode`：被動模式，等待對方發起 BFD 連線
- `peer 35.229.225.152 interface gre1`：指定透過 gre1 介面與 35.229.225.152 建立 BFD
- `no shutdown`：啟用 BFD

#### BGP 設定說明

- `bgp router-id`：設定 BGP 路由器 ID，通常使用一個唯一的 IP 位址
- `bgp log-neighbor-changes`：記錄鄰居狀態變化的日誌
- `bgp always-compare-med`：始終比較 MED 值，即使來自不同 AS
- `bgp disable-ebgp-connected-route-check`：停用 eBGP 直連路由檢查
- `bgp graceful-restart`：啟用優雅重啟功能
- `bgp bestpath as-path multipath-relax`：放寬多路徑選擇的 AS Path 限制，允許更多等價路由，以實現負載平衡
- `neighbor example peer-group`：建立名為 "example" 的鄰居群組，便於統一管理多個相似的鄰居設定

#### 鄰居群組設定說明

鄰居群組 (peer-group) 允許將共同的設定套用到多個鄰居，以下是各參數說明：

- `remote-as 64512`：指定遠端 AS 編號為 64512
- `ebgp-multihop 255`：允許 eBGP 多跳，最大跳數為 255（用於非直連的 eBGP 連線）
- `disable-connected-check`：停用直連檢查，允許與非直連的鄰居建立 BGP 連線
- `advertisement-interval 0`：路由宣告間隔設為 0 秒（立即宣告）
- `timers 30 30`：設定 keepalive 時間為 30 秒，hold time 為 30 秒
- `timers connect 3`：TCP 連線建立的超時時間為 3 秒
- `timers delayopen 1`：延遲開啟時間為 1 秒
- `tcp-mss 1450`：設定 TCP 最大封包大小為 1450 bytes

```text
bfd
    profile example
        detect-multiplier 3
        transmit-interval 300
        receive-interval 300
        echo transmit-interval 50
        echo receive-interval 50
        passive-mode
        no shutdown
    !
    peer 35.229.225.152 interface gre1
        profile example
    !
exit
!
router bgp 65001
    bgp router-id 192.0.2.1
    bgp log-neighbor-changes
    bgp always-compare-med
    bgp disable-ebgp-connected-route-check
    bgp graceful-restart
    bgp bestpath as-path multipath-relax
    bgp ebgp-requires-policy
    !
    neighbor example-group peer-group
    neighbor example-group remote-as 64512
    neighbor example-group ebgp-multihop 255
    neighbor example-group disable-connected-check
    neighbor example-group advertisement-interval 0
    neighbor example-group timers 30 30
    neighbor example-group timers connect 3
    neighbor example-group timers delayopen 1
    neighbor example-group tcp-mss 1450
    !
    neighbor 35.229.225.152 peer-group example-group
exit
```

### 設定 AS Path Access-List 與 Route-Map

簡單說明幾個常見的 FRRouting BGP 設定。

這是一條 BGP AS Path Access-List 規則，它使用正規表達式 (Regular Expression, regex) 來篩選 BGP 路由更新中的自治系統路徑 (AS Path)。

```text
bgp as-path access-list as-med-region1-region2-asn seq 10 permit ^64958_64972_65001(_16880(_65[0-9][0-9][0-9]){1,10}){0,1}
```

上面設定的意思是，允許 (permit) 任何 AS Path 以 64958 → 64972 → 65001 開頭的路由，並且在 65001 之後可以選擇性地 (0 到 1 次) 經過 16880 及其後續的一系列私人 AS 號 (65000-65999)。

```text
route-map pol-med-region-pass-through permit 100
  description 'set med for current region to datacenter and office via region1 and region2 with distance 278'
  match as-path as-med-region1-region2-asn
  set metric 278
exit
```

這條 Route-Map 規則名為 `pol-med-region-pass-through`，它的作用是針對符合前述 AS Path Access-List (`as-med-region1-region2-asn`) 的路由，設定其多出口判別符 (MED, Multi-Exit Discriminator) 為 278。這通常用於指示鄰近自治系統在選擇進入本自治系統的路由時，優先考慮 MED 值較低的路由。

```text
redistribute connected route-map pol-redistribute-selector
redistribute local     route-map pol-redistribute-selector
redistribute static    route-map pol-redistribute-selector
redistribute kernel    route-map pol-redistribute-selector
```

這些設定指示 BGP 將本地路由器的連接路由 (connected)、本地路由 (local)、靜態路由 (static) 以及內核路由 (kernel) 根據指定的 Route-Map (`pol-redistribute-selector`) 重新分發 (redistribute) 到 BGP 路由表中。這樣做可以讓 BGP 宣告這些路由給鄰居，從而使其他自治系統能夠學習到這些路由資訊。

## 參考資料

- [什麼是 BGP？ | 解釋 BGP 路由](https://www.cloudflare.com/zh-tw/learning/security/glossary/what-is-bgp/)
- [About Border Gateway Protocol (BGP)](<https://www.watchguard.com/help/docs/help-center/en-US/Content/en-US/Fireware/dynamicrouting/bgp_about_c.html?tocpath=Fireware%7CConfigure%20Network%20Settings%7CRoutes%20and%20Routing%7CAbout%20Border%20Gateway%20Protocol%20(BGP)%7C_____0>)
- [Prefix List and Route Maps with BGP](https://www.youtube.com/watch?v=ozDa2agSIXc)
- [FRRouting BGP Documentation](https://docs.frrouting.org/en/latest/bgp.html)

## WIP

data:

- url: "https://github.com/adammc769/calico"
  description: "🤖 Automate browser tasks with AI-driven reasoning and visual intelligence for efficient web interactions and intelligent command management."
  language: "Python"
- url: "https://github.com/mc36/freeRtr"
  description: "freeRouter - networking swiss army knife"
  language: "Scilab"
- url: "https://github.com/r0zhh/ASNHunter"
  description: "🔍 Discover ASN data with ASNHunter, a Python tool for bug bounty hunters and security researchers, featuring comprehensive searches and user-friendly interface."
  language: "Python"
- url: "https://github.com/bgpkit/bgpkit-broker"
  description: "Public BGP MRT data files metadata index."
  language: "Rust"
- url: "https://github.com/HassanFakih9/DNS-to-ASN"
  description: "Automates domain-to-ASN resolution and filters domains already routed via VPN policy. Designed for Asus-Merlin’s domain_vpn_routing.sh."
  language: "Python"
- url: "https://github.com/kiraum/peering_gossip"
  description: "Peering Gossip Tool: Daily Hall of Shame for Autonomous Systems"
  language: "Python"
- url: "https://github.com/gaoyifan/china-operator-ip"
  description: "中国运营商 IPv4/IPv6 地址库-每日更新"
  language: "Shell"
- url: "https://github.com/gigifacile/BGPrices"
  description: "BGPrices"
  language: "Python"
- url: "https://github.com/ipverse/asn-ip"
  description: "Download IP address lists grouped by network provider (ASN)"
  language: null
- url: "https://github.com/ipverse/asn-info"
  description: "Download autonomous system list organized by ASN"
  language: null
- url: "https://github.com/bgpkit/bgpkit-commons"
  description: "Common utility data and functions."
  language: "Rust"
- url: "https://github.com/trantrucngoc/DoAn_01"
  description: "Dự án internet routing sử dụng OSPF, RIPv2, BGP, Redistribute."
  language: null
- url: "https://github.com/we0030603/bgp"
  description: "test"
  language: "JavaScript"
- url: "https://github.com/Andreansx/Networking-lab"
  description: "Dell EMC OS9, JunOS, RouterOS, BGP, Clos, Proxmox, OOB Management"
  language: "RouterOS Script"
- url: "https://github.com/budaobu/rules"
  description: "Fetch ASN CN data from bgp.he.net and whois.ipip.net, updated daily."
  language: "Python"
- url: "https://github.com/JosephPizzuti/BGP-Simulator"
  description: null
  language: null
- url: "https://github.com/Pablomonte/BGP4mesh"
  description: "BGP overlay network over TINC mesh with automated orchestration (BIRD, TINC, etcd, Go daemon)"
  language: "Go"
- url: "https://github.com/alexandremattioli/BGPVNFPresentation"
  description: "BGPVNFPresentation"
  language: null
- url: "https://github.com/FRRouting/frr"
  description: "The FRRouting Protocol Suite"
  language: "C"
- url: "https://github.com/teishahbc/bgp-cn-ip"
  description: null
  language: "Python"
- url: "https://github.com/Call-cmd/Dynamic-BGP-Topology-An-SDN-driven-Visualizer-for-VyOS-ODL-"
  description: "A BGP topology visualizer. This project's FastAPI backend polls an ODL controller for BGP RIB data, builds a topology with NetworkX, and serves it to a web UI via WebSockets. The reference network uses VyOS routers in a GNS3 full-mesh lab environment."
  language: "HTML"
- url: "https://github.com/ky05h1n/Bgp-At-Doors-of-Autonomous-Systems-is-Simple"
  description: null
  language: null
- url: "https://github.com/nterseleer/bgpartmod"
  description: null
  language: "Python"
- url: "https://github.com/Rohitlodhii/bgpattern"
  description: null
  language: "TypeScript"
- url: "https://github.com/shadimotaali/BGP_Traffic_Generation_by_Scapy"
  description: "Python-based BGP traffic generator using Scapy. Produces RFC 4271-compliant, labeled datasets with balanced normal/anomalous traffic for ML training. Supports IPv4/IPv6, multiple attack types, and exports to PCAP/CSV formats."
  language: "Python"
- url: "https://github.com/pagyP/bgp-learning-lab"
  description: null
  language: "HCL"
- url: "https://github.com/darkdoc/ingress-mesh-bgp"
  description: null
  language: "Shell"
- url: "https://github.com/ipzh/ipv6-wireguard-manager"
  description: "一个功能完整的 IPv6 WireGuard VPN 服务器管理系统，支持自动环境检测、BGP 路由、客户端管理、Web 界面等企业级功能。"
  language: "Python"
- url: "https://github.com/BaiMeow/NetworkMonitor"
  description: "Graph for BGP and OSPF Network"
  language: "Go"
- url: "https://github.com/mikio-abe/network-lab-03-mpls-bgp-vpn-soo"
  description: "MPLS BGP VPN with SOO Configuration"
  language: null
