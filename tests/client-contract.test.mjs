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
