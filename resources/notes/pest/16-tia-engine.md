# Pest 5: TIA Engine

Pest 5 引入了 TIA（Test Impact Analysis，測試影響分析）引擎，旨在透過僅選擇性地重新運行受最近代碼更改影響的測試來加速測試套件。

## 用途

當你的測試套件非常龐大，完整運行一次需要數分鐘時，TIA 就非常有用。它只會運行與你修改過的程式碼相關的測試，大幅縮短等待測試結果的時間。

根據官方文件，一個原本需要 10 分鐘的 Laravel 測試套件，在使用 TIA 後大約 4 秒鐘就可以完成。如果是像修改註解或程式碼格式化這類不會影響邏輯的變更，甚至不會觸發任何測試。

## 原理

當你第一次帶上 `--tia` 旗標運行 Pest 時，TIA 引擎會建立一個依賴關係圖，記錄下哪個測試覆蓋了哪些檔案。

之後的每一次運行，TIA 都會分析你所做的變更，並且只執行受影響的測試。對於其他未受影響的測試，它會直接重播快取的結果，而不是真的去運行它們。

## 使用方法

### 前提要求

要使用 TIA，你需要安裝並啟用一個程式碼覆蓋率驅動程式，例如 PCOV 或 Xdebug。這是建立初始依賴關係圖所必需的。

### 基本使用

在運行 Pest 時加上 `--tia` 旗標即可：

```bash
./vendor/bin/pest --parallel --tia
```

### 基準線共享 (Baseline Sharing)

初始的依賴關係圖（稱為 "baseline"）可以在 CI 環境中生成，然後在整個開發團隊中共享。這讓團隊成員可以立即享受 TIA 帶來的加速效果，而無需在本地花費時間生成初始的 baseline。

你可以在 `tests/Pest.php` 中進行設定，並需要安裝 GitHub CLI (`gh`)：

```php
// tests/Pest.php

pest()->tia()->baselined();
```

### 永久啟用 TIA

如果你希望在本地開發時總是啟用 TIA，可以在 `tests/Pest.php` 中設定：

```php
// tests/Pest.php

pest()->tia()->always()->locally();
```

`always()` 會讓 TIA 成為預設行為，而 `locally()` 則確保這個設定只在本地環境生效，不會影響 CI 環境。
