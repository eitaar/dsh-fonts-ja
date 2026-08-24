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

test("template and generated runtime migrate preferences and keep the compatibility wrapper", async () => {
  for (const filename of ["lib/client.tpl.js", "lib/client.js"]) {
    const client = await readFile(filename, "utf8");
    assert.match(client, /version:\s*PREFS_VERSION/, filename);
    assert.match(client, /selectCustomSet/, filename);
    assert.match(client, /selectCustom\(ui,\s*code\)/, filename);
    assert.match(client, /chat:\s*ui/, filename);
  }
});

test("selecting Default clears custom preferences before persisting", async () => {
  for (const filename of ["lib/client.tpl.js", "lib/client.js"]) {
    const client = await readFile(filename, "utf8");
    assert.match(
      client,
      /function select\(id\)\s*\{[\s\S]*?if \(id === DEFAULT_ID\) custom = null;[\s\S]*?persist\(\);/,
      filename,
    );
  }
});

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
