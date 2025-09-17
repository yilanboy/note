---
layout: default
parent: Zed
nav_order: 1
---

# Zed 設定

一般設定。

```json
// Zed settings
//
// For information on how to configure Zed, see the Zed
// documentation: https://zed.dev/docs/configuring-zed
//
// To see all of Zed's default settings without changing your
// custom settings, run `zed: open default settings` from the
// command palette (cmd-shift-p / ctrl-shift-p)
{
  "features": {
    "edit_prediction_provider": "copilot"
  },
  "base_keymap": "JetBrains",
  "theme": {
    "mode": "system",
    "light": "One Light",
    "dark": "One Dark"
  },
  "icon_theme": {
    "mode": "system",
    "light": "Zed (Default)",
    "dark": "Catppuccin Mocha"
  },
  "ui_font_family": "JetBrainsMono Nerd Font",
  "ui_font_size": 20,
  "buffer_font_family": "JetBrainsMono Nerd Font",
  "buffer_font_size": 20,
  "buffer_line_height": {
    "custom": 2
  },
  "vertical_scroll_margin": 10,
  "autosave": "on_focus_change",
  "format_on_save": "on",
  "ensure_final_newline_on_save": true,
  "terminal": {
    "font_size": 20
  },
  "agent": {
    "default_model": {
      "provider": "google",
      "model": "gemini-2.5-flash"
    }
  },
  "vim_mode": true,
  "relative_line_numbers": true
}
```

Keymap 設定

```json
// Zed keymap
//
// For information on binding keys, see the Zed
// documentation: https://zed.dev/docs/key-bindings
//
// To see the default key bindings run `zed: open default keymap`
// from the command palette.
[
  {
    "context": "Workspace",
    "bindings": {
      // "shift shift": "file_finder::Toggle"
    }
  },
  {
    "context": "Editor && vim_mode == insert",
    "bindings": {
      // "j k": "vim::NormalBefore"
    }
  },
  {
    "context": "Editor && VimControl && !VimWaiting && !menu",
    "bindings": {
      // put key-bindings here if you want them to work in normal & visual mode
      "z h": "vim::StartOfLineDownward",
      "z l": "vim::EndOfLineDownward"
    }
  },
  {
    "context": "Editor && vim_mode == normal && !VimWaiting && !menu",
    "bindings": {
      // put key-bindings here if you want them to work only in normal mode
    }
  },
  {
    "context": "Editor && vim_mode == visual && !VimWaiting && !menu",
    "bindings": {
      // visual, visual line & visual block modes
      ">": "editor::Indent",
      "<": "editor::Outdent"
    }
  },
  {
    "context": "Editor && vim_mode == insert && !menu",
    "bindings": {
      // put key-bindings here if you want them to work in insert mode
    }
  }
]
```
