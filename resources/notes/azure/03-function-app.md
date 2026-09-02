# App Function

Azure 的無伺服器 (serverless) 服務

## Function Code

Azure function 主要有兩個部分，第一個部分是要執行的程式碼，你可以選擇你想要的語言來開發，另外一個部分是相關的設定

設定中有 `function.json`，可以設定 trigger，也就是如何觸發並執行這個 function

以下是一個上傳檔案到 azure storage 就觸發 function 的設定

```json
{
    "scriptFile": "__init__.py",
    "bindings": [
        {
            "name": "myblob",
            "type": "blobTrigger", // 綁定的種類
            "direction": "in", // in or out, 代表該綁定是會接收資料進函式，還是從函式送出資料
            "path": "samples-workitems/{name}",
            "connection": "AzureWebJobsStorage"
        }
    ]
}
```

`function.json` 當中的 `bindings` 可以設定要如何觸發這個 function

## Folder Structure (Python)

當你新建一個以 python 為執行語言的 azure function，預設會有一個進入點 (entrypoint)，
也就是 `__init__.py` 檔案中的 `main()`，想修改進入點，可以在 `function.json` 更改 `scriptFile` 與 `entrypoint` 的值

```json
// function.json
{
    "scriptFile": "__init__.py", // 進入點檔案
    "entrypoint": "main", // 進入點函式
    "bindings": [
        {
            "authLevel": "function",
            "type": "httpTrigger",
            "direction": "in",
            "name": "req",
            "methods": ["get", "post"]
        },
        {
            "type": "http",
            "direction": "out",
            "name": "$return"
        }
    ]
}
```

進入點檔案的範例

```python
def main(req):
    user = req.params.get('user')
    return f'Hello, {user}!'
```

根據不同的語言，azure function 所包含的檔案也會有所不同，下面以 python 為例子

```text
<project_root>/
 | - .venv/
 | - .vscode/
 | - my_first_function/
 | | - __init__.py
 | | - function.json
 | | - example.py
 | - my_second_function/
 | | - __init__.py
 | | - function.json
 | - shared_code/
 | | - __init__.py
 | | - my_first_helper_function.py
 | | - my_second_helper_function.py
 | - tests/
 | | - test_my_second_function.py
 | - .funcignore
 | - host.json
 | - local.settings.json
 | - requirements.txt
 | - Dockerfile
```

- `local.settings.json`：用於在本地運行時存儲應用程式設定和連接字串。這個檔案不會發佈到 azure
- `requirements.txt`：包含系統在發佈到 azure 時安裝的 python 套件清單
- `host.json`：包含影響函式應用程式實例中所有函式的設定選項。這個檔案會發佈到 azure。在本地運行時不是所有選項都被支援
- `.vscode/`：（可選）包含存儲的 vs code 設定
- `.venv/`：（可選）包含本地開發使用的 python 虛擬環境
- `Dockerfile`：（可選）在發佈您的專案到自訂容器時使用
- `tests/`：（可選）包含您的函式應用程式的測試案例。
- `.funcignore`：（可選）聲明不應發佈到 azure 的檔案。通常，這個檔案包含以下檔案
    - `.vscode/` 以忽略編輯器設定
    - `.venv/` 以忽略本地 python 虛擬環境
    - `tests/` 以忽略測試案例
    - `local.settings.json` 以防止本地應用程式設定被發佈。

## Use Local Tool to Deploy Your Function

你可以在本機上撰寫程式碼，再將其部署到 azure function

以 VS code 的話，可以安裝 [Azure Functions](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions) 這個套件

## Environment Variables

你可以在 Application Settings 中設定環境變數，並在 azure function 中讀取

```python
import os

os.environ["ACCOUNT_KEY"]
```

## References

- [Azure Functions developer guide](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference?tabs=blob)
- [Azure Functions Python developer guide](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-python?tabs=asgi%2Capplication-level&pivots=python-mode-decorators)
