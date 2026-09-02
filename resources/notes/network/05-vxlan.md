# VXLAN

最近工作上碰到一個專案要使用 VXLAN 來做 BGP (Border Gateway Protocol) 通訊，藉此完成路由訊息的交換。因為網路相關內容一直都是我的罩門，剛好可以藉此機會來了解一下什麼是 VXLAN。

## LAN 的演進

在介紹 VXLAN 之前，先來了解一下 LAN 的進化史。

### LAN (Local Area Network)

「區域網路」是指一個局部範圍內的網路，例如在辦公室、學校或家庭中連接多台電腦和其他設備的網路。LAN 通常由路由器、交換器和電纜等基礎設施組成，這些設備使得在同一網路中的設備可以互相通信和共享資源。

> 小型區域網路只需要一個路由器就可以連接到網際網路，而不需要網路交換器。

![lan.jpg](https://allen-files.s3.ap-northeast-1.amazonaws.com/images/network/lan.jpg)

### VLAN (Virtual Local Area Network)

「虛擬區域網路」是一種在物理上單一的 LAN 上建立多個邏輯上分隔的網路的技術。就好比在同一個區域裡再設定兩個獨立的 LAN，每個 LAN 彼此之間是隔離的，但實際上是共享同一個物理網路。VLAN 通常是在交換器上實現的，交換器可以根據 VLAN ID 將流量從一個 VLAN 轉發到另一個 VLAN。

VLAN 可以有不同的設置和安全性要求。這使得網路管理更靈活，可以更好地控制流量和資源共享。

> 注意 VLAN 與子網路 (Subnet) 並不是一樣的東西。VLAN 實現對同一物理網路的邏輯分隔，而子網路則是對 IP 地址空間的分割。

### VXLAN (Virtual Extensible LAN)

「虛擬可擴展區域網路」是一種覆蓋網路 (Overlay Network) 技術，主要用於解決 VLAN 數量不足的問題。VXLAN 通過在原有的 Layer 2 網路上建立一個覆蓋網路，使得不同的 VLAN 可以通過 VXLAN Tunnel 進行通訊。

> 覆蓋網路（Overlay Network）是一種建立在基礎網路之上的虛擬網路。覆蓋網路在現代分散式系統和雲計算中得到了廣泛的應用，例如在軟體定義網路 (SDN)、軟體定義廣域網路 (SD-WAN)、容器化和微服務架構等方面。
>
> 因為在分布式系統和雲計算中，節點可能分布在不同的地理位置，甚至不同類型的網路中。通過使用覆蓋網路，這些系統可以像在同一個本地網路上一樣進行通訊，從而簡化了數據交換過程，降低了網路管理的複雜性。

## 使用 Netplan 來建立點對點的 VXLAN Tunnel

在 Ubuntu 中，可以使用 Netplan 來建立 VXLAN Tunnel。

> Netplan 是 Ubuntu 18.04 之後的版本預設的網路配置工具。

我們先在 AWS 上建立兩台安裝 Ubuntu 的 EC2 A 與 EC2 B，這兩台 EC2 分別在不同的 VPC 中，VPC 間有做 VPC Peering，我們嘗試在這兩台 EC2 中間建立一個 VXLAN Tunnel。以下是簡易的架構圖：

![vxlan-example.jpg](https://allen-files.s3.ap-northeast-1.amazonaws.com/images/network/vxlan-example.jpg)

我們在 EC2 A 的 `/etc/netplan/01-vxlan.yaml` 中加入以下設定：

```yaml
network:
    version: 2
    tunnels:
        vxlan1:
            mode: vxlan
            id: 1000
            local: 10.0.1.10
            remote: 10.0.0.10
            port: 8472
            addresses:
                - 192.168.150.1/30
```

而 EC2 B 的 `/etc/netplan/01-vxlan.yaml` 則是：

```yaml
network:
    version: 2
    tunnels:
        vxlan1:
            mode: vxlan
            id: 1000
            local: 10.0.0.10
            remote: 10.0.1.10
            port: 8472
            addresses:
                - 192.168.150.2/30
```

然後記得兩台 EC2 都要重啟 Netplan 服務：

```bash
sudo systemctl restart systemd-networkd
sudo netplan apply
```

這樣就建立了一個點對點的 VXLAN Tunnel，可以透過 `ip a` 指令查看網路介面是否有新增 `vxlan1` 介面。

然後使用 `ping` 指令看看是否可以互相通訊：

```bash
# 在 EC2 A 上
ping 192.168.150.2

# 在 EC2 B 上
ping 192.168.150.1
```

## 參考資料

- [什麼是 LAN（區域網路）？](https://www.cloudflare.com/zh-tw/learning/network-layer/what-is-a-lan/)
