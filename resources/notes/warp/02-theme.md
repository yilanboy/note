# 修改主題

Warp 預設提供一些基本主題，但也可以自己設定終端機背景與字體顏色。

首先可以至官方的 [warp theme repo](https://github.com/warpdotdev/themes) 挑選自己喜歡的主題。

假設我們想使用 palenight 主題，可以下載在 standard 資料夾底下 `palenight.yaml` 檔案。

在 home 目錄底下新增 warp palenight 主題所需的資料夾。

```bash
cd $HOME && mkdir -p .warp/themes
```

將剛剛下載的`palenight.yaml` 檔案放在 `.warp/themes/palenight` 底下。

```yaml
accent: '#82aaff'
background: '#292d3e'
details: darker
foreground: '#d0d0d0'
terminal_colors:
    bright:
        black: '#434758'
        blue: '#9cc4ff'
        cyan: '#a3f7ff'
        green: '#ddffa7'
        magenta: '#e1acff'
        red: '#ff8b92'
        white: '#ffffff'
        yellow: '#ffe585'
    normal:
        black: '#292d3e'
        blue: '#82aaff'
        cyan: '#89ddff'
        green: '#c3e88d'
        magenta: '#c792ea'
        red: '#f07178'
        white: '#d0d0d0'
        yellow: '#ffcb6b'
```

**重新啟動 warp**，並使用快捷鍵 `Cmd` + `P` 搜尋 Open Theme Picker。

或是使用主題選取快捷鍵 `Ctrl` + `Cmd` + `T`。

選擇 Palenight 即可切換主題。

## 更換背景

如果想更換終端機背景，可以先上網找你想當背景的圖片，然後放在 `.warp/themes/palenight/` 底下。

之後只需要在 `palenight.yaml` 中設定即可。

```yaml
accent: '#82aaff'
background: '#292d3e'
details: darker
foreground: '#d0d0d0'
############################################################### SEE BELOW
background_image:
    # the path is relative to ~/.warp/themes/
    # the full path to the picture is: ~/.warp/themes/warp.jpg
    path: palenight/terminal-background.jpg
    # the opacity value is required and can range from 0-100
    opacity: 30
############################################################### SEE ABOVE

# ... 以下省略
```

背景路徑的 `path` 預設從 `.warp/themes` 開始，所以這裡需要設定成 `palenight/terminal-background.jpg`。

可以使用 `opacity` 設定背景透明度，避免圖片背景干擾字體的閱讀。

## 參考資料

- [Warp - Custom Themes](https://docs.warp.dev/appearance/custom-themes)
