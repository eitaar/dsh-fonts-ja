# Japanese and Chat Font Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax so progress survives handoffs.

**Goal:** Extend dsh-Fonts so Japanese users can choose UI, chat/Markdown, and code fonts independently, using Japanese system-font presets, installed local families, or safe remote WOFF2 sources.

**Architecture:** Move normalization, preference migration, URL validation, and CSS generation into a pure shared module. The build script embeds those helpers and validated preset data into the generated browser client. The client remains a single-file DSH plugin, but its UI and persistence layer become three-role aware while preserving the old two-argument public API.

**Tech Stack:** Node.js ESM, node:test, browser DOM/CSS, JSON presets, DSH 0.1.1-rc.2 plugin runtime.

**Spec:** docs/superpowers/specs/2026-08-24-japanese-chat-fonts-design.md

**Global Constraints:**

- Do not bundle Japanese font binaries.
- Keep UI, chat, and code choices independent.
- A preset without chat must use its UI stack for chat.
- Existing selectCustom(ui, code) callers must continue to work and map chat to UI.
- Accept installed local family names and HTTP(S) WOFF2 URLs only.
- Reject credentials, non-HTTP schemes, and non-WOFF2 remote paths.
- Override only non-code Markdown composite variables; preserve the host's size, weight, style, and line-height tokens.
- Do not override Markdown inline-code, code-block, or code-block-small tokens.
- Preserve the existing dsh-fonts:prefs storage key and pending third-party preset behavior.
- Discard invalid custom faces individually while retaining valid siblings.
- Keep the zh, en, and ja dictionary key sets identical.
- Generate lib/client.js deterministically from lib/client.tpl.js and data/presets.json.
- Use test-first steps and commit after each task.

---

## Task 1: Add the pure three-role model and preference migration

**Files:**

- Create: scripts/font-config.mjs
- Create: tests/font-config.test.mjs
- Modify: package.json

**Public interfaces introduced:**

~~~js
export const PREFS_VERSION = 2;
export const FONT_ROLES = ["ui", "chat", "code"];
export function validateWoff2Url(value) {}
export function normalizeFace(face) {}
export function normalizeCustomSet(set) {}
export function normalizePreset(preset) {}
export function migratePrefs(value) {}
~~~

- [ ] Write the failing model and migration tests.

~~~js
import test from "node:test";
import assert from "node:assert/strict";
import {
  migratePrefs,
  normalizeCustomSet,
  normalizePreset,
  validateWoff2Url,
} from "../scripts/font-config.mjs";

test("normalizes a three-role custom set", () => {
  assert.deepEqual(
    normalizeCustomSet({
      ui: [{ family: "Yu Gothic UI", src: [] }],
      chat: [{ family: "Yu Mincho" }],
      code: [{ family: "UDEV Gothic 35NF", src: [] }],
    }),
    {
      ui: [{
        family: "Yu Gothic UI",
        src: [],
        weight: "400",
        display: "swap",
      }],
      chat: [{
        family: "Yu Mincho",
        src: [],
        weight: "400",
        display: "swap",
      }],
      code: [{
        family: "UDEV Gothic 35NF",
        src: [],
        weight: "400",
        display: "swap",
      }],
    },
  );
});

test("migrates version 1 preferences by copying ui to chat", () => {
  assert.deepEqual(
    migratePrefs({
      selected: "custom",
      custom: {
        ui: [{ family: "Meiryo", src: [] }],
        code: [{ family: "Consolas", src: [] }],
      },
    }),
    {
      version: 2,
      selected: "custom",
      custom: {
        ui: [{ family: "Meiryo", src: [], weight: "400", display: "swap" }],
        chat: [{ family: "Meiryo", src: [], weight: "400", display: "swap" }],
        code: [{ family: "Consolas", src: [], weight: "400", display: "swap" }],
      },
    },
  );
});

test("uses preset ui as chat when chat is absent", () => {
  const preset = normalizePreset({
    id: "legacy",
    ui: ["Inter", "'Segoe UI'"],
    code: ["JetBrains Mono"],
    faces: [],
  });
  assert.deepEqual(preset.ui, ["Inter", "Segoe UI"]);
  assert.deepEqual(preset.chat, ["Inter", "Segoe UI"]);
});

test("accepts only safe HTTP(S) WOFF2 URLs", () => {
  assert.equal(validateWoff2Url("https://fonts.example.jp/jp.woff2"), true);
  assert.equal(validateWoff2Url("http://127.0.0.1:3080/jp.woff2?rev=1"), true);
  assert.equal(validateWoff2Url("data:font/woff2;base64,AAAA"), false);
  assert.equal(validateWoff2Url("https://user:pass@example.jp/jp.woff2"), false);
  assert.equal(validateWoff2Url("https://example.jp/jp.otf"), false);
  assert.equal(validateWoff2Url("https://example.jp/jp.woff2#%0A"), false);
});

test("drops only invalid custom entries and keeps valid siblings", () => {
  const normalized = normalizeCustomSet({
    ui: [
      { family: "", src: [] },
      { family: "Meiryo", src: [] },
      { family: "Bad Remote", src: ["ftp://example.jp/bad.woff2"] },
    ],
    chat: [],
    code: [{ family: "Consolas" }],
  });
  assert.deepEqual(normalized.ui.map((face) => face.family), ["Meiryo"]);
  assert.deepEqual(normalized.chat, []);
  assert.deepEqual(normalized.code.map((face) => face.family), ["Consolas"]);
});

test("keeps an unknown selected preset pending while normalizing prefs", () => {
  assert.deepEqual(migratePrefs({ selected: "third-party-serif", custom: null }), {
    version: 2,
    selected: "third-party-serif",
    custom: null,
  });
});

test("maps malformed persisted data to the system-safe restore path", () => {
  assert.equal(migratePrefs({ selected: 42, custom: "broken" }), null);
});
~~~

- [ ] Add the test command to package.json.

~~~json
{
  "scripts": {
    "generate": "node scripts/gen-client.mjs",
    "test": "node --test"
  }
}
~~~

- [ ] Run the focused test and confirm it fails because scripts/font-config.mjs does not exist.

~~~powershell
npm test
~~~

Expected: ERR_MODULE_NOT_FOUND for scripts/font-config.mjs.

- [ ] Implement scripts/font-config.mjs with these exact normalization rules:

  - Trim every family string.
  - Remove one matching pair of outer single or double quotes so existing pre-quoted preset families retain their real CSS family name.
  - Remove empty strings and stable-deduplicate families.
  - Model each custom role as FontFaceSpec[], not as a string stack.
  - Accept empty role arrays; the registry appends the system fallback stack.
  - If a custom chat array is absent during migration, copy the normalized UI faces.
  - Keep local faces valid when src is absent or empty.
  - For remote faces, retain only safe HTTP(S) WOFF2 URLs.
  - Discard a face with an empty family or an explicit but entirely invalid src array, while preserving valid sibling faces.
  - Reject literal control characters anywhere in a URL and decoded control characters in its fragment.
  - migratePrefs must return a normalized version 2 object for valid input and copy UI to chat for old data.
  - Missing or structurally invalid persisted data must produce the system-safe state without throwing.
  - Preserve an unknown selected preset ID so restore can keep it pending for later third-party registration.

- [ ] Run the focused test and confirm it passes.

~~~powershell
npm test
~~~

Expected: all tests in tests/font-config.test.mjs pass.

- [ ] Commit Task 1.

~~~powershell
git add scripts/font-config.mjs tests/font-config.test.mjs package.json
git commit -m "feat: add three-role font configuration model"
~~~

---

## Task 2: Generate safe CSS for UI, chat, and code independently

**Files:**

- Modify: scripts/font-config.mjs
- Modify: tests/font-config.test.mjs

**Public interfaces introduced:**

~~~js
export const MARKDOWN_TEXT_TOKENS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "base",
  "base-strong",
  "base-italic",
  "base-strong-italic",
  "small",
  "small-strong",
  "small-italic",
  "small-strong-italic",
  "table",
  "table-head",
];
export function serializeFamily(families) {}
export function buildFontCss(config) {}
~~~

- [ ] Add failing CSS tests.

~~~js
import {
  buildFontCss,
  MARKDOWN_TEXT_TOKENS,
  serializeFamily,
} from "../scripts/font-config.mjs";

test("quotes named families but preserves generic families", () => {
  assert.equal(
    serializeFamily(["Yu Gothic UI", "sans-serif"]),
    "\"Yu Gothic UI\", sans-serif",
  );
});

test("builds independent ui chat and code variables", () => {
  const css = buildFontCss({
    ui: ["Yu Gothic UI", "sans-serif"],
    chat: ["Yu Mincho", "serif"],
    code: ["UDEV Gothic 35NF", "monospace"],
    faces: [],
  });

  assert.match(css, /--dsw-font-family: "Yu Gothic UI", sans-serif/);
  assert.match(css, /--dsh-fonts-chat-family: "Yu Mincho", serif/);
  assert.match(css, /--ds-font-family-code: "UDEV Gothic 35NF", monospace/);
  for (const token of MARKDOWN_TEXT_TOKENS) {
    assert.match(css, new RegExp("--dsw-font-markdown-" + token + ":"));
  }
  assert.doesNotMatch(css, /--dsw-font-markdown-code:/);
  assert.doesNotMatch(css, /--dsw-font-markdown-code-block:/);
  assert.doesNotMatch(css, /--dsw-font-markdown-code-block-small:/);
});

test("emits no font-face for installed local families", () => {
  const css = buildFontCss({
    ui: ["Meiryo"],
    chat: ["Yu Mincho"],
    code: ["Consolas"],
    faces: [{ family: "Meiryo", src: [] }],
  });
  assert.doesNotMatch(css, /@font-face/);
});

test("escapes css strings and emits validated remote faces", () => {
  const css = buildFontCss({
    ui: ["RemoteAcceptance"],
    chat: ["Yu Mincho"],
    code: ["Consolas"],
    faces: [{
      family: "RemoteAcceptance",
      src: ["http://127.0.0.1:3080/plugins/dsh-fonts/fonts/inter-latin-400-normal.woff2"],
      weight: "400",
      display: "swap",
    }],
  });
  assert.match(css, /@font-face/);
  assert.match(css, /format\("woff2"\)/);
});
~~~

- [ ] Run the focused test and confirm the new exports are missing.

~~~powershell
node --test tests/font-config.test.mjs
~~~

Expected: module export or assertion failures for CSS helpers.

- [ ] Implement one CSS string serializer used by serializeFamily and @font-face output. It must escape backslash, quotes, CR, LF, and form-feed in family names and validated source URLs. Preserve only these generic family keywords unquoted: serif, sans-serif, monospace, cursive, fantasy, system-ui, ui-serif, ui-sans-serif, ui-monospace, and ui-rounded.

- [ ] Implement buildFontCss. Its root block must define:

~~~css
:root {
  --dsw-font-family: UI_STACK;
  --dsh-fonts-chat-family: CHAT_STACK;
  --ds-font-family-code: CODE_STACK;
}
~~~

- [ ] For every MARKDOWN_TEXT_TOKENS entry, emit both the composite variable and its family split variable. Preserve host typography by composing the chat family with host split tokens and safe fallbacks.

~~~css
body {
  --dsw-font-markdown-base-font-family:
    var(--dsh-fonts-chat-family, var(--dsw-font-family));
  --dsw-font-markdown-base:
    var(--dsw-font-markdown-base-font-style, normal)
    var(--dsw-font-markdown-base-font-weight, 400)
    var(--dsw-font-markdown-base-font-size, 1rem) /
    var(--dsw-font-markdown-base-line-height, normal)
    var(--dsh-fonts-chat-family, var(--dsw-font-family));
}
~~~

- [ ] Ensure no generated declaration starts with --dsw-font-markdown-code, --dsw-font-markdown-code-block, or --dsw-font-markdown-code-block-small.

- [ ] Emit @font-face only for faces with at least one validated remote source. Use font-style normal, weight normal, and display swap when omitted.

- [ ] Run the focused test and confirm it passes.

~~~powershell
node --test tests/font-config.test.mjs
~~~

- [ ] Commit Task 2.

~~~powershell
git add scripts/font-config.mjs tests/font-config.test.mjs
git commit -m "feat: generate independent chat font CSS"
~~~

---

## Task 3: Add Japanese presets and make generation deterministic

**Files:**

- Modify: data/presets.json
- Modify: scripts/gen-client.mjs
- Modify: lib/client.tpl.js
- Regenerate: lib/client.js
- Create: tests/generator.test.mjs
- Modify: package.json

- [ ] Add failing generator tests for Japanese presets, helper embedding, validation, and drift detection.

~~~js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  renderClient,
  validatePresetData,
} from "../scripts/gen-client.mjs";

test("preset data contains Japanese Gothic and Mincho-chat choices", async () => {
  const raw = JSON.parse(await readFile("data/presets.json", "utf8"));
  const presets = validatePresetData(raw);
  assert.ok(presets.some((preset) => preset.id === "japanese-gothic"));
  assert.ok(presets.some((preset) => preset.id === "japanese-mincho-chat"));
  assert.deepEqual(
    presets.find((preset) => preset.id === "japanese-mincho-chat").chat.slice(0, 2),
    ["Yu Mincho", "YuMincho"],
  );
});

test("rendered client has no unresolved generation markers", async () => {
  const output = await renderClient();
  assert.doesNotMatch(output, /__PRESETS__|__FONT_CONFIG_HELPERS__/);
  assert.match(output, /function buildFontCss/);
});
~~~

- [ ] Run the focused test and confirm it fails because the generator exports and Japanese presets are absent.

~~~powershell
node --test tests/generator.test.mjs
~~~

- [ ] Add these exact presets to data/presets.json with faces set to an empty array.

~~~json
{
  "id": "japanese-gothic",
  "ui": ["Yu Gothic UI", "Yu Gothic", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Meiryo", "sans-serif"],
  "chat": ["Yu Gothic UI", "Yu Gothic", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Meiryo", "sans-serif"],
  "code": ["UDEV Gothic 35NF", "Noto Sans Mono CJK JP", "Cascadia Mono", "Consolas", "monospace"],
  "faces": []
}
~~~

~~~json
{
  "id": "japanese-mincho-chat",
  "ui": ["Yu Gothic UI", "Yu Gothic", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Meiryo", "sans-serif"],
  "chat": ["Yu Mincho", "YuMincho", "Hiragino Mincho ProN", "Noto Serif JP", "BIZ UDPMincho", "MS PMincho", "serif"],
  "code": ["UDEV Gothic 35NF", "Noto Sans Mono CJK JP", "Cascadia Mono", "Consolas", "monospace"],
  "faces": []
}
~~~

- [ ] Refactor scripts/gen-client.mjs to export validatePresetData, renderClient, and writeClient. Keep direct invocation working.

- [ ] Have validatePresetData validate every id and UI/chat/code stack, default missing chat to UI, reject duplicate IDs, and validate bundled face records separately as family plus a safe .woff2 file basename. Bundled data uses file; public and custom FontFaceSpec records use src.

- [ ] Read scripts/font-config.mjs as text, remove only top-level export prefixes with this exact transform, and insert it at __FONT_CONFIG_HELPERS__ in lib/client.tpl.js.

~~~js
const embeddedHelpers = helperSource.replace(/^export /gmu, "");
~~~

- [ ] Replace __PRESETS__ only after helper embedding, and throw if either marker is missing or remains after rendering.

- [ ] Add a --check mode that compares renderClient output with lib/client.js and exits non-zero on drift without modifying files.

- [ ] Add the generation drift command.

~~~json
{
  "scripts": {
    "generate": "node scripts/gen-client.mjs",
    "generate:check": "node scripts/gen-client.mjs --check",
    "test": "node --test"
  }
}
~~~

- [ ] In createRegistry, convert each validated bundled file to a FontFaceSpec src under FONT_URL, then pass the resulting public preset through normalizePreset. Registered third-party presets go through the same normalizePreset boundary without the file conversion.

- [ ] Generate the client twice and run the focused tests.

~~~powershell
npm run generate
$firstHash = (Get-FileHash -LiteralPath "lib/client.js" -Algorithm SHA256).Hash
npm run generate
$secondHash = (Get-FileHash -LiteralPath "lib/client.js" -Algorithm SHA256).Hash
if ($firstHash -ne $secondHash) { throw "lib/client.js generation is not deterministic" }
node --test tests/generator.test.mjs
npm run generate:check
~~~

Expected: all commands exit 0 and lib/client.js contains normalized Japanese preset data plus embedded helpers.

- [ ] Commit Task 3.

~~~powershell
git add data/presets.json scripts/gen-client.mjs lib/client.tpl.js lib/client.js tests/generator.test.mjs package.json
git commit -m "feat: add Japanese presets and deterministic generation"
~~~

---

## Task 4: Preserve the public API while upgrading persistence and registry behavior

**Files:**

- Modify: lib/types/client/index.d.ts
- Modify: lib/client.tpl.js
- Regenerate: lib/client.js
- Create: tests/client-contract.test.mjs

**Required type surface:**

~~~ts
export interface FontFaceSpec {
  family: string;
  src?: string[];
  weight?: string;
  display?: "swap" | "auto";
}

export interface FontPreset {
  id: string;
  label?: string;
  ui: string[];
  chat?: string[];
  code: string[];
  faces: FontFaceSpec[];
}

export interface CustomFontSet {
  ui: FontFaceSpec[];
  chat: FontFaceSpec[];
  code: FontFaceSpec[];
}

export interface FontRegistry {
  register(preset: FontPreset): () => void;
  unregister(id: string): void;
  select(id: string): void;
  selectCustomSet(set: CustomFontSet): void;
  /** @deprecated Use selectCustomSet. Chat will use the UI stack. */
  selectCustom(ui: FontFaceSpec[], code: FontFaceSpec[]): void;
  clearCustom(): void;
  getSnapshot(): FontSnapshot;
  subscribe(listener: (snapshot: FontSnapshot) => void): () => void;
}
~~~

- [ ] Add failing contract tests that inspect the template, generated client, and declaration file.

~~~js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("types expose chat and the new custom-set API", async () => {
  const declarations = await readFile("lib/types/client/index.d.ts", "utf8");
  assert.match(declarations, /chat\?: string\[\]/);
  assert.match(declarations, /chat: FontFaceSpec\[\]/);
  assert.match(declarations, /selectCustomSet\(set: CustomFontSet\): void/);
  assert.match(
    declarations,
    /selectCustom\(ui: FontFaceSpec\[\], code: FontFaceSpec\[\]\): void/,
  );
  assert.match(declarations, /register\(preset: FontPreset\): \(\) => void/);
  assert.match(declarations, /clearCustom\(\): void/);
});

test("runtime migrates preferences and keeps the compatibility wrapper", async () => {
  const client = await readFile("lib/client.js", "utf8");
  assert.match(client, /version:\s*PREFS_VERSION/);
  assert.match(client, /selectCustomSet/);
  assert.match(client, /selectCustom\(ui,\s*code\)/);
  assert.match(client, /chat:\s*ui/);
});
~~~

- [ ] Run the contract test and confirm it fails for the absent chat types and method.

~~~powershell
node --test tests/client-contract.test.mjs
~~~

- [ ] Update lib/types/client/index.d.ts exactly as shown above, preserving any unrelated existing exports.

- [ ] In lib/client.tpl.js, load localStorage through migratePrefs. If migration returns null, use the default selection and do not apply partial custom data.

- [ ] Save preferences only in this shape:

~~~js
{
  version: PREFS_VERSION,
  selected,
  custom,
}
~~~

- [ ] Implement selectCustomSet(set) by normalizing its three FontFaceSpec arrays, applying buildFontCss, setting selected to custom, and persisting version 2. If all three normalized arrays are empty, delegate to clearCustom.

- [ ] Keep selectCustom(ui, code) as a compatibility wrapper with this behavior:

~~~js
selectCustom(ui, code) {
  this.selectCustomSet({ ui, chat: ui, code });
}
~~~

- [ ] Preserve register, unregister, select, clearCustom, getSnapshot, and subscribe. Normalize every bundled and third-party preset at registration so a missing chat becomes UI.

- [ ] Build a custom active stack from each role's face families followed by the corresponding SYSTEM role stack. Combine all three role face lists for @font-face generation; repeated equivalent faces must be stable-deduplicated.

- [ ] Restore preferences without calling a mutation that writes storage. Reading an unversioned record may apply its migrated in-memory form, but only the next successful preference-changing action writes version 2.

- [ ] Preserve an unknown selected preset as pendingId. When a matching third-party preset registers, apply it without losing the migrated custom snapshot.

- [ ] Keep clearCustom behavior: clear the custom snapshot, select the system preset, remove the owned style element, and persist version 2. Plugin disposal must remove the same owned style element and all listeners without deleting preferences.

- [ ] Regenerate and run the contract plus full test suite.

~~~powershell
npm run generate
node --test tests/client-contract.test.mjs
npm test
~~~

- [ ] Commit Task 4.

~~~powershell
git add lib/types/client/index.d.ts lib/client.tpl.js lib/client.js tests/client-contract.test.mjs
git commit -m "feat: expose independent custom chat fonts"
~~~

---

## Task 5: Upgrade the settings UI, previews, and Japanese localization

**Files:**

- Modify: lib/client.tpl.js
- Regenerate: lib/client.js
- Modify: tests/client-contract.test.mjs

**UI behavior:**

- Preset cards show three labeled preview rows: UI, Chat, and Code.
- The custom editor has separate UI, Chat, and Code face-entry sections, in that order.
- Each section lists and removes only its own entries.
- Each section's add form offers Installed family and Remote WOFF2 source modes.
- Installed family mode creates no @font-face entry.
- Remote WOFF2 mode requires a family name, a validated URL, and a weight.
- Invalid fields show inline errors and do not mutate the registry.
- The preview uses fixed Japanese-capable specimens and is presentational only.
- Locale selection remains owned by the host; this plugin registers complete zh, en, and ja dictionaries.

- [ ] Extend the failing contract test with stable UI hooks and Japanese copy.

~~~js
test("settings UI exposes three roles, source modes, and Japanese labels", async () => {
  const template = await readFile("lib/client.tpl.js", "utf8");
  assert.match(template, /data-font-role="ui"/);
  assert.match(template, /data-font-role="chat"/);
  assert.match(template, /data-font-role="code"/);
  assert.match(template, /data-font-source="local"/);
  assert.match(template, /data-font-source="woff2"/);
  assert.match(template, /チャットフォント/);
  assert.match(template, /インストール済みフォント/);
  assert.match(template, /リモート WOFF2/);
  assert.match(template, /設定 Settings 123/);
  assert.match(
    template,
    /日本語の文章を読みやすく表示します。Markdown \*\*太字\*\* 123/,
  );
  assert.match(template, /const 日本語 = "font";/);
  assert.match(template, /assertDictionaryKeyParity\(zh, en, ja\)/);
  assert.match(template, /ctx\.locale\.register\(SETTINGS_NS,\s*\{\s*zh,\s*en,\s*ja/s);
});
~~~

- [ ] Run the focused test and confirm the required UI hooks and Japanese strings are missing.

~~~powershell
node --test tests/client-contract.test.mjs
~~~

- [ ] Add font.japanese-gothic and font.japanese-mincho-chat labels to zh and en, then add a complete ja dictionary. Include three roles, source modes, validation errors, weights, preview labels, add/remove actions, and the caveat that a named local font must already be installed.

- [ ] Add assertDictionaryKeyParity(zh, en, ja), compare sorted key arrays, and throw during module initialization if any locale is missing or adding a key. Register all three dictionaries through ctx.locale.register.

- [ ] Render three preview rows for every preset and the custom card. Use normalizePreset before rendering so legacy presets display their UI stack in the chat row.

- [ ] Use these exact presentational-only preview strings; do not parse Markdown in the preview:

~~~text
UI: 設定 Settings 123
Chat: 日本語の文章を読みやすく表示します。Markdown **太字** 123
Code: const 日本語 = "font";
~~~

- [ ] Add stable data attributes data-font-role and data-font-source exactly as asserted above. Do not couple tests to generated class names.

- [ ] Update the reusable face editor to accept kind values ui, chat, and code. Adding or removing an entry must construct the entire three-role CustomFontSet and call selectCustomSet once.

- [ ] For Installed family, append { family, src: [] }. For Remote WOFF2, append { family, src: [url], weight, display: "swap" }. The local mode must not show or require URL and weight inputs.

- [ ] Reject an empty local family immediately. Validate a remote family, URL, and weight on submit. A failed validation must leave the displayed entry list, active selection, injected style, and stored preference unchanged.

- [ ] Apply valid custom values only through selectCustomSet; do not duplicate normalization or CSS construction in UI handlers. Selecting a local face applies immediately after Add and produces no empty @font-face rule.

- [ ] Regenerate and run syntax plus contract tests.

~~~powershell
npm run generate
node --check lib/client.tpl.js
node --check lib/client.js
node --test tests/client-contract.test.mjs
npm test
~~~

- [ ] Commit Task 5.

~~~powershell
git add lib/client.tpl.js lib/client.js tests/client-contract.test.mjs
git commit -m "feat: add Japanese three-role font settings"
~~~

---

## Task 6: Add repository-wide verification and user documentation

**Files:**

- Modify: package.json
- Modify: README.md
- Modify: README.en.md
- Modify: tests/generator.test.mjs
- Modify: tests/client-contract.test.mjs

- [ ] Run the intended repository command and confirm it fails because package.json does not yet define check.

~~~powershell
npm run check
~~~

Expected: npm reports Missing script: check.

- [ ] Add a generator drift test that compares renderClient with the checked-in lib/client.js byte-for-byte.

~~~js
test("checked-in client matches generated output", async () => {
  const expected = await renderClient();
  const actual = await readFile("lib/client.js", "utf8");
  assert.equal(actual, expected, "run npm run generate and commit lib/client.js");
});
~~~

- [ ] Add the repository check command.

~~~json
{
  "scripts": {
    "generate": "node scripts/gen-client.mjs",
    "generate:check": "node scripts/gen-client.mjs --check",
    "test": "node --test",
    "check": "npm run generate:check && node --check lib/index.js && node --check lib/client.js && npm test"
  }
}
~~~

- [ ] Update README.md in Chinese and README.en.md in English with:

  - Japanese Gothic and Mincho-chat preset descriptions.
  - Independent UI/chat/code behavior.
  - Examples for installed Japanese families on Windows, macOS, and Linux.
  - The fact that a named family must already be installed.
  - Remote WOFF2 restrictions: HTTP(S), .woff2 pathname, no credentials.
  - Privacy/performance warning for third-party font hosting.
  - Backward compatibility of selectCustom(ui, code).
  - The new selectCustomSet example.
  - Preference version 2 migration behavior.
  - How to run npm run check.

- [ ] Use this exact new API example in both READMEs, translating only the surrounding prose.

~~~js
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
~~~

- [ ] Run the complete repository check.

~~~powershell
npm run check
git diff --check
~~~

Expected: both commands exit 0.

- [ ] Commit Task 6.

~~~powershell
git add package.json README.md README.en.md tests/generator.test.mjs tests/client-contract.test.mjs
git commit -m "docs: document Japanese and chat font configuration"
~~~

---

## Task 7: Perform isolated DSH browser acceptance

**Files:**

- No product file changes are expected.
- Use temporary profile data only under: .tmp/dsh-fonts-acceptance
- If acceptance exposes a defect, modify only the concrete source and test files required by that defect, regenerate lib/client.js, rerun npm run check, and commit the correction before repeating acceptance.

- [ ] Confirm the working tree is clean and all automated checks pass.

~~~powershell
git status --short
npm run check
dsh --version
~~~

Expected: no status output, checks pass, and DSH reports 0.1.1-rc.2. If the installed version differs, record it in the final handoff and perform acceptance against that actual version.

- [ ] Create an isolated DSH home inside the repository and resolve the repository path without using the user's normal profile.

~~~powershell
$acceptanceHome = Join-Path (Get-Location) ".tmp\dsh-fonts-acceptance"
New-Item -ItemType Directory -Force -Path $acceptanceHome | Out-Null
$resolvedRepo = (Resolve-Path ".").Path
$env:DSH_HOME = $acceptanceHome
dsh plugin --profile web add -w $resolvedRepo
dsh --profile web --dump-config
~~~

Expected: the dump shows the local dsh-Fonts checkout in the isolated web profile.

- [ ] Start DSH Web from the same PowerShell session.

~~~powershell
dsh web --profile web
~~~

- [ ] Open the dsh-Fonts settings and verify the Japanese Gothic preset:

  - UI controls use the Japanese Gothic system stack.
  - Japanese chat text is legible and uses the chat stack.
  - Inline code and fenced code retain the code stack.
  - The preset card shows separate UI, Chat, and Code rows.

- [ ] Verify the Japanese Mincho-chat preset:

  - UI stays Gothic.
  - Ordinary Markdown paragraphs, headings, emphasis, small text, and tables use the Mincho/serif chat stack.
  - Inline code and fenced code remain Gothic/monospace and do not inherit Mincho.
  - Computed values for --dsw-font-family, --dsh-fonts-chat-family, and --ds-font-family-code are different as configured.

- [ ] Verify Installed family custom mode by adding these separate entries to their respective sections:

~~~text
UI entry: Meiryo
Chat entry: Yu Mincho
Code entry 1: Cascadia Mono
Code entry 2: Consolas
~~~

Expected: each Add succeeds without an @font-face rule; unavailable entries fall through to the role's SYSTEM stack.

- [ ] Verify Remote WOFF2 transport using the plugin's existing Latin test font, while keeping Japanese coverage validation on local Japanese system fonts.

~~~js
location.origin + "/plugins/dsh-fonts/fonts/inter-latin-400-normal.woff2"
~~~

Enter the resulting absolute URL as a Remote WOFF2 UI entry named RemoteAcceptance with weight 400. Keep the local Yu Mincho chat entry and Cascadia Mono/Consolas code entries.

Expected: one @font-face rule loads RemoteAcceptance; Japanese glyphs fall back because this test resource is intentionally Latin-only; chat and code remain independent.

- [ ] Verify invalid remote sources are rejected without changing the active style or localStorage:

~~~text
data:font/woff2;base64,AAAA
https://user:pass@example.jp/font.woff2
https://example.jp/font.otf
~~~

- [ ] Add a syntactically valid but unreachable Remote WOFF2 entry using http://127.0.0.1:9/missing.woff2. Confirm the browser falls through to the Japanese-aware SYSTEM tail, keeps the selected custom set, and restores the same selection after reload.

- [ ] Verify version 1 migration in DevTools:

~~~js
localStorage.setItem(
  "dsh-fonts:prefs",
  JSON.stringify({
    selected: "custom",
    custom: {
      ui: [{ family: "Meiryo", src: [] }],
      code: [{ family: "Consolas", src: [] }],
    },
  }),
);
location.reload();
~~~

Expected: the plugin loads successfully, Chat shows Meiryo, and the next saved value contains version 2 plus chat equal to UI.

- [ ] Make one successful preference change and confirm it rewrites the migrated record as version 2. Merely reloading the unversioned record must not rewrite storage.

- [ ] Select Default and verify the owned style element is removed, host typography returns, and dsh-fonts:prefs stores version 2 with selected set to system and custom set to null.

- [ ] Stop DSH Web and remove the plugin only from the isolated profile.

~~~powershell
dsh plugin --profile web remove dsh-fonts
Remove-Item Env:DSH_HOME
~~~

Do not recursively delete the isolated directory during implementation; leave it available for diagnosis or remove it later through an explicitly reviewed cleanup.

- [ ] If no corrections were needed, record the browser, OS, DSH version, and pass results in the implementation handoff. If corrections were needed, commit the exact files reported by git status after npm run check passes.

- [ ] Run final verification after acceptance.

~~~powershell
npm run check
git diff --check
git status --short
~~~

Expected: checks pass and the working tree is clean except for the ignored .tmp acceptance profile.

---

## Completion Criteria

- Japanese Gothic and Mincho-chat presets are selectable without bundled Japanese binaries.
- UI, non-code Markdown chat, and code fonts can be configured independently.
- Installed local family mode emits no @font-face.
- Remote mode accepts only safe HTTP(S) WOFF2 URLs.
- Existing presets and selectCustom(ui, code) callers retain compatible behavior.
- Version 1 preferences migrate to version 2 with chat copied from UI.
- Generated client output is deterministic and drift-checked.
- Unit, contract, syntax, generation, and isolated browser acceptance checks pass.
- README.md and README.en.md document usage, safety, compatibility, and verification.
