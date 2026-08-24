// Generates lib/client.js from lib/client.tpl.js + data/presets.json.
// Run from the repo root: node scripts/gen-client.mjs
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePreset } from "./font-config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const presetPath = join(root, "data", "presets.json");
const templatePath = join(root, "lib", "client.tpl.js");
const helperPath = join(root, "scripts", "font-config.mjs");
const clientPath = join(root, "lib", "client.js");
const SAFE_WOFF2_BASENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.woff2$/i;

function fail(message) {
  throw new Error(`invalid bundled preset data: ${message}`);
}

function normalizeBundledFace(face, presetId, index) {
  if (!face || typeof face !== "object" || Array.isArray(face)) fail(`${presetId}.faces[${index}] must be an object`);
  if (Object.hasOwn(face, "src")) fail(`${presetId}.faces[${index}] must use file, not src`);
  if (typeof face.file !== "string" || !SAFE_WOFF2_BASENAME.test(face.file)) {
    fail(`${presetId}.faces[${index}].file must be a safe .woff2 basename`);
  }
  const normalized = normalizePreset({ id: "face", ui: [face.family], code: [], faces: [] });
  if (!normalized?.ui.length) fail(`${presetId}.faces[${index}].family must be a non-empty string`);
  return {
    family: normalized.ui[0],
    weight: typeof face.weight === "string" && face.weight.trim() ? face.weight.trim() : "400",
    display: typeof face.display === "string" && face.display.trim() ? face.display.trim() : "swap",
    file: face.file,
  };
}

export function validatePresetData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.presets)) fail("presets must be an array");
  const ids = new Set();
  return data.presets.map((preset, index) => {
    const normalized = normalizePreset({ ...preset, faces: [] });
    if (!normalized || !normalized.id) fail(`presets[${index}] needs an id plus ui, chat, and code stacks`);
    if (ids.has(normalized.id)) fail(`duplicate preset id: ${normalized.id}`);
    ids.add(normalized.id);
    if (!Array.isArray(preset.faces)) fail(`${normalized.id}.faces must be an array`);
    return {
      ...normalized,
      faces: preset.faces.map((face, faceIndex) => normalizeBundledFace(face, normalized.id, faceIndex)),
    };
  });
}

export async function renderClient() {
  const [template, helperSource, dataSource] = await Promise.all([
    readFile(templatePath, "utf8"),
    readFile(helperPath, "utf8"),
    readFile(presetPath, "utf8"),
  ]);
  const presets = validatePresetData(JSON.parse(dataSource));
  const embeddedHelpers = helperSource.replace(/^export /gmu, "");
  if (!template.includes("__FONT_CONFIG_HELPERS__") || !template.includes("__PRESETS__")) {
    throw new Error("client template is missing a generation marker");
  }
  const withHelpers = template.replace("__FONT_CONFIG_HELPERS__", embeddedHelpers);
  const client = withHelpers.replace("__PRESETS__", JSON.stringify(presets, null, 2));
  if (client.includes("__FONT_CONFIG_HELPERS__") || client.includes("__PRESETS__")) {
    throw new Error("client template has unresolved generation markers");
  }
  return client;
}

export async function writeClient({ check = false, outputPath = clientPath } = {}) {
  const client = await renderClient();
  let current = null;
  try {
    current = await readFile(outputPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (check) {
    if (current !== client) throw new Error("lib/client.js is out of date; run npm run generate");
    return false;
  }
  await writeFile(outputPath, client);
  return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  try {
    const wrote = await writeClient({ check });
    console.log(check ? "lib/client.js is up to date" : `generated lib/client.js${wrote ? "" : " (unchanged)"}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
