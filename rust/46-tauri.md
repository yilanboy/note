---
layout: default
parent: Rust
nav_order: 46
---

# Tauri

[Tauri](https://v2.tauri.app/) 是一個可以用來開發桌面與移動應用程式的框架。類似於 Electron，你可以使用 Web 技術開發前端，並使用 Rust 開發後端。相較於 Electron，Tauri 所建構的應用程式通常體積更小、效能更好。

## 安裝 Tauri

你可以使用 Cargo 安裝 Tauri CLI：

```bash
# 安裝 Tauri CLI
cargo install create-tauri-app --locked
```

之後就可以使用 `cargo create-tauri-app` 來建立 Tauri 的專案。

```bash
cargo create-tauri-app
```

在 Tauri 專案，你可以選擇你最喜歡的前端技術來建構應用程式的畫面。例如 React、Vue 或是 Svelte，也可以使用 Rust 的前端函式庫。前端套件管理工具也提供諸如 npm、pnpm 與 deno ...等多種選擇。

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

建立好之後，根據你的需求，你可以建立桌面或是移動應用程式。

## 開發 Android 平台

Tauri 可以開發 Android 平台的應用程式，但是需要先在環境中設定 Android 的開發套件。

第一步我們需要安裝 Android Studio，並使用它的 SDK Manager 下載以下的 SDK：

- Android SDK Platform
- Android SDK Platform-Tools
- NDK (Side by side)
- Android SDK Build-Tools
- Android SDK Command-line Tools

設定 `JAVA_HOME` 環境變數：

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

設定 `ANDROID_HOME` 與 `NDK_HOME` 環境變數：

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 $ANDROID_HOME/ndk)"
```

使用 `rustup target` 安裝 Android 平台：

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```
