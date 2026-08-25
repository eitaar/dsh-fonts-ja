import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
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
  const gothic = presets.find((preset) => preset.id === "japanese-gothic");
  const mincho = presets.find((preset) => preset.id === "japanese-mincho-chat");
  assert.ok(gothic);
  assert.ok(mincho);
  assert.deepEqual(gothic.faces, [{
    family: "Noto Sans JP",
    weight: "400",
    display: "swap",
    file: "noto-sans-jp-400-normal.woff2",
  }]);
  assert.deepEqual(mincho.faces, gothic.faces);
  assert.deepEqual(
    mincho.chat.slice(0, 2),
    ["Yu Mincho", "YuMincho"],
  );
});

test("the bundled Noto Sans JP file and license are present", async () => {
  const font = await stat("data/fonts/noto-sans-jp-400-normal.woff2");
  assert.ok(font.isFile());
  assert.ok(font.size > 1_000_000, "the Japanese face should not be a tiny placeholder");
  const license = await readFile("data/fonts/LICENSE-noto-sans-jp-OFL.txt", "utf8");
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
});

test("system fallback stacks retain Japanese coverage for custom font failures", async () => {
  const raw = JSON.parse(await readFile("data/presets.json", "utf8"));
  const system = validatePresetData(raw).find((preset) => preset.id === "system");
  assert.ok(system.ui.includes("Meiryo"));
  assert.ok(system.code.includes("Noto Sans Mono CJK JP"));
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
