import test from "node:test";
import assert from "node:assert/strict";
import {
  buildFontCss,
  MARKDOWN_TEXT_TOKENS,
  migratePrefs,
  normalizeCustomSet,
  replaceFace,
  normalizePreset,
  serializeFamily,
  validateWoff2Url,
} from "../scripts/font-config.mjs";

test("quotes named families but preserves generic families", () => {
  assert.equal(serializeFamily(["Yu Gothic UI", "sans-serif"]), '"Yu Gothic UI", sans-serif');
});

test("builds independent ui chat and code variables", () => {
  const css = buildFontCss({ ui: ["Yu Gothic UI", "sans-serif"], chat: ["Yu Mincho", "serif"], code: ["UDEV Gothic 35NF", "monospace"], faces: [] });
  assert.match(css, /--dsw-font-family: "Yu Gothic UI", sans-serif/);
  assert.match(css, /--dsh-fonts-chat-family: "Yu Mincho", serif/);
  assert.match(css, /--ds-font-family-code: "UDEV Gothic 35NF", monospace/);
  for (const token of MARKDOWN_TEXT_TOKENS) {
    assert.match(css, new RegExp("--dsw-font-markdown-" + token + ":"));
    assert.match(css, new RegExp("--dsw-font-markdown-" + token + "-font-family:"));
  }
  assert.doesNotMatch(css, /--dsw-font-markdown-code:/);
  assert.doesNotMatch(css, /--dsw-font-markdown-code-block:/);
  assert.doesNotMatch(css, /--dsw-font-markdown-code-block-small:/);
});

test("emits no font-face for installed local families", () => {
  const css = buildFontCss({ ui: ["Meiryo"], chat: ["Yu Mincho"], code: ["Consolas"], faces: [{ family: "Meiryo", src: [] }] });
  assert.doesNotMatch(css, /@font-face/);
});

test("emits explicitly allowed bundled plugin faces but rejects relative public sources", () => {
  const bundledCss = buildFontCss({
    ui: ["Inter"],
    chat: ["Inter"],
    code: ["Consolas"],
    faces: [{ family: "Inter", src: ["/plugins/dsh-fonts/fonts/inter-latin-400-normal.woff2"] }],
  }, { allowBundled: true });
  const publicCss = buildFontCss({
    ui: ["Inter"],
    chat: ["Inter"],
    code: ["Consolas"],
    faces: [{ family: "Inter", src: ["/plugins/dsh-fonts/fonts/inter-latin-400-normal.woff2"] }],
  });
  assert.match(bundledCss, /@font-face/);
  assert.match(bundledCss, /\/plugins\/dsh-fonts\/fonts\/inter-latin-400-normal\.woff2/);
  assert.doesNotMatch(publicCss, /@font-face/);
  assert.deepEqual(normalizeCustomSet({
    ui: [{ family: "Inter", src: ["/plugins/dsh-fonts/fonts/inter-latin-400-normal.woff2"] }],
    chat: [],
    code: [],
  }).ui, []);
  assert.deepEqual(normalizePreset({
    id: "third-party",
    ui: ["Inter"],
    code: ["Consolas"],
    faces: [{ family: "Inter", src: ["/plugins/dsh-fonts/fonts/inter-latin-400-normal.woff2"] }],
  }).faces, []);
});

test("falls back to the ui stack when chat is empty or invalid", () => {
  const css = buildFontCss({ ui: ["Yu Gothic UI", "sans-serif"], chat: ["", 42], code: ["Consolas"], faces: [] });
  assert.match(css, /--dsh-fonts-chat-family: "Yu Gothic UI", sans-serif/);
  assert.match(css, /--dsw-font-markdown-base-font-family: var\(--dsh-fonts-chat-family, var\(--dsw-font-family\)\)/);
});

test("escapes css strings and emits validated remote faces", () => {
  const escapedFamily = "Remote\\Acceptance\"\r\n\fTail";
  const escapedUrl = "http://127.0.0.1:3080/plugins/dsh-fonts/fonts/inter-latin-400-normal.woff2?x=quote\"\\";
  const css = buildFontCss({ ui: [escapedFamily], chat: ["Yu Mincho"], code: ["Consolas"], faces: [{ family: escapedFamily, src: [escapedUrl], weight: "400", display: "swap" }] });
  assert.match(css, /@font-face/);
  assert.match(css, /format\("woff2"\)/);
  assert.match(css, /Remote\\\\Acceptance\\"\\r\\n\\fTail/);
  assert.match(css, /quote\\"\\\\/);
});

test("normalizes a three-role custom set", () => {
  assert.deepEqual(
    normalizeCustomSet({
      ui: [{ family: "Yu Gothic UI", src: [] }],
      chat: [{ family: "Yu Mincho" }],
      code: [{ family: "UDEV Gothic 35NF", src: [] }],
    }),
    {
      ui: [{ family: "Yu Gothic UI", src: [], weight: "400", display: "swap" }],
      chat: [{ family: "Yu Mincho", src: [], weight: "400", display: "swap" }],
      code: [{ family: "UDEV Gothic 35NF", src: [], weight: "400", display: "swap" }],
    },
  );
});

test("migrates version 1 preferences by copying ui to chat", () => {
  assert.deepEqual(
    migratePrefs({ selected: "custom", custom: { ui: [{ family: "Meiryo", src: [] }], code: [{ family: "Consolas", src: [] }] } }),
    { version: 2, selected: "custom", custom: {
      ui: [{ family: "Meiryo", src: [], weight: "400", display: "swap" }],
      chat: [{ family: "Meiryo", src: [], weight: "400", display: "swap" }],
      code: [{ family: "Consolas", src: [], weight: "400", display: "swap" }],
    } },
  );
});

test("uses preset ui as chat when chat is absent", () => {
  const preset = normalizePreset({ id: "legacy", ui: ["Inter", "'Segoe UI'"], code: ["JetBrains Mono"], faces: [] });
  assert.deepEqual(preset.ui, ["Inter", "Segoe UI"]);
  assert.deepEqual(preset.chat, ["Inter", "Segoe UI"]);
});

test("rejects whitespace-only preset ids", () => {
  assert.equal(normalizePreset({ id: "  ", ui: ["Inter"], code: ["Consolas"], faces: [] }), null);
});

test("replaces an existing face with the same family and weight", () => {
  assert.deepEqual(
    replaceFace([
      { family: "Meiryo", src: [], weight: "400", display: "swap" },
      { family: "Meiryo", src: ["https://fonts.example/meiryo-700.woff2"], weight: "700", display: "swap" },
    ], { family: "Meiryo", src: ["https://fonts.example/meiryo-400.woff2"], weight: "400", display: "swap" }),
    [
      { family: "Meiryo", src: ["https://fonts.example/meiryo-400.woff2"], weight: "400", display: "swap" },
      { family: "Meiryo", src: ["https://fonts.example/meiryo-700.woff2"], weight: "700", display: "swap" },
    ],
  );
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
  const normalized = normalizeCustomSet({ ui: [
    { family: "", src: [] }, { family: "Meiryo", src: [] }, { family: "Bad Remote", src: ["ftp://example.jp/bad.woff2"] },
  ], chat: [], code: [{ family: "Consolas" }] });
  assert.deepEqual(normalized.ui.map((face) => face.family), ["Meiryo"]);
  assert.deepEqual(normalized.chat, []);
  assert.deepEqual(normalized.code.map((face) => face.family), ["Consolas"]);
});

test("keeps an unknown selected preset pending while normalizing prefs", () => {
  assert.deepEqual(migratePrefs({ selected: "third-party-serif", custom: null }), { version: 2, selected: "third-party-serif", custom: null });
});

test("maps malformed persisted data to the system-safe restore path", () => {
  assert.equal(migratePrefs({ selected: 42, custom: "broken" }), null);
});
