# Data Plane 與 Control Plane

TL;DR。Data Plane (資料平面) 講的是資料傳輸的部分，讓封包從一個點傳送到另外一個點。
Control Plane (控制平面) 講的是資料該如何傳輸的部分，它決定了封包在傳輸過程應該如何被轉發，以及如何根據網路變化做出反應。

當 Control Plane 制定好路由表，Data Plane 就是考慮該如何根據路由表將封包傳送到目的地。

## Control Plane

 舉個例子，Border Gateway Protocol (BGP)、Intermediate System-to-Intermediate System (IS-IS) 與 Open Shortest Path First (OSPF) 都是很常見的 Control Plane 協定。

## Data Plane

俺就只負責送資料，看你要用實體線路送，還是用 Wi-Fi。我會依照 Control Plane 制定的規則來送資料。

## 參考資料

- [Control plane vs. data plane](https://www.ibm.com/think/topics/control-plane-vs-data-plane)
