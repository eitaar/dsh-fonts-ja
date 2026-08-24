import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  renderClient,
  validatePresetData,
  writeClient,
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

test("preset validation defaults a missing chat stack to the UI stack", () => {
  const [preset] = validatePresetData({
    presets: [{ id: "legacy", ui: ["Inter"], code: ["Consolas"], faces: [] }],
  });
  assert.deepEqual(preset.chat, ["Inter"]);
});

test("preset validation rejects duplicate IDs and unsafe bundled file metadata", () => {
  assert.throws(
    () => validatePresetData({
      presets: [
        { id: "same", ui: [], code: [], faces: [] },
        { id: "same", ui: [], code: [], faces: [] },
      ],
    }),
    /duplicate/i,
  );
  assert.throws(
    () => validatePresetData({
      presets: [{
        id: "unsafe-file",
        ui: [],
        code: [],
        faces: [{ family: "Inter", file: "../inter.woff2" }],
      }],
    }),
    /file/i,
  );
});

test("rendered client has no unresolved generation markers", async () => {
  const output = await renderClient();
  assert.doesNotMatch(output, /__PRESETS__|__FONT_CONFIG_HELPERS__/);
  assert.match(output, /function buildFontCss/);
});

test("checked-in client matches generated output", async () => {
  const expected = await renderClient();
  const actual = await readFile("lib/client.js", "utf8");
  assert.equal(actual, expected, "run npm run generate and commit lib/client.js");
});

test("writeClient check mode rejects drift without modifying the output", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dsh-fonts-generator-"));
  const outputPath = join(directory, "client.js");
  await writeFile(outputPath, "stale generated client\n");

  await assert.rejects(() => writeClient({ check: true, outputPath }), /out of date|drift/i);
  assert.equal(await readFile(outputPath, "utf8"), "stale generated client\n");
});
