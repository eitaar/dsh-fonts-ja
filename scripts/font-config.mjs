export const PREFS_VERSION = 2;
export const FONT_ROLES = ["ui", "chat", "code"];
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

const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
]);

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const BUNDLED_WOFF2_PATH = /^\/plugins\/dsh-fonts\/fonts\/[A-Za-z0-9][A-Za-z0-9._-]*\.woff2$/i;

export function validateWoff2Url(value) {
  if (typeof value !== "string" || CONTROL_CHARACTERS.test(value)) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return false;
  if (!/\.woff2$/i.test(url.pathname)) return false;
  try {
    if (CONTROL_CHARACTERS.test(decodeURIComponent(url.hash.slice(1)))) return false;
  } catch {
    return false;
  }
  return true;
}

function validateFontSource(value, { allowBundled = false } = {}) {
  if (validateWoff2Url(value)) return true;
  return allowBundled
    && typeof value === "string"
    && !CONTROL_CHARACTERS.test(value)
    && !value.includes("..")
    && BUNDLED_WOFF2_PATH.test(value);
}

function normalizeFamily(value) {
  if (typeof value !== "string") return null;
  const family = value.trim();
  if (!family) return null;
  if ((family.startsWith("'") && family.endsWith("'")) || (family.startsWith('"') && family.endsWith('"'))) {
    const unquoted = family.slice(1, -1).trim();
    return unquoted || null;
  }
  return family;
}

function serializeCssString(value) {
  return `"${String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\r", "\\r")
    .replaceAll("\n", "\\n")
    .replaceAll("\f", "\\f")}"`;
}

export function serializeFamily(families) {
  if (!Array.isArray(families)) return "";
  return families
    .map((family) => normalizeFamily(family))
    .filter(Boolean)
    .map((family) => GENERIC_FAMILIES.has(family) ? family : serializeCssString(family))
    .join(", ");
}

function safeCssToken(value, fallback) {
  return typeof value === "string" && /^[a-zA-Z0-9 .%_-]+$/.test(value.trim()) ? value.trim() : fallback;
}

export function buildFontCss(config = {}, { allowBundled = false } = {}) {
  const ui = serializeFamily(config.ui);
  const chat = serializeFamily(config.chat) || ui;
  const code = serializeFamily(config.code);
  const chatFamily = "var(--dsh-fonts-chat-family, var(--dsw-font-family))";
  const markdown = MARKDOWN_TEXT_TOKENS.map((token) => [
    `--dsw-font-markdown-${token}-font-family: ${chatFamily};`,
    `--dsw-font-markdown-${token}: var(--dsw-font-markdown-${token}-font-style, normal) var(--dsw-font-markdown-${token}-font-weight, 400) var(--dsw-font-markdown-${token}-font-size, 1rem) / var(--dsw-font-markdown-${token}-line-height, normal) ${chatFamily};`,
  ].join("")).join("");
  const faces = Array.isArray(config.faces) ? config.faces.map((face) => normalizeFace(face, { allowBundled })).filter(Boolean).flatMap((face) => {
    const sources = face.src.filter((source) => validateFontSource(source, { allowBundled }));
    if (!sources.length) return [];
    const src = sources.map((url) => `url(${serializeCssString(url)}) format("woff2")`).join(",");
    const weight = safeCssToken(face.weight, "400");
    const display = safeCssToken(face.display, "swap");
    return [`@font-face{font-family:${serializeCssString(face.family)};font-style:normal;font-weight:${weight};font-display:${display};src:${src};}`];
  }).join("") : "";
  return `${faces}:root{--dsw-font-family: ${ui};--dsh-fonts-chat-family: ${chat};--ds-font-family-code: ${code};}body{${markdown}}`;
}

export function normalizeFace(face, { allowBundled = false } = {}) {
  if (!face || typeof face !== "object" || Array.isArray(face)) return null;
  const family = normalizeFamily(face.family);
  if (!family) return null;
  const hasSrc = Object.prototype.hasOwnProperty.call(face, "src");
  if (hasSrc && !Array.isArray(face.src)) return null;
  const src = hasSrc ? [...new Set(face.src.filter((source) => validateFontSource(source, { allowBundled })))] : [];
  if (hasSrc && face.src.length > 0 && src.length === 0) return null;
  const weight = typeof face.weight === "string" && face.weight.trim() ? face.weight.trim() : "400";
  const display = typeof face.display === "string" && face.display.trim() ? face.display.trim() : "swap";
  return { family, src, weight, display };
}

function normalizeStack(value) {
  if (!Array.isArray(value)) return null;
  const families = [];
  const seen = new Set();
  for (const item of value) {
    const family = normalizeFamily(item);
    if (family && !seen.has(family)) {
      seen.add(family);
      families.push(family);
    }
  }
  return families;
}

export function normalizeCustomSet(set) {
  if (!set || typeof set !== "object" || Array.isArray(set)) return null;
  const result = {};
  for (const role of FONT_ROLES) {
    if (role === "chat" && !Object.prototype.hasOwnProperty.call(set, role)) {
      result.chat = result.ui ? result.ui.map((face) => ({ ...face, src: [...face.src] })) : [];
      continue;
    }
    const raw = set[role];
    if (raw === undefined) {
      result[role] = [];
      continue;
    }
    if (!Array.isArray(raw)) return null;
    result[role] = raw.map(normalizeFace).filter(Boolean);
  }
  return result;
}

/** Replace a role face by its normalized family and weight, or append it when new. */
export function replaceFace(faces, face) {
  const replacement = normalizeFace(face);
  if (!replacement) return Array.isArray(faces) ? [...faces] : [];
  let replaced = false;
  const next = [];
  for (const existing of Array.isArray(faces) ? faces : []) {
    const normalized = normalizeFace(existing);
    if (normalized && normalized.family === replacement.family && normalized.weight === replacement.weight) {
      if (!replaced) next.push(replacement);
      replaced = true;
    } else {
      next.push(existing);
    }
  }
  if (!replaced) next.push(replacement);
  return next;
}

export function normalizePreset(preset, { allowBundled = false } = {}) {
  if (!preset || typeof preset !== "object" || Array.isArray(preset) || typeof preset.id !== "string") return null;
  const id = preset.id.trim();
  if (!id) return null;
  const ui = normalizeStack(preset.ui);
  const chat = preset.chat === undefined ? (ui ? [...ui] : null) : normalizeStack(preset.chat);
  const code = normalizeStack(preset.code);
  if (!ui || !chat || !code) return null;
  const faces = Array.isArray(preset.faces) ? preset.faces.map((face) => normalizeFace(face, { allowBundled })).filter(Boolean) : [];
  return { ...preset, id, ui, chat, code, faces };
}

export function migratePrefs(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.version !== undefined && value.version !== 1 && value.version !== PREFS_VERSION) return null;
  if (typeof value.selected !== "string" || !value.selected.trim()) return null;
  const customValue = value.custom;
  if (customValue === null) return { version: PREFS_VERSION, selected: value.selected, custom: null };
  if (!customValue || typeof customValue !== "object" || Array.isArray(customValue)) return null;
  const custom = normalizeCustomSet(customValue);
  if (!custom) return null;
  return { version: PREFS_VERSION, selected: value.selected, custom };
}
