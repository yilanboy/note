---
layout: default
parent: Windows
nav_order: 1
---

# 設定 windows 開發環境

嘗試一下不使用 WSL2，直接在 Windows 上設定開發環境。

## 安裝 `winget`

Winget 為 Windows 系統上面的套件管理工具，類似於 Linux 上面的 `apt` 或 `yum`。

可以從 Windows Store 安裝，搜尋「[應用程式安裝程式](https://apps.microsoft.com/detail/9NBLGGH4NNS1?hl=zh-tw&gl=TW)」並下載即可。

## 設定 SSH

Windows 11 內建有 OpenSSH，但 SSH Agent 並沒有啟動，可以設定開機自動啟動。

```powershell
# 預設 ssh-agent 是關閉的，我們可以設定開機自動啟動
# 記得使用系統管理員權限執行
Get-Service ssh-agent | Set-Service -StartupType Automatic

# 請動 ssh-agent
Start-Service ssh-agent

# 下方指令確認 ssh-agent 是否啟動
Get-Service ssh-agent

# 將私鑰加入 ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

## 設定 Git

可以使用 `winget` 安裝 Git。

```powershell
winget install -e -id Git.Git
```

> `-e` 表示安裝最新的穩定版本，`-id` 表示安裝指定的套件。

初始設定。

```powershell
git config --global user.name "Allen"
git config --global user.email "allen@email.com"
```

因為 Windows OS 預設使用 CRLF 當作換行 (End of Line, EOL)，
在使用 `git clone` 時，會自動將檔案轉換成 CRLF 格式，
如果你不喜歡的話，記得在 Git 的 global 設定中要將 `core.autocrlf` 設定為 `false`。

```powershell
git config --global core.autocrlf false
git config --global core.eol lf
```

## 設定 Windows Terminal

在設定「互動」底下，將「自動將選取項目複製到剪貼簿」勾選。

## 設定 VS Code

VS Code 可以在 Microsoft Store 安裝，搜尋「[Visual Studio Code](https://apps.microsoft.com/detail/XP9KHM4BK9FZ7Q?hl=zh-tw&gl=TW)」並下載即可。

## 設定 oh my posh

覺得 Windows Terminal 的介面太醜了嗎？可以使用 [oh my posh](https://ohmyposh.dev/) 來美化介面。

可以在 Microsoft Store 安裝，搜尋「[oh my posh](https://apps.microsoft.com/detail/oh-my-posh/XP8K0HKJFRXGCK?hl=zh-tw&gl=TW)」並下載即可。

或是使用 `winget` 安裝。

```powershell
winget install JanDeDobbeleer.OhMyPosh
```

安裝完成之後先生成一個 powershell 的 profile 設定檔案。

```powershell
new-item -type file -path $profile -force
```

使用 vscode 編輯 profile 檔案，並加入下方內容。

```powershell
oh-my-posh init pwsh --config "$env:POSH_THEMES_PATH\paradox.omp.json" | Invoke-Expression
```

> 這個 profile 類似 linux 的 .bashrc 與 .zshrc，可以在開啟 powershell 時自動執行。
>
> 你也可以這裡設定 alias，例如 `New-Alias -Name "tf" terraform`。

其中的 `paradox` 為 oh my posh 的主題，可以從[網站](https://ohmyposh.dev/docs/themes)上挑選自己喜歡的自行更換。

## 參考資料

- [使用 winget 工具來安裝和管理應用程式](https://learn.microsoft.com/zh-tw/windows/package-manager/winget/)
- [適用于 Windows 的 OpenSSH 中的金鑰型驗證](https://learn.microsoft.com/zh-tw/windows-server/administration/openssh/openssh_keymanagement)
- [Panes in Windows Terminal](https://learn.microsoft.com/en-us/windows/terminal/panes)
- [使用 Oh My Posh 設定 PowerShell 或 WSL 的自訂提示](https://learn.microsoft.com/zh-tw/windows/terminal/tutorials/custom-prompt-setup)
