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
