---
layout: default
parent: Laravel
nav_order: 7
---

# Laravel Boost

Laravel Boost 是 Laravel 團隊推出的一款幫助我們開發者快速開發 Laravel 應用程序的套件。裡面包含多種給 AI Agent 使用的工具，例如 AI Guidelines、Agent Skills、Boost MCP Server Configuration 等等。

安裝 Laravel Boost：

```bash
composer require laravel/boost --dev
```

生成給 AI Agent 使用的 Guideline、MCP Server 與 Skills：

```bash
php artisan boost:install
```

你可以選擇你要使用的功能，例如 AI Guidelines、Agent Skills、Boost MCP Server Configuration 等等。

```text
 ┌ Which Boost features would you like to configure? ───────────┐
 │ › ◼ AI Guidelines                                            │
 │   ◼ Agent Skills                                             │
 │   ◼ Boost MCP Server Configuration                           │
 └──────────────────────────────────────────────────────────────┘
```

或是選擇你常用的 AI Agent。

```text
 ┌ Which AI agents would you like to configure? ────────────────┐
 │ › ◻ Claude Code                                              │
 │   ◻ Codex                                                    │
 │   ◻ Cursor                                                   │
 │   ◻ Gemini CLI                                               │
 │   ◻ GitHub Copilot                                           │
 │   ◼ Junie                                                    │
 │   ◻ OpenCode                                                 │
 └──────────────────────────────────────────────────────────────┘
```

我在 AI Agent 中選擇了 Junie，Laravel Boost 就會幫我新增一個 `.junie` 資料夾，並在底下生成各種給 AI Agent 使用的工具與 Guidelines。

```text
.junie
├── guidelines.md
├── mcp
│   └── mcp.json
└── skills
    ├── livewire-development
    │   ├── reference
    │   │   └── javascript-hooks.md
    │   └── SKILL.md
    ├── pest-testing
    │   └── SKILL.md
    └── tailwindcss-development
        └── SKILL.md
```

## MCP Server

MCP Server 提供查找文檔、讀取資料庫、執行 Tinker 等多種功能，讓 AI Agent 可以更方便的與 Laravel 應用程序互動。

## AI Guidelines

Laravel Boost 生成的 Guidelines 會包含一些基本的 Laravel 開發指南，讓 AI 可以寫出符合 Laravel 優雅風格的程式碼。

當然你也可以新增你的 Guidelines，我們可以新增一個資料夾 `.ai/guidelines`，在底下新增你的 Guidelines，例如 `custom-guidelines.blade.php`。

```blade
# Custom Guidelines

## MUST Rules

- Write clean, readable, and maintainable code.
- Test is required.
```

之後我們就可以再次執行 `php artisan boost:install`，Laravel Boost 就會幫我們將我們新增的 Guidelines 合併到 Guidelines 中。

## Skills

預設的 Skills 有 Livewire Development、Pest Testing、Tailwind CSS Development 等等，AI Agent 可以根據這些 SKills 來寫出符合最佳實踐的程式碼。

我們也可以新增自己的 Skills，我們可以新增一個資料夾 `.ai/skills`，在底下新增你的 Skills，例如 `search-web/SKILL.md`。

```markdown
---
name: search-web
description: Search web features, including components and workflows.
---

# Search Web

## When to use this skill
Use this skill when working with search web features...

## Features

- Feature 1: [clear & short description].
- Feature 2: [clear & short description]. Example usage:
```

之後我們就可以再次執行 `php artisan boost:install`，Laravel Boost 就會幫我們將我們新增的 Skills 合併到 Skills 中。

## Guidelines & Skills 的差異

Guideline 有點像是開發指南與指導原則，你可以把你的開發習慣與團隊規則寫在上面。Skills 則是給 AI Agent 使用的工具，專注於特定目的上。

| 方面 | Guidelines | Skills |
| --- | --- | --- |
| 載入時機 | 前置作業，每一次都會載入 | 根據需求載入 |
| 範圍 | 屬於廣泛且基礎的原則 | 屬於專注於特定任務的工具 |
| 目的 | 核心規範與最佳實踐 | 詳細的實現模式 |

## 參考資料

- [Laravel Boost](https://laravel.com/docs/12.x/boost)
