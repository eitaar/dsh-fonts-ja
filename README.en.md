<div align="center">

# dsh-Fonts

**A font system plugin for DeepSeek Harness** — bundled OFL webfonts served offline, user-imported custom fonts, and a `ctx.fonts` registry other plugins can extend

[![GitHub stars](https://img.shields.io/github/stars/zhijun-dai/dsh-Fonts)](https://github.com/zhijun-dai/dsh-Fonts/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/zhijun-dai/dsh-Fonts)](https://github.com/zhijun-dai/dsh-Fonts/issues)
[![GitHub contributors](https://img.shields.io/github/contributors/zhijun-dai/dsh-Fonts)](https://github.com/zhijun-dai/dsh-Fonts/graphs/contributors)
[![License](https://img.shields.io/github/license/zhijun-dai/dsh-Fonts)](./LICENSE)

English | [中文](./README.md)

</div>

## Overview

DeepSeek Harness's web UI ships with system font stacks and no webfonts. dsh-Fonts turns fonts into a composable resource:

- **Bundled presets**: JetBrains Mono + Inter, Fira Code + IBM Plex Sans, and Cascadia Code ship offline. Japanese Gothic and Japanese Mincho-chat presets list system-family names only; they include no Japanese font binaries.
- **Custom import**: configure UI, chat body, and code fonts independently; the selection persists locally
- **Plugin API**: a `ctx.fonts` registry service — other plugins can register or consume font presets via `ctx.get("fonts")`

## Previews

<details>
<summary>Settings → General → Font (click to expand)</summary>

![Font settings row](./assets/fonts-settings.webp)

</details>

<details>
<summary>JetBrains Mono + Inter applied</summary>

![JetBrains Mono + Inter](./assets/fonts-jetbrains-inter.webp)

</details>

## Usage

A dual-face DSH plugin: the host half serves the bundled font files, the browser half provides the registry and the settings row. After installation, pick fonts in **Settings → General → Font**.

**Install:**

```sh
# GitHub
dsh plugin --profile web add github:zhijun-dai/dsh-Fonts

# local directory (the profile dir is a pnpm workspace root — -w is required)
dsh plugin --profile web add -w /path/to/dsh-Fonts

# npm
dsh plugin --profile web add dsh-fonts
```

Then restart `dsh web`.

**Switching fonts:** Settings → General → Font row — preset cards apply live; "Default" restores the system stacks.

**Japanese presets:** Japanese Gothic assigns Japanese sans-serif/monospace candidates to UI, chat, and code. Japanese Mincho chat keeps a Gothic UI and monospace code stack while preferring Mincho for chat text. The three roles are independent: UI affects the application chrome, chat affects message prose, and code affects code blocks.

**Importing custom fonts:** choose a source and add a font for each role (UI / Chat / Code):

| Field | Meaning |
| --- | --- |
| Installed family | Enter only a family name; the named font **must already be installed on this device** and no font file is downloaded |
| Remote WOFF2 | An HTTP(S) direct link whose pathname ends in `.woff2`; its URL authority must not contain username/password credentials |
| Weight | 400 Regular · 500 Medium · 600 Semibold · 700 Bold — **pick the weight your file actually is**. Download pages usually label it: Regular=400, Bold=700. A wrong pick won't break anything, the UI just shows a browser-synthesized "fake bold" |

Installed Japanese family examples include `Yu Gothic UI`, `Meiryo`, and `Yu Mincho` on Windows; `Hiragino Sans` and `Hiragino Mincho ProN` on macOS; and installed `Noto Sans JP`, `Noto Serif JP`, and `Noto Sans Mono CJK JP` on Linux. Availability always depends on the fonts installed on the current machine.

Example — importing Inter Regular from the Fontsource CDN as the UI font:

```
Family: Inter
woff2 URL: https://cdn.jsdelivr.net/npm/@fontsource/inter@5.3.0/files/inter-latin-400-normal.woff2
Weight: 400 Regular
```

It applies immediately and survives reloads; re-adding the same family+weight replaces the old entry, and Remove deletes it.

A remote WOFF2 causes the browser to contact a third-party host. That host can observe your IP address, request time, and request metadata, and the request can affect first-load performance and offline availability. Prefer trusted hosts, or use an installed family or an offline bundled preset.

## Plugin API

Other plugins consume the font service lazily via `ctx.get("fonts")` (cross-plugin `require` is a build error — module imports cannot be used):

```ts
// in your plugin's browser half
import type { FontPreset, FontRegistry } from 'dsh-fonts/client'

// register your own font preset
const dispose = ctx.get('fonts')?.register({
  id: 'my-preset',
  ui: ['My Font', '-apple-system', 'sans-serif'],
  chat: ['My Chat Font', 'serif'],
  code: ['My Mono', 'monospace'],
  faces: [{ family: 'My Font', weight: '400', src: ['https://example.com/my-font.woff2'] }],
})

// subscribe to snapshots
const off = ctx.get('fonts')?.subscribe((snapshot) => {
  console.log(snapshot.activeId, snapshot.revision)
})
```

Use `selectCustomSet` to provide independent custom faces for all three roles at once:

```js
ctx.get("fonts")?.selectCustomSet({
  ui: [
    { family: "Yu Gothic UI", src: [] },
    { family: "Meiryo", src: [] },
  ],
  chat: [
    { family: "Yu Mincho", src: [] },
    { family: "Noto Serif JP", src: [] },
  ],
  code: [
    { family: "UDEV Gothic 35NF", src: [] },
    { family: "Cascadia Mono", src: [] },
  ],
});
```

The legacy `selectCustom(ui, code)` wrapper remains compatible: it uses the UI stack as the chat stack too. Preferences are now version 2. When version 1 preferences are read, their UI faces are copied into chat and the next save writes version 2.

Full `FontPreset` / `FontSnapshot` / `FontRegistry` types live in `lib/types/client/index.d.ts`.

## How it works

- The browser half provides the registry to the root context via `ctx.provide("fonts", registry)` at `apply` time
- On selection changes it rewrites an injected `<style id="dsh-fonts-style">`: `@font-face` rules plus `:root` overrides of `--dsw-font-family` / `--dsh-fonts-chat-family` / `--ds-font-family-code`
- The host half registers a `/plugins/dsh-fonts/fonts/*` route on `ctx.webServer`, serving the woff2 files bundled under `data/fonts/`
- The selection persists in `localStorage` (`dsh-fonts:prefs`) and is restored at boot; a selected plugin-registered preset falls back to the default if that plugin is absent

## Known limitations

- Some components hardcode an `Inter, var(--dsw-font-family)` stack (e.g. the workspace browser) — those keep Inter on systems that have it installed
- Bundled fonts are latin subsets (~280KB total); CJK text falls back through the stack tail to system fonts (PingFang SC / Microsoft YaHei)
- Custom imports accept woff2 URLs only (http/https)

## Development check

Run the complete generated-artifact, host/client syntax, and test check:

```sh
npm run check
```

## Font credits

Bundled fonts are licensed under the SIL Open Font License 1.1; license texts ship in `data/fonts/LICENSE-*.txt`:

- [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) — JetBrains s.r.o.
- [Inter](https://github.com/rsms/inter) — Rasmus Andersson
- [Fira Code](https://github.com/tonsky/FiraCode) — The Fira Code Project Authors
- [IBM Plex Sans](https://github.com/IBM/plex) — IBM Corp.
- [Cascadia Code](https://github.com/microsoft/cascadia-code) — Microsoft

## 💝 Thanks

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — the plugin architecture and the `dsh.client` dual-face mechanism
- [Fontsource](https://fontsource.org) — webfont distribution
- [dsh-Catppuccin](https://github.com/zhijun-dai/Catppuccin-dsh-theme) / [dsh-Solarized](https://github.com/zhijun-dai/Solarized-dsh-theme) — the repository conventions this plugin follows

<div align="center">

**dsh-Fonts** · Copyright 2026-present [zhijun-dai](https://github.com/zhijun-dai) · [MIT License](./LICENSE)

</div>
