# Azure Policy

Azure Policy 是可以用來判斷資源是否符合合規性與公司政策的工具。如果資源不符合規定，就可以在一個統一的面板上看到不符合規定的資源，或是乾脆在資源被建立前被阻止。

Azure Policy 可以透過 Management Group 大範圍的監控組織裡的每個 Subscription 底下的資源。幫助公司在雲端上建立一個合規的環境。

## 套用 Policy

你可以在 Azure Policy 頁面底下的 _Authoring -> Assignments -> Assign Policy_ 中套用 Policy。

Policy 檢查的範圍稱為 Scope。Scope 的範圍可以大到整個 Subscription，也可以縮小到指定某一個 Resource Group。

Policy 可以使用 Azure 預設提供的，也可以自己定義。

## Policy 模板

在 _Authoring -> Definitions -> Policy definition_ 中新增自己的 Policy。

一個簡單的 Policy 如下。當用戶想建立一個機器類型為 `Standard_G` 開頭的虛擬機器，就會被阻止。

```json
{
    "policyRule": {
        "if": {
            "allOf": [
                {
                    "field": "type",
                    "equals": "Microsoft.Compute/virtualMachines"
                },
                {
                    "field": "Microsoft.Compute/virtualMachines/sku.name",
                    "like": "Standard_G*"
                }
            ]
        },
        "then": {
            "effect": "deny"
        }
    }
}
```

### 定義參數

你可以在模板中定義參數，以 Azure 提供的現有 [Policy](https://portal.azure.com/#view/Microsoft_Azure_Policy/PolicyDetailBlade/definitionId/%2Fproviders%2FMicrosoft.Authorization%2FpolicyDefinitions%2Ff772fb64-8e40-40ad-87bc-7706e1949427) 為例。
這個 Policy 可以判斷你在 Key Vault 中是否有快過期的憑證。只截取其中定義參數的一段來看。

```json
{
    "properties": {
        "parameters": {
            "daysToExpire": {
                "type": "Integer",
                "metadata": {
                    "displayName": "Days to expire",
                    "description": "The number of days for a certificate to expire."
                }
            },
            "effect": {
                "type": "String",
                "metadata": {
                    "displayName": "Effect",
                    "description": "'Audit' allows a non-compliant resource to be created, but flags it as non-compliant. 'Deny' blocks the resource creation. 'Disable' turns off the policy."
                },
                "allowedValues": [
                    "audit",
                    "Audit",
                    "deny",
                    "Deny",
                    "disabled",
                    "Disabled"
                ],
                "defaultValue": "Audit"
            }
        }
    }
}
```

這裡定義了兩個參數，分別是 `daysToExpire` 與 `effect`。
在參數中，這裡定義 `daysToExpire` 的類型為 Integer，而且在 metadata 中補充說明這個參數的顯示名稱與用途為何。
而 `effect` 這個參數除了定義類型與 metadata 外，還特別使用 `allowedValues` 限制了只能使用哪些值。
