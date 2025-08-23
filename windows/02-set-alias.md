# 設定指令的 Alias

在 Linux 的 Bash 中，你可以用 `alias` 來設定指令的別名。

```bash
alias art="php artisan"
```

而在 Windows 的 Powershell 中，雖然也有 `Set-Alias` 指令，不過只能使用單一指令，
組合指令會出現錯誤。

```powershell
# 錯誤
Set-Alias -Name "art" -Value "php artisan"
```

你可以使用函式來設定組合指令。

```powershell
function art {
    & php artisan $args
}
```
