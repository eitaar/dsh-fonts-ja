# Japanese and Independent Chat Fonts Design

**Status:** Proposed design approved in chat on 2026-08-24; awaiting written-spec review  
**Target:** `dsh-fonts` 0.1.0 on DeepSeek Harness 0.1.1-rc.2  
**Repository:** `zhijun-dai/dsh-Fonts`

## Purpose

Extend `dsh-fonts` so Japanese users can select suitable Japanese system fonts or import Japanese WOFF2 faces, while choosing UI, chat/Markdown, and code fonts independently. Preserve existing presets, saved preferences, and third-party `ctx.fonts` consumers.

## Goals

- Add first-party Japanese Gothic and Japanese Mincho-chat presets without bundling large Japanese font files.
- Add three independent roles: UI, chat/Markdown, and code.
- Allow each custom role to reference either an installed local font family or an HTTP(S) WOFF2 file.
- Apply the chat role consistently to Markdown body text, headings, emphasis, small text, and tables while leaving inline and block code on the code role.
- Add Japanese labels and Japanese preview strings to the settings UI.
- Migrate existing preferences automatically and keep the public registry backward compatible.
- Keep the generated `lib/client.js` reproducible from `lib/client.tpl.js` and `data/presets.json`.

## Non-goals

- Do not bundle Noto Sans JP, Noto Serif JP, or other full Japanese webfonts.
- Do not enumerate installed system fonts; users enter a CSS family name when using a local font.
- Do not change DSH typography sizes, line heights, weights, colors, or spacing.
- Do not alter code-block, terminal, diff, or JSON-tree typography beyond the existing code-font role.
- Do not redesign unrelated settings UI or replace the current generator architecture.

## Current Behavior

`dsh-fonts` currently models a preset as `{ id, ui, code, faces }`. Selecting it injects `@font-face` rules and overrides only `--dsw-font-family` and `--ds-font-family-code` on `:root`. DSH chat Markdown indirectly uses the UI family through composite `--dsw-font-markdown-*` tokens, so UI and chat cannot differ. Custom imports accept only HTTP(S) URLs ending in `.woff2`, and bundled faces contain Latin glyphs only. Existing fallback stacks prefer Simplified Chinese families.

## Chosen Architecture

### 1. Three backward-compatible font roles

Extend `FontPreset` with an optional `chat` stack:

```ts
export interface FontPreset {
  id: string
  label?: string
  ui: string[]
  chat?: string[]
  code: string[]
  faces: FontFaceSpec[]
}
```

At every normalization boundary, resolve `chat` as `preset.chat ?? preset.ui`. Existing bundled and third-party presets therefore retain their current appearance without modification.

Model custom settings as three roles:

```ts
export interface CustomFontSet {
  ui: FontFaceSpec[]
  chat: FontFaceSpec[]
  code: FontFaceSpec[]
}
```

`FontFaceSpec.src` becomes optional. A missing or empty `src` means “reference an installed local family”; it participates in the stack but produces no `@font-face` rule. A non-empty `src` continues to represent WOFF2 sources.

### 2. Registry compatibility

Add the explicit API:

```ts
selectCustomSet(set: CustomFontSet): void
```

Keep the existing API:

```ts
selectCustom(ui: FontFaceSpec[], code: FontFaceSpec[]): void
```

The legacy method delegates to `selectCustomSet({ ui, chat: ui, code })`. Existing consumers compile and behave as before. Registry snapshots always expose normalized three-role custom sets. Registered presets with no `chat` property are normalized to `chat: ui` internally.

### 3. CSS application

The active stylesheet defines:

```css
:root {
  --dsw-font-family: <UI stack>;
  --dsh-fonts-chat-family: <chat stack>;
  --ds-font-family-code: <code stack>;
}
```

DSH 0.1.1-rc.2 renders prose through composite Markdown tokens such as `--dsw-font-markdown-base` and `--dsw-font-markdown-h1`. To avoid hashed component selectors, override the non-code composite tokens on `body`. Each override retains DSH’s split style, weight, size, and line-height variables and substitutes only `var(--dsh-fonts-chat-family)` as the family.

The overridden token set is:

- `h1`, `h2`, `h3`, `h4`
- `base`, `base-strong`, `base-italic`, `base-strong-italic`
- `small`, `small-strong`, `small-italic`, `small-strong-italic`
- `table`, `table-head`

Do not override `markdown-code`, `markdown-code-block`, or `markdown-code-block-small`; they continue to resolve through `--ds-font-family-code`.

Create one pure CSS builder used by the generated client and its unit tests. The builder must quote and escape user-provided family names, backslashes, quotes, and newlines. WOFF2 sources must parse through `new URL`, use only `http:` or `https:`, and have a pathname ending in `.woff2` case-insensitively.

### 4. Japanese presets

Add two presets to `data/presets.json`.

`japanese-gothic`:

- UI and chat: `Yu Gothic UI`, `Yu Gothic`, `Hiragino Sans`, `Hiragino Kaku Gothic ProN`, `Noto Sans JP`, `Meiryo`, `sans-serif`
- Code: preserve the system code stack, with optional installed `UDEV Gothic` and `Noto Sans Mono CJK JP` ahead of Cascadia/Consolas only when explicitly listed in the preset
- Faces: empty; no Japanese binaries are distributed

`japanese-mincho-chat`:

- UI: the Japanese Gothic stack above
- Chat: `Yu Mincho`, `YuMincho`, `Hiragino Mincho ProN`, `Noto Serif JP`, `BIZ UDPMincho`, `MS PMincho`, `serif`
- Code: same as `japanese-gothic`
- Faces: empty

The order intentionally prefers Windows Japanese fonts first because the target environment is Windows, then macOS and cross-platform Noto fallbacks.

### 5. Custom-font editor

Render three editor sections in this order: UI, chat/Markdown, code. Each section includes a source-mode choice:

- **Installed font:** family name only; store `src: []`.
- **WOFF2 URL:** family name, URL, and weight; validate before storing.

Each section lists and removes its own entries. Selecting a local family must take effect immediately without creating an invalid empty `@font-face` rule. The settings preview includes:

- UI specimen: `設定 Settings 123`
- Chat specimen: `日本語の文章を読みやすく表示します。Markdown **太字** 123`
- Code specimen: `const 日本語 = "font";`

The preview is presentational only and does not parse Markdown.

### 6. Localization

Register a complete Japanese dictionary alongside the existing Chinese and English dictionaries. Add Japanese labels for the two presets, three roles, source modes, validation errors, weights, preview labels, add/remove actions, and the local-font caveat. Dictionary key sets must be identical across `zh`, `en`, and `ja`.

### 7. Preference migration

Persist this versioned shape under the existing `dsh-fonts:prefs` key:

```json
{
  "version": 2,
  "selected": "custom",
  "custom": {
    "ui": [],
    "chat": [],
    "code": []
  }
}
```

Migration rules:

1. Missing or invalid data returns the system preset without throwing.
2. An unversioned `{ selected, custom: { ui, code } }` record becomes version 2 with `chat` copied from `ui`.
3. An unknown selected preset remains pending for a third-party registration exactly as today; if it never registers, the visible state stays system-safe.
4. Invalid custom entries are discarded individually. Valid siblings remain.
5. The first successful preference-changing action writes version 2; reading alone does not need to rewrite storage.

### 8. Generator and file ownership

Treat these as source files:

- `data/presets.json`: preset data and bundled-face metadata
- `lib/client.tpl.js`: browser-plugin template and UI
- `scripts/gen-client.mjs`: validation and deterministic generation
- `lib/types/client/index.d.ts`: public API contract

Treat `lib/client.js` as generated output. Never patch it directly. Run `npm run generate` and require a clean second generation in verification.

Add a small pure helper module under `scripts/` for preference normalization, font-source validation, family escaping, and CSS generation. The generator inlines the required helper bodies into the client template, while Node tests import the same helpers directly. This keeps the zero-runtime-dependency client and avoids duplicating security-sensitive serialization logic.

### 9. Error handling and safety

- Reject empty local family names.
- Reject URLs with credentials, non-HTTP(S) schemes, fragments containing control characters, or non-WOFF2 pathnames.
- Escape all CSS strings; never concatenate raw user input into quoted CSS.
- Skip `@font-face` output for local entries.
- A failed remote font load falls through to the role’s Japanese-aware system stack and does not clear the saved selection.
- Missing DSH split Markdown tokens degrade to the normal UI family rather than invalidating the whole `font` shorthand.
- Unloading the plugin removes its single owned style element and restores host typography.

## File Map

- Modify `data/presets.json` — add optional chat stacks and Japanese presets.
- Modify `lib/client.tpl.js` — three-role registry, migration, settings controls, previews, and Japanese locale.
- Modify `scripts/gen-client.mjs` — validate chat data and inline pure helpers.
- Create `scripts/font-config.mjs` — normalization, migration, validation, and CSS serialization.
- Modify `lib/types/client/index.d.ts` — optional chat preset field, three-role custom set, compatibility API.
- Regenerate `lib/client.js` — generated browser bundle.
- Modify `package.json` — add `test` and `check` scripts using Node’s built-in test runner.
- Create `tests/font-config.test.mjs` — migration, validation, escaping, and token-generation unit tests.
- Create `tests/generator.test.mjs` — preset/schema validation and deterministic generation test.
- Modify `README.md` and `README.en.md` — Japanese usage, three roles, local/WOFF2 modes, migration, and limitations.

## Verification Strategy

### Automated

- Unit-test old-preference migration to `chat = ui`.
- Unit-test invalid records and per-entry filtering.
- Unit-test local families produce stack entries but no `@font-face` rule.
- Unit-test WOFF2 URL validation and CSS escaping.
- Unit-test all non-code Markdown tokens use the chat family and all code tokens remain untouched.
- Unit-test presets without `chat` normalize to `ui`.
- Unit-test Japanese presets and locale dictionaries.
- Run generation twice and assert the second run produces no diff.
- Run `node --check` on host and generated client files.

### Browser acceptance on DSH 0.1.1-rc.2

1. Install the local plugin into an isolated `web` profile.
2. Select `japanese-gothic`; verify sidebar, buttons, user text, assistant Markdown, headings, tables, and input use the intended Japanese Gothic stack.
3. Select `japanese-mincho-chat`; verify UI remains Gothic, assistant prose becomes Mincho, and code remains monospaced.
4. Add `Yu Gothic UI` as an installed UI font and `Yu Mincho` as an installed chat font; reload and verify persistence.
5. Add one valid Japanese WOFF2 face; verify network loading, weight selection, and fallback behavior.
6. Verify code blocks, terminal, JSON, diff, and inline code continue to use the selected code role.
7. Switch back to Default and uninstall the plugin; verify the injected style is removed.

## Acceptance Criteria

- Japanese Gothic and Japanese Mincho-chat presets are selectable without downloading bundled Japanese font files.
- UI, chat/Markdown, and code roles can display three different font families simultaneously.
- Existing presets and third-party presets without `chat` remain functional and use UI font for chat.
- Existing unversioned preferences restore without data loss and chat initially matches UI.
- Existing `selectCustom(ui, code)` consumers continue to work.
- Local family entries and WOFF2 entries both persist and reapply after reload.
- Assistant prose, headings, emphasis, small text, and tables use the chat role; code surfaces use the code role.
- Generated output is deterministic, automated checks pass, and DSH 0.1.1-rc.2 browser acceptance passes.

