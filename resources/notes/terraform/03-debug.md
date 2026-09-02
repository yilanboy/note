# 分享前輩的 Terraform Debug 小技巧

前幾天 Azure 又害我加班了，一怒之下，我決定寫一篇文章宣洩情緒外加紀錄這次前輩教我的 Terraform Debug 小技巧。

事情是這樣的，我使用 Terraform 部署一個 Azure 的 Role Assignment 資源時：

```hcl
# 假範例一枚
resource "azurerm_role_assignment" "network_config_reader" {
  scope                = azurerm_storage_container.network_config.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = azurerm_user_assigned_identity.router.principal_id
}
```

會出現一個奇怪的錯誤：

```text
The request did not have a subscription or a valid tenant level resource provider.
```

看到訊息我以為是有什麼資源的屬性沒有寫上，但確認了一下文件，發現語法沒有寫錯後，我開始懷疑是不是 Terraform 背後的 Azure Provider 有什麼奇怪的 Bug 了...

> 沒辦法，Azure 過去傷我傷得很深。🥲

## 開啟 Terraform 的 Logs

雖然對問題的原因有想法，但我卻不知道該如何尋找到底是哪邊出問題。這時候前輩跟我說可以先開啟 Terraform 的 Logs （日誌）來看看。

Terraform 是透過 Provider 來操作雲端資源，這背後的原理也很簡單，就是呼叫雲端提供的 API。所以前輩猜測可能是 Provider 在組合 API 需要的資訊時出了什麼問題，導致呼叫 API 時出現錯誤。

如果想開啟 Terraform Logs，只要宣告一個環境變數即可。

```bash
export TF_LOG=DEBUG
```

> Q：在 Shell Script 中宣告變數時，加不加 `export` 有什麼差別？
>
> A：不加 `export` 為局部變數，這種變數只在當前 Shell 環境中有效。加上 `export` 為環境變數，這種變數會被當前 Shell 環境及其所有子 Shell 環境所繼承。
>
> 當你 `export` 一個變數後，所有由當前 Shell 啟動的子進程（包括腳本、其他命令等）都可以存取到這個變數的值。

環境變數宣告後，可以再次嘗試使用 Terraform 來部署資源。這時候你就會發現 Terraform 在確認部署計劃時，會噴出一大堆的日誌。

這些日誌中就包含 Provider 是如何呼叫雲端 API 來操作資源的資訊。

一般來說終端機視窗都有顯示行數的上限，如果你的雲端資源比較多的話，可能會因為噴出的日誌太多而無法看到比較一開始的日誌。這時候可以考慮將所有的日誌都匯出到檔案中。

這需要宣告另外一個環境變數。

```bash
export TF_LOG_PATH='./debug.txt'
```

這樣就可以將這一大堆日誌匯出到 `debug.txt` 這個檔案了，避免終端機視窗行數上限的問題。

## 開始抓鬼

仔細查看 `debug.txt` 的內容，前輩跟我發現了某一行日誌出現了一個很有趣的網址。

```text
025-05-23T18:58:17.172+0800 [DEBUG] provider.terraform-provider-azurerm_v4.30.0_x5: [DEBUG] GET https://management.azure.com/https://examplestorage.blob.core.windows.net/examplecontainer/providers/Microsoft.Authorization/roleDefinitions?$filter=roleName+eq+'Storage+Blob+Data+Reader'&api-version=2022-05-01-preview
```

這個網址是什麼鬼？兩個 `https://` 連在一起，這一看就有問題啊。😂

我試試看用 `terraform console` 來比對一下有問題的與正常的 `azurerm_role_assignment` 資源，看看他們的 `state` 資訊是否有差異。

結果 ...

首先看看**有問題** `azurerm_role_assignment` 的 `state` 資訊。

```json
{
    // ...
    "id": "https://examplestorage.blob.core.windows.net/examplecontainer"
    // ...
}
```

再來看看**正常** azurerm_role_assignment 的 state 資訊。

```json
{
    // ...
    "id": "subscriptions/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxx/resourceGroups/..."
    // ...
}
```

兇手很明顯了，原因是在升級 Provider 之後，沒有注意到 `id` 的格式有破壞性更新，導致 Terraform 在使用舊 `id` 格式呼叫 API 時會出現格式出錯的問題。這個問題的解決方式也很簡單，在確認資源不會影響到其他資源後，將其砍掉重新部署即可。

只能說還是熟悉的 Azure 啊，動不動就有奇怪的破壞性更新出現。😮‍💨

> 正義的聲音：問題應該是你沒有檢查破壞性更新就亂升級 Provider 的大版本吧！
>
> 我：我只是想臭一下 Azure。

## 參考資料

- [Enable Terraform logs](https://developer.hashicorp.com/terraform/internals/debugging)
