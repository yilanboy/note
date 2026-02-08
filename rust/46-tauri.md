---
layout: default
parent: Rust
nav_order: 46
---

# Tauri

[Tauri](https://v2.tauri.app/) 是一個用於開發桌面與行動應用程式的框架。類似於 Electron，它允許開發者使用 Web 技術建構前端，並以 Rust 開發後端。相比之下，Tauri 構建的應用程式通常體積更小、效能更佳。

## 安裝 Tauri

首先，使用 Cargo 安裝 Tauri CLI：

```bash
# 安裝 Tauri CLI
cargo install create-tauri-app --locked
```

安裝完成後，使用 `cargo create-tauri-app` 指令來建立 Tauri 專案：

```bash
cargo create-tauri-app
```

建立專案時，您可以選擇熟悉的前端技術（如 React、Vue 或 Svelte）或 Rust 前端函式庫來建構使用者介面。同時，Tauri 也支援多種套件管理工具，包括 npm、pnpm 與 deno 等。

```text
✔ Project name · demo
✔ Identifier · com.allen.demo
✔ Choose which language to use for your frontend · TypeScript / JavaScript - (pnpm, yarn, npm, deno, bun)
✔ Choose your package manager · pnpm
✔ Choose your UI template · Svelte - (https://svelte.dev/)
✔ Choose your UI flavor · TypeScript

Template created! To get started run:
  cd demo
  pnpm install
  pnpm tauri android init
  pnpm tauri ios init

For Desktop development, run:
  pnpm tauri dev

For Android development, run:
  pnpm tauri android dev

For iOS development, run:
  pnpm tauri ios dev
```

專案建立後，根據需求，您可以開發桌面或行動應用程式，並透過模擬器進行測試。

```bash
# 執行桌面應用程式
pnpm tauri dev
# 模擬在 Android 上執行行動應用程式
pnpm tauri android dev
# 模擬在 iOS 上執行行動應用程式
pnpm tauri ios dev
```

## 更新依賴套件

若要更新前端依賴套件，請在專案根目錄執行以下指令：

```bash
pnpm update @tauri-apps/cli @tauri-apps/api --latest
```

若要更新後端（Rust）依賴套件，請修改 `src-tauri` 目錄下的 `Cargo.toml` 檔案，將 `%version%` 替換為最新版本號：

```toml
[build-dependencies]
tauri-build = "%version%"

[dependencies]
tauri = { version = "%version%" }
```

修改完成後，執行以下指令更新：

```bash
cd src-tauri
cargo update
```

## 開發 Android 平台

Tauri 支援 Android 應用程式開發，但需先配置 Android 開發環境。

首先，請安裝 Android Studio，並透過 SDK Manager 下載以下元件：

- Android SDK Platform
- Android SDK Platform-Tools
- NDK (Side by side)
- Android SDK Build-Tools
- Android SDK Command-line Tools

接著，設定 `JAVA_HOME` 環境變數：

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

設定 `ANDROID_HOME` 與 `NDK_HOME` 環境變數：

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 $ANDROID_HOME/ndk)"
```

最後，使用 `rustup target` 新增 Android 目標平台：

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

## 開發 iOS 平台

除了 Android，Tauri 亦支援 iOS 平台開發，但需先配置 iOS 開發環境。

首先，請從 App Store 下載並安裝 **Xcode**。

接著，使用 `rustup target` 新增 iOS 目標平台：

```bash
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
```

使用 Homebrew 安裝 CocoaPods：

```bash
brew install cocoapods
```

初始化 iOS 開發環境：

```bash
pnpm tauri ios init
```

### 疑難排解

若在執行 `pnpm tauri info` 時，發現無法正確偵測到 Xcode（或顯示未安裝）。

此問題可能源於 [Github Issue #8565](https://github.com/tauri-apps/tauri/issues/8565) 中提到的 `xcode-select` 路徑設定問題。您可以執行以下指令進行檢查：

```bash
xcrun -f devicectl # 檢查 devicectl 是否隨 Xcode command line tool 安裝
xcode-select -p # 檢查 Xcode command line tool 是否指向 Xcode IDE。有時它可能指向舊版本或 Beta 版。
```

如果 `xcrun -f devicectl` 顯示錯誤如下：

```text
xcrun: error: unable to find utility "devicectl", not a developer tool or in PATH
```

且 `xcode-select -p` 顯示路徑為：

```text
/Library/Developer/CommandLineTools
```

您可以執行以下指令將路徑修正為 Xcode 應用程式路徑，以解決此問題：

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcrun -f devicectl
```
