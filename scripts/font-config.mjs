export const PREFS_VERSION = 2;
export const FONT_ROLES = ["ui", "chat", "code"];

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

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

export function normalizeFace(face) {
  if (!face || typeof face !== "object" || Array.isArray(face)) return null;
  const family = normalizeFamily(face.family);
  if (!family) return null;
  const hasSrc = Object.prototype.hasOwnProperty.call(face, "src");
  if (hasSrc && !Array.isArray(face.src)) return null;
  const src = hasSrc ? [...new Set(face.src.filter(validateWoff2Url))] : [];
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

export function normalizePreset(preset) {
  if (!preset || typeof preset !== "object" || Array.isArray(preset) || typeof preset.id !== "string") return null;
  const ui = normalizeStack(preset.ui);
  const chat = preset.chat === undefined ? (ui ? [...ui] : null) : normalizeStack(preset.chat);
  const code = normalizeStack(preset.code);
  if (!ui || !chat || !code) return null;
  const faces = Array.isArray(preset.faces) ? preset.faces.map(normalizeFace).filter(Boolean) : [];
  return { ...preset, id: preset.id.trim(), ui, chat, code, faces };
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
