<div align="center">

# dsh-Fonts

**DeepSeek Harness 的字体系统插件** — 内置 OFL 开源字体离线分发、自定义字体导入、以及可供其他插件扩展的 `ctx.fonts` 注册表

[![GitHub stars](https://img.shields.io/github/stars/zhijun-dai/dsh-Fonts)](https://github.com/zhijun-dai/dsh-Fonts/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/zhijun-dai/dsh-Fonts)](https://github.com/zhijun-dai/dsh-Fonts/issues)
[![GitHub contributors](https://img.shields.io/github/contributors/zhijun-dai/dsh-Fonts)](https://github.com/zhijun-dai/dsh-Fonts/graphs/contributors)
[![License](https://img.shields.io/github/license/zhijun-dai/dsh-Fonts)](./LICENSE)

[English](./README.en.md) | 中文

</div>

## 简介

DeepSeek Harness 的 Web UI 默认使用系统字体栈，没有任何内置 webfont。dsh-Fonts 把字体变成可组合的资源：

- **内置预设**：JetBrains Mono + Inter、Fira Code + IBM Plex Sans、Cascadia Code 随插件包离线分发。面向日文的「日本语哥特」和「日本语明朝（聊天）」预设仅列出系统字体家族名，不包含日文字体二进制文件。
- **自定义导入**：可分别设置 UI、聊天正文和代码三种字体；选择持久化在本机
- **插件 API**：提供 `ctx.fonts` 注册表服务，其他插件可以用 `ctx.get("fonts")` 注册或消费字体预设

## 预览

<details>
<summary>设置 → 常规 → 字体（点击展开截图）</summary>

![字体设置行](./assets/fonts-settings.webp)

</details>

<details>
<summary>JetBrains Mono + Inter 应用效果</summary>

![JetBrains Mono + Inter](./assets/fonts-jetbrains-inter.webp)

</details>

## 使用

本插件为 DeepSeek Harness 的双面插件（host 半边分发字体文件，浏览器半边提供注册表与设置行），安装后即可在 **设置 → 通用 → 字体** 中切换。

**安装方式：**

```sh
# GitHub
dsh plugin --profile web add github:zhijun-dai/dsh-Fonts

# 本地目录（profile 目录是 pnpm workspace 根，必须加 -w）
dsh plugin --profile web add -w /path/to/dsh-Fonts

# npm
dsh plugin --profile web add dsh-fonts
```

然后重启 `dsh web`。

**切换字体：** 设置 → 通用 → 字体行，点击预设卡片实时应用；选择"默认"恢复系统字体栈。

**日文字体预设：**「日本语哥特」将 UI、聊天和代码分别设为日文哥特/等宽候选；「日本语明朝（聊天）」保留哥特 UI 与等宽代码，但为聊天正文优先使用明朝体。三种角色互相独立：UI 影响界面，聊天影响消息正文，代码影响代码块。

**导入自定义字体：** 在字体行的编辑区为每个角色（UI / 聊天 / 代码）选择来源后添加字体：

| 字段 | 说明 |
| --- | --- |
| 已安装字体 | 只填写字体家族名；该名字对应的字体**必须已安装在当前设备**，不会下载字体文件 |
| 远程 WOFF2 | 字体文件的 HTTP(S) 直链，路径必须以 `.woff2` 结尾，且 URL authority 中不得包含用户名/密码凭据 |
| 字重 | 400 常规 · 500 中等 · 600 半粗 · 700 粗体，**选与文件实际粗细一致的字重**。下载页面通常会标注：Regular=400、Bold=700。选错不会报错，只是界面里的加粗效果会变成浏览器模拟的"假粗体" |

可作为本地家族名的日文字体例子：Windows 的 `Yu Gothic UI`、`Meiryo`、`Yu Mincho`；macOS 的 `Hiragino Sans`、`Hiragino Mincho ProN`；Linux 上安装后的 `Noto Sans JP`、`Noto Serif JP`、`Noto Sans Mono CJK JP`。实际可用性取决于当前设备已安装的字体。

例子——从 Fontsource CDN 导入 Inter 常规字重作为 UI 字体：

```
字体名：Inter
woff2 链接：https://cdn.jsdelivr.net/npm/@fontsource/inter@5.3.0/files/inter-latin-400-normal.woff2
字重：400 常规
```

点"添加"后立即应用，刷新页面后仍生效；同一字体名 + 同一字重重复添加会覆盖旧条目，点"移除"删除。

远程 WOFF2 会让浏览器请求第三方主机；该主机可能看到你的 IP、时间和请求元数据，也会影响首次加载速度和离线可用性。请优先使用可信任的来源，或改用已安装字体/随插件离线分发的预设。

## 插件 API

其他插件通过 `ctx.get("fonts")` 懒加载消费字体服务（跨插件的 `require` 是构建错误，不能用模块导入）：

```ts
// 你的插件浏览器半边
import type { FontPreset, FontRegistry } from 'dsh-fonts/client'

// 注册一套自己的字体预设
const dispose = ctx.get('fonts')?.register({
  id: 'my-preset',
  ui: ['My Font', '-apple-system', 'sans-serif'],
  chat: ['My Chat Font', 'serif'],
  code: ['My Mono', 'monospace'],
  faces: [{ family: 'My Font', weight: '400', src: ['https://example.com/my-font.woff2'] }],
})

// 订阅快照
const off = ctx.get('fonts')?.subscribe((snapshot) => {
  console.log(snapshot.activeId, snapshot.revision)
})
```

要为三种角色一次传入独立的自定义字体，使用 `selectCustomSet`：

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

旧版 `selectCustom(ui, code)` 仍兼容：它会把 UI 栈同时用作聊天栈。偏好设置已升级到版本 2；读取版本 1 时会将原有 UI 字体复制为聊天字体，保存后以版本 2 写回。

完整的 `FontPreset` / `FontSnapshot` / `FontRegistry` 类型见 `lib/types/client/index.d.ts`。

## 工作原理

- 浏览器半边在 `apply` 时通过 `ctx.provide("fonts", registry)` 把字体注册表挂到根上下文
- 选择变更时重写注入的 `<style id="dsh-fonts-style">`：`@font-face` 规则 + `:root` 上的 `--dsw-font-family` / `--dsh-fonts-chat-family` / `--ds-font-family-code` 覆盖
- host 半边通过 `ctx.webServer` 注册 `/plugins/dsh-fonts/fonts/*` 路由，分发 `data/fonts/` 里随包打包的 woff2
- 选择持久化在 `localStorage`（`dsh-fonts:prefs`），启动时恢复；插件注册的预设被选中后若该插件缺席，回退到默认

## 已知限制

- 部分组件硬编码了 `Inter, var(--dsw-font-family)` 优先栈（如工作区浏览器），这些位置装了 Inter 的系统上仍显示 Inter
- 捆绑字体为 latin 子集（体积 ~280KB）；中文按字体栈尾部回退到系统字体（PingFang SC / Microsoft YaHei）
- 自定义导入仅支持 woff2 直链（http/https）

## 开发检查

运行完整检查（生成物是否漂移、host/client 语法和测试）：

```sh
npm run check
```

## 字体致谢

捆绑字体均以 SIL Open Font License 1.1 授权，许可证文本随包分发于 `data/fonts/LICENSE-*.txt`：

- [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) — JetBrains s.r.o.
- [Inter](https://github.com/rsms/inter) — Rasmus Andersson
- [Fira Code](https://github.com/tonsky/FiraCode) — The Fira Code Project Authors
- [IBM Plex Sans](https://github.com/IBM/plex) — IBM Corp.
- [Cascadia Code](https://github.com/microsoft/cascadia-code) — Microsoft

## 💝 致谢

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — 插件化架构与 `dsh.client` 双面插件机制
- [Fontsource](https://fontsource.org) — webfont 分发
- [dsh-Catppuccin](https://github.com/zhijun-dai/Catppuccin-dsh-theme) / [dsh-Solarized](https://github.com/zhijun-dai/Solarized-dsh-theme) — 本插件参照的仓库结构

<div align="center">

**dsh-Fonts** · Copyright 2026-present [zhijun-dai](https://github.com/zhijun-dai) · [MIT License](./LICENSE)

</div>
