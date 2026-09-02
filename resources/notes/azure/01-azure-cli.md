# Azure CLI

安裝 azure cli (MacOS)

```bash
brew install azure-cli
```

登入 azure (會開啟 web browser)

```bash
# 會開啟 web browser 進行登入
az login

az login --user <myAlias@myCompany.com> -password <myPassword>
```

登入之後他會 show 出帳號的相關資訊，例如 Tenant 與 Subscription 資訊，範例如下

> 當中的 id 為 subscription id

```json
[
    {
        "cloudName": "AzureCloud",
        "homeTenantId": "unique-tenant-id",
        "id": "unique-subscription-id-01",
        "isDefault": true,
        "managedByTenants": [],
        "name": "test_azure_account_01",
        "state": "Enabled",
        "tenantId": "unique-tenant-id",
        "user": {
            "name": "foo@example.com",
            "type": "user"
        }
    },
    {
        "cloudName": "AzureCloud",
        "homeTenantId": "unique-tenant-id",
        "id": "unique-subscription-id-02",
        "isDefault": false,
        "managedByTenants": [],
        "name": "IT Team Dev/Test",
        "state": "Enabled",
        "tenantId": "unique-tenant-id",
        "user": {
            "name": "foo@example.comm",
            "type": "user"
        }
    }
]
```

完成之後會在生成一個 `~/.azure` 資料夾，裡面會有各種設定檔案

> 什麼是 Tenant (租戶)？
>
> 指的是一個獨立可以分配給組織的 Azure AD (Active Directory) 實例，每個 Tenant 都可以單獨管理用戶的帳戶、訪問控制策略與應用程式
>
> 例如一個公司可以為其部門創建不同的 Azure AD Tenant，以隔離其用戶資料與訪問控制

## 切換 Subscription

使用下列指令取得目前 Tenant 的 Active Subscription

```bash
# get all subscription
az account list

# get the current default subscription using show
az account show --output table

# get the current default subscription using list
az account list --query "[?isDefault]"

# store the default subscription  in a variable
subscriptionId="$(az account list --query "[?isDefault].id" -o tsv)"
echo $subscriptionId
```

可以使用下列指令切換 subscription

```bash
# change the active subscription using the subscription name
az account set --subscription "My Demos"

# change the active subscription using the subscription ID
az account set --subscription "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# change the active subscription using a variable
subscriptionId="$(az account list --query "[?isDefault].id" -o tsv)"
az account set --subscription $subscriptionId
```

> 什麼是 Subscription (訂閱)？
>
> 你可以在 Subscription 中設定 Tenant 可以管理哪些 Azure 資源 (如虛擬機、資料庫與應用程式...等)
>
> 因為你需要在一個 Tenant 中創建一個 Subscription，並使用該 Subscription 管理和訪問 Azure 資源，一個 Tenant 中可以有多個 Subscription

## 參考資料

- [Azure Command-Line Interface (CLI) documentation](https://learn.microsoft.com/en-us/cli/azure/)
