---
layout: default
parent: Rust
nav_order: 46
---

# Tauri

[Tauri](https://v2.tauri.app/) 是一個用於開發桌面與行動應用程式的跨平台框架。其架構與 Electron 類似，允許開發者使用 Web 技術建構前端，並利用 Rust 處理後端邏輯。相比 Electron，Tauri 構建的應用程式體積更輕巧、效能更出色，且具備更高的安全性。

本文記錄了使用 Tauri 開發簡單 App 的實踐經驗，採用的技術架構如下：

- **套件管理工具**：pnpm
- **前端框架**：SvelteKit + TypeScript + Tailwind CSS
- **後端語言**：Tauri + Rust
- **資料庫**：SQLite

---

## 安裝與初始化

首先，透過 Cargo 安裝 Tauri CLI：

```bash
# 安裝 Tauri CLI
cargo install create-tauri-app --locked
```

接著，執行 `cargo create-tauri-app` 指令建立新專案：

```bash
cargo create-tauri-app
```

在建立過程中，您可以選擇偏好的前端框架（如 React、Vue 或 Svelte）及套件管理工具。以下是本範例的選擇流程：

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

專案建立後，您可以開發桌面版或行動版應用程式，並透過以下指令啟動開發模式：

```bash
# 啟動桌面版開發模式
pnpm tauri dev
# 在 Android 模擬器中執行
pnpm tauri android dev
# 在 iOS 模擬器中執行
pnpm tauri ios dev
```

---

## 更新依賴項

### 前端依賴

若要更新前端的 Tauri 相關套件，請在專案根目錄執行：

```bash
pnpm update @tauri-apps/cli @tauri-apps/api --latest
```

### 後端依賴 (Rust)

修改 `src-tauri` 目錄下的 `Cargo.toml` 檔案，將 `%version%` 替換為最新的版本號：

```toml
[build-dependencies]
tauri-build = "%version%"

[dependencies]
tauri = { version = "%version%" }
```

修改後，進入 `src-tauri` 目錄執行更新：

```bash
cd src-tauri
cargo update
```

> **提示**：更新套件後，建議刪除 `src-tauri/gen/[android|apple]` 目錄，並重新執行 `pnpm tauri [android|ios] init` 以確保環境配置正確。在 Android 平台上，建議先解除安裝舊版 App 再重新構建。

---

## Android 開發環境配置

Tauri 支援 Android 平台，但需要預先配置 Android SDK 環境。

- **安裝 Android Studio**：透過 SDK Manager 下載以下元件：
  - Android SDK Platform
  - Android SDK Platform-Tools
  - NDK (Side by side)
  - Android SDK Build-Tools
  - Android SDK Command-line Tools

- **設定環境變數**：在 Shell 設定檔（如 `.zshrc` 或 `.bashrc`）中加入：

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 $ANDROID_HOME/ndk)"
```

- **新增 Rust 目標平台**：

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

---

## iOS 開發環境配置

- **安裝 Xcode**：從 App Store 安裝後，確保已下載 iOS 相關組件（Components）。

- **新增 Rust 目標平台**：

```bash
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
```

- **安裝 CocoaPods**：

```bash
brew install cocoapods
```

- **初始化 iOS 專案**：

```bash
pnpm tauri ios init
```

### 疑難排解：Xcode 偵測失敗

若執行 `pnpm tauri info` 無法正確識別 Xcode，通常是 `xcode-select` 路徑指向了錯誤的 Command Line Tools 路徑。

**檢查方式**：

```bash
xcrun -f devicectl # 若顯示 error: unable to find utility "devicectl"，則路徑有誤
xcode-select -p # 若顯示 /Library/Developer/CommandLineTools，通常需要修正
```

**解決方案**：
將路徑指向實際的 Xcode 應用程式路徑：

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

修復後再次驗證，`xcrun -f devicectl` 應能正確輸出路徑，且 `pnpm tauri info` 應可正常偵測。

---

## 使用 SQLite 作為本地資料庫

### 1. 安裝套件與插件

首先，安裝前端 SQL 介面套件：

```bash
pnpm tauri add sql
```

接著，在 Rust 後端啟用 SQLite 特性：

```bash
cd src-tauri
cargo add tauri-plugin-sql --features sqlite
```

### 2. 資料庫遷移 (Migrations)

建立 `migrations` 資料夾，並存放對應的 SQL 檔案：

```text
migrations/
├── 0001_create_users_table.sql
└── 0002_create_groups_table.sql
```

在 `src-tauri/src/lib.rs` 中設定 Migration：

```rust
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_users_table",
            sql: include_str!("../migrations/0001_create_users_table.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_groups_table",
            sql: include_str!("../migrations/0002_create_groups_table.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mydatabase.db", migrations)
                .build(),
        )
        // ... 其他 plugin 初始化
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

> **注意**：目前 Tauri 的 Migration 功能尚不完整，雖然定義了 `MigrationKind::Down`，但實務上還無法像 Laravel 般輕鬆進行 Rollback。

#### 疑難排解：Migration 錯誤 (已套用但被修改)

在開發過程中，如果修改了已經執行過的 Migration SQL 檔案（例如：修改了某個資料表的欄位定義），在執行應用程式時，可能會遇到 `migration x was previously applied but has been modified` 的錯誤。

因此建議對任何資料表的修改，**都透過新的 Migration 檔案來修改**。

**解決方案**：

- **重置資料庫（開發環境下最直接有效）**：在不保留既有資料的前提下，最簡單且直接的解法是 **直接刪除本地的 SQLite 資料庫檔案**（例如 `mydatabase.db`），然後重新啟動程式讓所有 Migration 重新跑一次。有時也可搭配 `cargo clean` 清除編譯快取來確保環境乾淨。

> 詳見 SQLx 討論區：[Sometimes getting "migration x was previously applied but has been modified" error even after resetting database](https://github.com/launchbadge/sqlx/discussions/1292)

### 3. 資料庫儲存路徑

SQLite 檔案的實際儲存位置依作業系統而定。例如在 macOS 上，通常位於：

```text
'/Users/<用戶名稱>/Library/Application Support/com.<開發者名稱>.<App名稱>/mydatabase.db'
```

---

## 前端讀取資料庫 (SvelteKit 範例)

在 SvelteKit 的 `src/routes/+layout.ts` 中載入資料庫並執行查詢：

```typescript
import Database from "@tauri-apps/plugin-sql";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async () => {
  const db = await Database.load("sqlite:mydatabase.db");
  const tables = (await db.select(
    "SELECT * FROM sqlite_master WHERE type='table'",
  )) as any[];

  return {
    tables: tables,
  };
};
```

> **重要提示**：Tauri 應用程式不包含 Node.js 執行環境，因此不支援 SSR（伺服器端渲染）。在 SvelteKit 中，請避免使用 `+layout.server.ts` 或 `+page.server.ts`。

隨後即可在子頁面 `+page.svelte` 中讀取資料：

```svelte
<script lang="ts">
  let { data } = $props();
</script>

<main class="container mx-auto p-4">
  <h1 class="text-lg font-bold">所有資料表</h1>
  {#each data.tables as table}
    <p class="mt-2 p-2 bg-white rounded shadow-sm">{table.name}</p>
  {/each}
</main>
```

---

## 參考資料

- [Tauri 官方文件 - 配置行動目標](https://v2.tauri.app/start/prerequisites/#configure-for-mobile-targets)
- [Tauri Plugin - SQL](https://v2.tauri.app/plugin/sql/)
- [Github Issue: Unable to find Sqlite db path](https://github.com/tauri-apps/plugins-workspace/issues/198)
- [Github Issue: How to use "Down" migrations?](https://github.com/tauri-apps/plugins-workspace/issues/1346)
