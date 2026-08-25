// dsh-fonts-ja — browser half (client plugin bundle). GENERATED FILE:
// run `node scripts/gen-client.mjs` to regenerate from lib/client.tpl.js.
//
// Loaded by dsh-client-modules at /plugins/dsh-fonts-ja/client.js and executed
// through the vendored cordis Loader's lazy-CJS module table
// (window.__ModuleLoader__.load). The factory body is plain CJS with
// require() resolved against the shell's module table — the same shape the
// shipped ui-* packages' tsdown bundles emit.
window.__ModuleLoader__.load({
	id: "dsh-fonts-ja",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		let _primitives = require("@deepseek-ai/dsh-client-ui-primitives");

		//#region dsh-fonts: definitions
		/** The settings row's locale namespace. */
		const SETTINGS_NS = "settings.fonts";
		/** localStorage key holding the font preferences. */
		const STORAGE_KEY = "dsh-fonts:prefs";
		/** Sentinel id meaning "no custom font — the shipped system stacks". */
		const DEFAULT_ID = "system";
		/** Active id used while a user-imported custom set is applied. */
		const CUSTOM_ID = "custom";
		/** Host route the bundled webfonts are served from. */
		const FONT_URL = "/plugins/dsh-fonts/fonts/";
		/** Element id of the injected override sheet. */
		const STYLE_ID = "dsh-fonts-style";

		const PREFS_VERSION = 2;
const FONT_ROLES = ["ui", "chat", "code"];
const MARKDOWN_TEXT_TOKENS = [
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

function validateWoff2Url(value) {
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

function serializeFamily(families) {
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

function buildFontCss(config = {}, { allowBundled = false } = {}) {
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

function normalizeFace(face, { allowBundled = false } = {}) {
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

function normalizeCustomSet(set) {
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
function replaceFace(faces, face) {
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

function normalizePreset(preset, { allowBundled = false } = {}) {
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

function migratePrefs(value) {
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


		/**
		 * The bundled font presets, generated from data/presets.json. Each entry
		 * is { id, ui, code, faces } where ui/code are --dsw-font-family /
		 * --ds-font-family-code stacks and faces declare the @font-face rules
		 * (file names resolve against FONT_URL).
		 */
		const PRESETS = [
  {
    "id": "system",
    "ui": [
      "Yu Gothic UI",
      "Yu Gothic",
      "Hiragino Sans",
      "Hiragino Kaku Gothic ProN",
      "Noto Sans JP",
      "Meiryo",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "PingFang SC",
      "Hiragino Sans GB",
      "Microsoft YaHei",
      "Helvetica Neue",
      "Helvetica",
      "Arial",
      "sans-serif"
    ],
    "code": [
      "UDEV Gothic 35NF",
      "Noto Sans Mono CJK JP",
      "SF Mono",
      "JetBrains Mono",
      "Fira Code",
      "Consolas",
      "Liberation Mono",
      "Menlo",
      "Courier",
      "PingFang SC",
      "Microsoft YaHei"
    ],
    "faces": [],
    "chat": [
      "Yu Gothic UI",
      "Yu Gothic",
      "Hiragino Sans",
      "Hiragino Kaku Gothic ProN",
      "Noto Sans JP",
      "Meiryo",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "PingFang SC",
      "Hiragino Sans GB",
      "Microsoft YaHei",
      "Helvetica Neue",
      "Helvetica",
      "Arial",
      "sans-serif"
    ]
  },
  {
    "id": "jetbrains-inter",
    "ui": [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "PingFang SC",
      "Hiragino Sans GB",
      "Microsoft YaHei",
      "sans-serif"
    ],
    "code": [
      "JetBrains Mono",
      "SF Mono",
      "Consolas",
      "PingFang SC",
      "Microsoft YaHei",
      "monospace"
    ],
    "faces": [
      {
        "family": "Inter",
        "weight": "400",
        "display": "swap",
        "file": "inter-latin-400-normal.woff2"
      },
      {
        "family": "Inter",
        "weight": "600",
        "display": "swap",
        "file": "inter-latin-600-normal.woff2"
      },
      {
        "family": "Inter",
        "weight": "700",
        "display": "swap",
        "file": "inter-latin-700-normal.woff2"
      },
      {
        "family": "JetBrains Mono",
        "weight": "400",
        "display": "swap",
        "file": "jetbrains-mono-latin-400-normal.woff2"
      },
      {
        "family": "JetBrains Mono",
        "weight": "700",
        "display": "swap",
        "file": "jetbrains-mono-latin-700-normal.woff2"
      }
    ],
    "chat": [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "PingFang SC",
      "Hiragino Sans GB",
      "Microsoft YaHei",
      "sans-serif"
    ]
  },
  {
    "id": "fira-plex",
    "ui": [
      "IBM Plex Sans",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "PingFang SC",
      "Hiragino Sans GB",
      "Microsoft YaHei",
      "sans-serif"
    ],
    "code": [
      "Fira Code",
      "SF Mono",
      "Consolas",
      "PingFang SC",
      "Microsoft YaHei",
      "monospace"
    ],
    "faces": [
      {
        "family": "IBM Plex Sans",
        "weight": "400",
        "display": "swap",
        "file": "ibm-plex-sans-latin-400-normal.woff2"
      },
      {
        "family": "IBM Plex Sans",
        "weight": "600",
        "display": "swap",
        "file": "ibm-plex-sans-latin-600-normal.woff2"
      },
      {
        "family": "IBM Plex Sans",
        "weight": "700",
        "display": "swap",
        "file": "ibm-plex-sans-latin-700-normal.woff2"
      },
      {
        "family": "Fira Code",
        "weight": "400",
        "display": "swap",
        "file": "fira-code-latin-400-normal.woff2"
      },
      {
        "family": "Fira Code",
        "weight": "700",
        "display": "swap",
        "file": "fira-code-latin-700-normal.woff2"
      }
    ],
    "chat": [
      "IBM Plex Sans",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "PingFang SC",
      "Hiragino Sans GB",
      "Microsoft YaHei",
      "sans-serif"
    ]
  },
  {
    "id": "cascadia",
    "ui": [
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "PingFang SC",
      "Hiragino Sans GB",
      "Microsoft YaHei",
      "sans-serif"
    ],
    "code": [
      "Cascadia Code",
      "SF Mono",
      "Consolas",
      "PingFang SC",
      "Microsoft YaHei",
      "monospace"
    ],
    "faces": [
      {
        "family": "Cascadia Code",
        "weight": "400",
        "display": "swap",
        "file": "cascadia-code-latin-400-normal.woff2"
      },
      {
        "family": "Cascadia Code",
        "weight": "700",
        "display": "swap",
        "file": "cascadia-code-latin-700-normal.woff2"
      }
    ],
    "chat": [
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "PingFang SC",
      "Hiragino Sans GB",
      "Microsoft YaHei",
      "sans-serif"
    ]
  },
  {
    "id": "japanese-gothic",
    "ui": [
      "Noto Sans JP",
      "Yu Gothic UI",
      "Yu Gothic",
      "Hiragino Sans",
      "Hiragino Kaku Gothic ProN",
      "Meiryo",
      "sans-serif"
    ],
    "chat": [
      "Noto Sans JP",
      "Yu Gothic UI",
      "Yu Gothic",
      "Hiragino Sans",
      "Hiragino Kaku Gothic ProN",
      "Meiryo",
      "sans-serif"
    ],
    "code": [
      "UDEV Gothic 35NF",
      "Noto Sans Mono CJK JP",
      "Cascadia Mono",
      "Consolas",
      "monospace"
    ],
    "faces": [
      {
        "family": "Noto Sans JP",
        "weight": "400",
        "display": "swap",
        "file": "noto-sans-jp-400-normal.woff2"
      }
    ]
  },
  {
    "id": "japanese-mincho-chat",
    "ui": [
      "Yu Gothic UI",
      "Yu Gothic",
      "Hiragino Sans",
      "Hiragino Kaku Gothic ProN",
      "Noto Sans JP",
      "Meiryo",
      "sans-serif"
    ],
    "chat": [
      "Yu Mincho",
      "YuMincho",
      "Hiragino Mincho ProN",
      "Noto Serif JP",
      "BIZ UDPMincho",
      "MS PMincho",
      "serif"
    ],
    "code": [
      "UDEV Gothic 35NF",
      "Noto Sans Mono CJK JP",
      "Cascadia Mono",
      "Consolas",
      "monospace"
    ],
    "faces": [
      {
        "family": "Noto Sans JP",
        "weight": "400",
        "display": "swap",
        "file": "noto-sans-jp-400-normal.woff2"
      }
    ]
  }
];

		/** The system preset doubles as the fallback tail for custom sets. */
		const SYSTEM = PRESETS.find((preset) => preset.id === DEFAULT_ID);

		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"font.title": "字体",
			"font.default": "默认",
			"font.jetbrains-inter": "JetBrains Mono + Inter",
			"font.fira-plex": "Fira Code + IBM Plex Sans",
			"font.cascadia": "Cascadia Code",
			"font.japanese-gothic": "日文字体（黑体）",
			"font.japanese-mincho-chat": "日文字体（明朝正文）",
			"font.custom": "自定义",
			"font.custom.ui": "界面字体",
			"font.custom.chat": "聊天字体",
			"font.custom.code": "代码字体",
			"font.custom.empty": "尚未导入自定义字体",
			"font.custom.source": "来源",
			"font.custom.source.local": "已安装字体",
			"font.custom.source.woff2": "远程 WOFF2",
			"font.custom.localHint": "命名的本地字体必须已安装在此设备上",
			"font.custom.family": "字体名",
			"font.custom.url": "woff2 链接",
			"font.custom.weight": "字重",
			"font.custom.add": "添加",
			"font.custom.remove": "移除",
			"font.custom.invalid.family": "请输入字体名",
			"font.custom.invalid.url": "请输入有效的 http(s) WOFF2 链接",
			"font.custom.invalid.weight": "请选择字重",
			"font.preview.ui": "界面",
			"font.preview.chat": "聊天",
			"font.preview.code": "代码",
			"font.weightHint": "字重 = 字体文件本身的粗细档位。下载页面通常会标注（Regular=400、Bold=700），请选择与文件一致的那档；选错不报错，只是加粗效果会由浏览器模拟",
			"font.weight.400": "400 常规",
			"font.weight.500": "500 中等",
			"font.weight.600": "600 半粗",
			"font.weight.700": "700 粗体"
		};

		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"font.title": "Font",
			"font.default": "Default",
			"font.jetbrains-inter": "JetBrains Mono + Inter",
			"font.fira-plex": "Fira Code + IBM Plex Sans",
			"font.cascadia": "Cascadia Code",
			"font.japanese-gothic": "Japanese Gothic",
			"font.japanese-mincho-chat": "Japanese Mincho chat",
			"font.custom": "Custom",
			"font.custom.ui": "UI font",
			"font.custom.chat": "Chat font",
			"font.custom.code": "Code font",
			"font.custom.empty": "No custom fonts imported",
			"font.custom.source": "Source",
			"font.custom.source.local": "Installed family",
			"font.custom.source.woff2": "Remote WOFF2",
			"font.custom.localHint": "The named local font must already be installed on this device",
			"font.custom.family": "Family",
			"font.custom.url": "woff2 URL",
			"font.custom.weight": "Weight",
			"font.custom.add": "Add",
			"font.custom.remove": "Remove",
			"font.custom.invalid.family": "Enter a family name",
			"font.custom.invalid.url": "Enter a valid http(s) WOFF2 URL",
			"font.custom.invalid.weight": "Choose a weight",
			"font.preview.ui": "UI",
			"font.preview.chat": "Chat",
			"font.preview.code": "Code",
			"font.weightHint": "Weight = the grade your font file itself is. Download pages usually label it (Regular=400, Bold=700) — pick the matching grade; a wrong pick won't break anything, the browser just fakes the bold effect",
			"font.weight.400": "400 Regular",
			"font.weight.500": "500 Medium",
			"font.weight.600": "600 Semibold",
			"font.weight.700": "700 Bold"
		};

		/** Japanese dictionary, kept in lockstep with the host-owned locale set. */
		const ja = {
			"font.title": "フォント",
			"font.default": "デフォルト",
			"font.jetbrains-inter": "JetBrains Mono + Inter",
			"font.fira-plex": "Fira Code + IBM Plex Sans",
			"font.cascadia": "Cascadia Code",
			"font.japanese-gothic": "日本語ゴシック",
			"font.japanese-mincho-chat": "日本語明朝（チャット）",
			"font.custom": "カスタム",
			"font.custom.ui": "UIフォント",
			"font.custom.chat": "チャットフォント",
			"font.custom.code": "コードフォント",
			"font.custom.empty": "カスタムフォントはまだ追加されていません",
			"font.custom.source": "ソース",
			"font.custom.source.local": "インストール済みフォント",
			"font.custom.source.woff2": "リモート WOFF2",
			"font.custom.localHint": "指定したローカルフォントは、この端末にインストールされている必要があります",
			"font.custom.family": "フォント名",
			"font.custom.url": "woff2 URL",
			"font.custom.weight": "ウェイト",
			"font.custom.add": "追加",
			"font.custom.remove": "削除",
			"font.custom.invalid.family": "フォント名を入力してください",
			"font.custom.invalid.url": "有効な http(s) WOFF2 URL を入力してください",
			"font.custom.invalid.weight": "ウェイトを選択してください",
			"font.preview.ui": "UI",
			"font.preview.chat": "チャット",
			"font.preview.code": "コード",
			"font.weightHint": "ウェイトはフォントファイル自体の太さです。配布ページでは Regular=400、Bold=700 のように表記されることが多いため、ファイルに合う値を選んでください。値が違ってもエラーにはなりませんが、太字はブラウザによる疑似表示になります",
			"font.weight.400": "400 標準",
			"font.weight.500": "500 ミディアム",
			"font.weight.600": "600 セミボールド",
			"font.weight.700": "700 ボールド"
		};

		function assertDictionaryKeyParity(...dictionaries) {
			const expected = Object.keys(dictionaries[0] ?? {}).sort();
			for (const dictionary of dictionaries.slice(1)) {
				const actual = Object.keys(dictionary ?? {}).sort();
				if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
					throw new Error("font settings locale dictionaries must expose identical keys");
				}
			}
		}
		assertDictionaryKeyParity(zh, en, ja);
		//#endregion

		//#region dsh-fonts: persistence
		/** Read a localStorage string value (null on absence or error). */
		function readStorage(key) {
			try {
				const value = window.localStorage.getItem(key);
				return typeof value === "string" ? value : null;
			} catch {
				return null;
			}
		}

		/** Write (or remove with null) a localStorage value. */
		function writeStorage(key, value) {
			try {
				if (value === null) window.localStorage.removeItem(key);
				else window.localStorage.setItem(key, value);
			} catch {
				// storage unavailable / quota — the preference stays process-local
			}
		}

		/** Saved font prefs { version, selected, custom } or null. */
		function readPrefs() {
			const raw = readStorage(STORAGE_KEY);
			if (raw === null) return null;
			try {
				const parsed = JSON.parse(raw);
				if (typeof parsed !== "object" || parsed === null) return null;
				return migratePrefs(parsed);
			} catch {
				return null;
			}
		}

		/** Persist the active selection and the custom set. */
		function writePrefs(prefs) {
			writeStorage(STORAGE_KEY, JSON.stringify({
				version: PREFS_VERSION,
				selected: prefs.selected,
				custom: prefs.custom
			}));
		}
		//#endregion

		//#region dsh-fonts: registry
		/**
		 * The font registry — the plugin's public interface, provided to the
		 * root context as `ctx.fonts` (consumers: ctx.get("fonts")). Bundled
		 * presets come from PRESETS; other plugins register their own presets
		 * with register(); users import custom faces through selectCustom().
		 */
		function createRegistry() {
			const bundled = new Map(PRESETS.map((preset) => {
				const normalized = normalizePreset({
					...preset,
					faces: preset.faces.map((face) => ({
						family: face.family,
						weight: face.weight,
						display: face.display,
						src: [FONT_URL + face.file]
					}))
				}, { allowBundled: true });
				if (!normalized) throw new Error(`invalid bundled font preset: ${preset.id}`);
				return [normalized.id, normalized];
			}));
			const registered = new Map();
			const listeners = new Set();
			let custom = null;
			let activeId = DEFAULT_ID;
			let revision = 0;
			let pendingId = null;
			let ownedStyle = null;

			const allPresets = () => [...bundled.values(), ...registered.values()];

			const notify = () => {
				revision += 1;
				const snapshot = getSnapshot();
				for (const listener of listeners) listener(snapshot);
			};

			function removeOwnedStyle() {
				ownedStyle?.remove();
				ownedStyle = null;
			}

			function writeStyle(css) {
				if (!ownedStyle || !ownedStyle.isConnected) {
					ownedStyle = document.createElement("style");
					ownedStyle.id = STYLE_ID;
					ownedStyle.dataset.dshFontsOwner = "true";
					document.head.appendChild(ownedStyle);
				}
				ownedStyle.textContent = css;
			}

			function stableDedupeFaces(faces) {
				const seen = new Set();
				return faces.filter((face) => {
					const key = JSON.stringify([face.family, face.src, face.weight, face.display]);
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				});
			}

			/** Rewrite the injected sheet to match the active selection. */
			function applyStyle() {
				if (activeId === DEFAULT_ID) {
					removeOwnedStyle();
					return;
				}
				let config;
				let allowBundled = false;
				if (activeId === CUSTOM_ID && custom) {
					config = {
						ui: [...custom.ui.map((face) => face.family), ...SYSTEM.ui],
						chat: [...custom.chat.map((face) => face.family), ...SYSTEM.chat],
						code: [...custom.code.map((face) => face.family), ...SYSTEM.code],
						faces: stableDedupeFaces([...custom.ui, ...custom.chat, ...custom.code])
					};
				} else {
					const preset = allPresets().find((candidate) => candidate.id === activeId);
					if (!preset) {
						removeOwnedStyle();
						return;
					}
					config = preset;
					allowBundled = bundled.has(activeId);
				}
				writeStyle(buildFontCss(config, { allowBundled }));
			}

			function persist() {
				writePrefs({ version: PREFS_VERSION, selected: activeId, custom });
			}

			/** One immutable snapshot published on every change. */
			function getSnapshot() {
				return {
					activeId,
					custom,
					presets: allPresets(),
					revision
				};
			}

			/** Register a plugin-provided preset; returns its disposer. */
			function register(preset) {
				const normalized = normalizePreset(preset);
				if (!normalized) throw new Error("font preset needs an id plus ui, chat, and code stacks");
				registered.set(normalized.id, normalized);
				if (pendingId === normalized.id) {
					pendingId = null;
					activeId = normalized.id;
					applyStyle();
					notify();
				} else {
					notify();
				}
				return () => unregister(normalized.id);
			}

			function unregister(id) {
				registered.delete(id);
				if (activeId === id) {
					activeId = DEFAULT_ID;
					applyStyle();
					persist();
					notify();
				}
				else notify();
			}

			/** Select a preset id ("system" and "custom" are built-in ids). */
			function select(id) {
				const exists = id === DEFAULT_ID || id === CUSTOM_ID || allPresets().some((preset) => preset.id === id);
				if (!exists) throw new Error(`unknown font preset: ${id}`);
				if (id === DEFAULT_ID) custom = null;
				activeId = id;
				applyStyle();
				persist();
				notify();
			}

			/** Apply a user-imported custom set (empty lists clear it). */
			function selectCustomSet(set) {
				const next = normalizeCustomSet(set);
				if (!next) throw new Error("invalid custom font set");
				if (next.ui.length === 0 && next.chat.length === 0 && next.code.length === 0) {
					clearCustom();
					return;
				}
				custom = next;
				activeId = CUSTOM_ID;
				applyStyle();
				persist();
				notify();
			}

			/** @deprecated Use selectCustomSet. Chat will use the UI stack. */
			function selectCustom(ui, code) {
				this.selectCustomSet({ ui, chat: ui, code });
			}

			function clearCustom() {
				custom = null;
				select(DEFAULT_ID);
			}

			function subscribe(listener) {
				listeners.add(listener);
				return () => listeners.delete(listener);
			}

			/**
			 * Restore persisted prefs. A selected preset that is not registered
			 * yet (a plugin preset loading after us) is remembered and applied
			 * when that preset registers.
			 */
			function restore(prefs) {
				custom = prefs?.custom && (prefs.custom.ui?.length || prefs.custom.chat?.length || prefs.custom.code?.length)
					? prefs.custom
					: null;
				const selected = prefs?.selected;
				if (!selected || selected === DEFAULT_ID) {
					activeId = DEFAULT_ID;
					applyStyle();
					return;
				}
				if (selected === CUSTOM_ID) {
					activeId = custom ? CUSTOM_ID : DEFAULT_ID;
					applyStyle();
					return;
				}
				if (allPresets().some((preset) => preset.id === selected)) activeId = selected;
				else pendingId = selected;
				applyStyle();
			}

			/** Plugin unload: drop the override sheet and listeners. */
			function dispose() {
				removeOwnedStyle();
				listeners.clear();
			}

			return {
				register,
				unregister,
				select,
				selectCustomSet,
				selectCustom,
				clearCustom,
				getSnapshot,
				subscribe,
				restore,
				dispose
			};
		}
		//#endregion

		//#region dsh-fonts: settings row store
		/**
		 * Font row slot store: a mirror of the registry snapshot. The registry
		 * subscription is the only writer; the row component reads via
		 * props.useStore.
		 */
		function createFontStore() {
			return (0, _runtime_client.defineStore)({
				init: () => ({
					activeId: DEFAULT_ID,
					customCount: 0,
					revision: -1
				}),
				actions: {
					sync: (d, snapshot) => {
						if (snapshot.revision <= d.revision) return;
						d.activeId = snapshot.activeId;
						d.customCount = (snapshot.custom?.ui.length ?? 0) + (snapshot.custom?.chat.length ?? 0) + (snapshot.custom?.code.length ?? 0);
						d.revision = snapshot.revision;
					}
				}
			});
		}
		//#endregion

		//#region dsh-fonts: settings row
		/** Inline style sheet for the row (kept dependency-free). */
		const styles = {
			group: {
				borderBottom: "1px solid var(--dsw-alias-border-l2)",
				display: "flex",
				flexDirection: "column",
				gap: "10px",
				padding: "16px 0"
			},
			title: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "14px",
				fontWeight: 400,
				lineHeight: "22px"
			},
			grid: {
				display: "flex",
				flexWrap: "wrap",
				gap: "10px"
			},
			card: {
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "6px",
				flex: "1 1 108px",
				minWidth: 0,
				padding: "3px",
				borderRadius: "10px",
				// longhand on purpose: the shorthand leaves borderColor to
				// fall back to currentColor once React clears the selected
				// override, painting stale black/white boxes on deselect
				borderWidth: "2px",
				borderStyle: "solid",
				borderColor: "transparent",
				background: "transparent",
				cursor: "pointer",
				font: "inherit",
				boxSizing: "border-box"
			},
			cardSelected: {
				borderColor: "var(--dsw-alias-brand-primary)",
				background: "var(--dsw-alias-interactive-bg-hover)"
			},
			cardLabel: {
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "12px",
				lineHeight: "16px",
				textAlign: "center",
				overflow: "hidden",
				maxWidth: "100%"
			},
			cardLabelSelected: {
				color: "var(--dsw-alias-label-primary)"
			},
			swatch: {
				width: "100%",
				minHeight: "82px",
				borderRadius: "8px",
				boxSizing: "border-box",
				padding: "8px 10px",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				gap: "4px",
				border: "1px solid var(--dsw-alias-border-l2)",
				overflow: "hidden"
			},
			previewRow: {
				display: "flex",
				alignItems: "baseline",
				gap: "6px",
				minWidth: 0
			},
			previewLabel: {
				flex: "0 0 42px",
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "12px",
				lineHeight: "15px",
				textAlign: "left",
				whiteSpace: "nowrap"
			},
			previewSample: {
				minWidth: 0,
				color: "var(--dsw-alias-label-primary)",
				fontSize: "13px",
				lineHeight: "17px",
				overflowWrap: "anywhere",
				whiteSpace: "normal"
			},
			sourceModes: {
				display: "flex",
				gap: "4px"
			},
			editor: {
				display: "flex",
				flexDirection: "column",
				gap: "10px"
			},
			editorSection: {
				display: "flex",
				flexDirection: "column",
				gap: "6px"
			},
			editorSectionTitle: {
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "12px",
				lineHeight: "16px"
			},
			editorEntry: {
				display: "flex",
				alignItems: "center",
				gap: "8px",
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "12px",
				lineHeight: "16px"
			},
			editorEntryName: {
				flex: "auto",
				minWidth: 0,
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap"
			},
			editorForm: {
				display: "flex",
				alignItems: "center",
				gap: "8px",
				flexWrap: "wrap"
			},
			inputFamily: {
				width: "150px"
			},
			inputUrl: {
				flex: "1 1 220px"
			},
			weightSelector: {
				display: "flex",
				alignItems: "center",
				gap: "4px",
				boxSizing: "border-box",
				height: "28px",
				padding: "0 8px",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "transparent",
				color: "var(--dsw-alias-label-primary)",
				fontSize: "12px",
				lineHeight: "16px",
				cursor: "pointer"
			},
			sourceMode: {
				boxSizing: "border-box",
				height: "28px",
				padding: "0 8px",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "transparent",
				color: "var(--dsw-alias-label-primary)",
				fontSize: "12px",
				lineHeight: "16px",
				cursor: "pointer"
			},
			sourceModeSelected: {
				borderColor: "var(--dsw-alias-brand-primary)",
				background: "var(--dsw-alias-interactive-bg-hover)"
			},
			hint: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "16px"
			},
			error: {
				color: "var(--dsw-alias-state-error-primary)",
				fontSize: "12px",
				lineHeight: "16px"
			}
		};

		/**
		 * Stable DOM hooks: data-font-role="ui", data-font-role="chat",
		 * data-font-role="code", data-font-source="local", and
		 * data-font-source="woff2". Presentational-only Japanese-capable samples
		 * are rendered in their role stacks.
		 */
		function FontPreview({ uiStack, chatStack, codeStack, t }) {
			const rows = [
				{ role: "ui", label: t("font.preview.ui"), value: "設定 Settings 123", stack: uiStack },
				{ role: "chat", label: t("font.preview.chat"), value: "日本語の文章を読みやすく表示します。Markdown **太字** 123", stack: chatStack },
				{ role: "code", label: t("font.preview.code"), value: 'const 日本語 = "font";', stack: codeStack }
			];
			return (0, react_jsx_runtime.jsx)("div", {
				style: styles.swatch,
				children: rows.map((row) => (0, react_jsx_runtime.jsxs)("div", {
					"data-font-role": row.role,
					style: styles.previewRow,
					children: [
						(0, react_jsx_runtime.jsx)("span", { style: styles.previewLabel, children: row.label }),
						(0, react_jsx_runtime.jsx)("span", {
							style: { ...styles.previewSample, fontFamily: row.stack },
							children: row.value
						})
					]
				}, row.role))
			});
		}

		/** One selectable font card. */
		function FontCard({ id, uiStack, chatStack, codeStack, label, selected, onSelect, t }) {
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: (event) => {
					onSelect();
					// drop focus so a stale focus ring never outlives the selection
					event.currentTarget.blur();
				},
				"aria-pressed": selected,
				style: {
					...styles.card,
					...(selected ? styles.cardSelected : {})
				},
				children: [
					(0, react_jsx_runtime.jsx)(FontPreview, { uiStack, chatStack, codeStack, t }),
					(0, react_jsx_runtime.jsx)("span", {
						style: {
							...styles.cardLabel,
							...(selected ? styles.cardLabelSelected : {})
						},
						children: label
					})
				]
			});
		}

		/** One custom-font editor section (kind: "ui" | "chat" | "code"). */
		function CustomSection({ title, kind, faces, allFaces, registry, t }) {
			const [family, setFamily] = react.useState("");
			const [url, setUrl] = react.useState("");
			const [weight, setWeight] = react.useState("");
			const [source, setSource] = react.useState("local");
			const [weightOpen, setWeightOpen] = react.useState(false);
			const [error, setError] = react.useState(null);
			const weightOptions = ["400", "500", "600", "700"];

			const applyRoleFaces = (next) => registry.selectCustomSet({
				ui: kind === "ui" ? next : [...(allFaces.ui ?? [])],
				chat: kind === "chat" ? next : [...(allFaces.chat ?? [])],
				code: kind === "code" ? next : [...(allFaces.code ?? [])]
			});

			const submit = () => {
				const trimmedFamily = family.trim();
				const trimmedUrl = url.trim();
				if (!trimmedFamily) {
					setError("font.custom.invalid.family");
					return;
				}
				if (source === "woff2" && !validateWoff2Url(trimmedUrl)) {
					setError("font.custom.invalid.url");
					return;
				}
				if (source === "woff2" && !weightOptions.includes(weight)) {
					setError("font.custom.invalid.weight");
					return;
				}
				setError(null);
				setFamily("");
				setUrl("");
				const entry = source === "local"
					? { family: trimmedFamily, src: [] }
					: { family: trimmedFamily, src: [trimmedUrl], weight, display: "swap" };
				applyRoleFaces(replaceFace(faces, entry));
			};

			const remove = (entry) => {
				const next = faces.filter((face) => face !== entry);
				applyRoleFaces(next);
			};

			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.editorSection,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.editorSectionTitle,
						children: title
					}),
					faces.length === 0
						? (0, react_jsx_runtime.jsx)("div", {
								style: styles.hint,
								children: t("font.custom.empty")
							})
						: faces.map((face) => (0, react_jsx_runtime.jsxs)("div", {
								style: styles.editorEntry,
								children: [
									(0, react_jsx_runtime.jsx)("span", {
										style: styles.editorEntryName,
										children: face.src.length === 0
											? `${face.family} — ${t("font.custom.source.local")}`
											: `${face.family} (${t(`font.weight.${face.weight}`)}) — ${face.src[0]}`
									}),
									(0, react_jsx_runtime.jsx)(_primitives.Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => remove(face),
										style: { color: "var(--dsw-alias-state-error-primary)" },
										children: t("font.custom.remove")
									})
								]
							}, face.family + face.weight + (face.src[0] ?? ""))),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.editorForm,
						children: [
							(0, react_jsx_runtime.jsxs)("div", {
								style: styles.sourceModes,
								"aria-label": t("font.custom.source"),
								children: [
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										"data-font-source": "local",
										"aria-pressed": source === "local",
										style: { ...styles.sourceMode, ...(source === "local" ? styles.sourceModeSelected : {}) },
										onClick: () => {
											setSource("local");
											setError(null);
										},
										children: t("font.custom.source.local")
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										"data-font-source": "woff2",
										"aria-pressed": source === "woff2",
										style: { ...styles.sourceMode, ...(source === "woff2" ? styles.sourceModeSelected : {}) },
										onClick: () => {
											setSource("woff2");
											setError(null);
										},
										children: t("font.custom.source.woff2")
									})
								]
							}),
							(0, react_jsx_runtime.jsx)(_primitives.Input, {
								value: family,
								onChange: (event) => {
									setFamily(event.target.value);
									setError(null);
								},
								placeholder: t("font.custom.family"),
								style: styles.inputFamily
							}),
							source === "local"
								? (0, react_jsx_runtime.jsx)("div", { style: styles.hint, children: t("font.custom.localHint") })
								: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
									children: [
										(0, react_jsx_runtime.jsx)(_primitives.Input, {
											value: url,
											onChange: (event) => {
												setUrl(event.target.value);
												setError(null);
											},
											placeholder: t("font.custom.url"),
											style: styles.inputUrl
										}),
										(0, react_jsx_runtime.jsx)(_primitives.Menu, {
											open: weightOpen,
											onClose: () => setWeightOpen(false),
											items: weightOptions.map((id) => ({ id, label: t(`font.weight.${id}`) })),
											selectedId: weight,
											onSelect: (id) => {
												setWeight(id);
												setWeightOpen(false);
												setError(null);
											},
											align: "start",
											portal: true,
											compact: true,
											dense: true,
											anchor: (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												style: styles.weightSelector,
												"aria-haspopup": "menu",
												"aria-expanded": weightOpen,
												onClick: () => setWeightOpen((v) => !v),
												children: [
													t(weight ? `font.weight.${weight}` : "font.custom.weight"),
													(0, react_jsx_runtime.jsx)(_primitives.IconChevronDownOutline14, { size: 14 })
												]
											})
										}),
									]
								}),
							(0, react_jsx_runtime.jsx)(_primitives.Button, {
								variant: "outline",
								size: "sm",
								onClick: () => submit(),
								children: t("font.custom.add")
							})
						]
					}),
					error
						? (0, react_jsx_runtime.jsx)("div", {
								style: styles.error,
								children: t(error)
							})
						: null
				]
			});
		}

		/** One custom-face editor section wired to the registry. */
		function CustomEditor({ registry, custom, t }) {
			const allFaces = custom ?? { ui: [], chat: [], code: [] };
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.editor,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						"data-font-role": "ui",
						children: (0, react_jsx_runtime.jsx)(CustomSection, {
							title: t("font.custom.ui"), kind: "ui", faces: allFaces.ui, allFaces, registry, t
						})
					}),
					(0, react_jsx_runtime.jsx)("div", {
						"data-font-role": "chat",
						children: (0, react_jsx_runtime.jsx)(CustomSection, {
							title: t("font.custom.chat"), kind: "chat", faces: allFaces.chat, allFaces, registry, t
						})
					}),
					(0, react_jsx_runtime.jsx)("div", {
						"data-font-role": "code",
						children: (0, react_jsx_runtime.jsx)(CustomSection, {
							title: t("font.custom.code"), kind: "code", faces: allFaces.code, allFaces, registry, t
						})
					})
				]
			});
		}

		/**
		 * Font picker row registered into the Settings → General item slot,
		 * before the Appearance/theme rows: a Default chip, one card per
		 * preset, a Custom card once custom faces exist, and the import
		 * editor.
		 */
		function FontRow({ t, useStore, registry }) {
			const activeId = useStore((state) => state.activeId);
			const customCount = useStore((state) => state.customCount);
			const snapshot = registry.getSnapshot();
			const custom = snapshot.custom;
			const defaultPreset = normalizePreset(SYSTEM);
			const bundled = PRESETS
				.map((preset) => normalizePreset(preset))
				.filter((preset) => preset && preset.id !== DEFAULT_ID);
			const customPreset = custom
				? normalizePreset({
						id: CUSTOM_ID,
						ui: [...custom.ui.map((face) => face.family), ...SYSTEM.ui],
						chat: [...custom.chat.map((face) => face.family), ...SYSTEM.chat],
						code: [...custom.code.map((face) => face.family), ...SYSTEM.code],
						faces: []
					})
				: null;
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.group,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.title,
						children: t("font.title")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.grid,
						children: [
							(0, react_jsx_runtime.jsx)(FontCard, {
								id: DEFAULT_ID,
								uiStack: defaultPreset.ui.join(", "),
								chatStack: defaultPreset.chat.join(", "),
								codeStack: defaultPreset.code.join(", "),
								label: t("font.default"),
								selected: activeId === DEFAULT_ID,
								onSelect: () => registry.select(DEFAULT_ID),
								t
							}),
							bundled.map((preset) => (0, react_jsx_runtime.jsx)(FontCard, {
								id: preset.id,
								uiStack: preset.ui.join(", "),
								chatStack: preset.chat.join(", "),
								codeStack: preset.code.join(", "),
								label: t(`font.${preset.id}`),
								selected: activeId === preset.id,
								onSelect: () => registry.select(preset.id),
								t
							}, preset.id)),
							customCount > 0 && customPreset
								? (0, react_jsx_runtime.jsx)(FontCard, {
										id: CUSTOM_ID,
										uiStack: customPreset.ui.join(", "),
										chatStack: customPreset.chat.join(", "),
										codeStack: customPreset.code.join(", "),
										label: t("font.custom"),
										selected: activeId === CUSTOM_ID,
										onSelect: () => registry.select(CUSTOM_ID),
										t
									})
								: null
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.hint,
						children: t("font.weightHint")
					}),
					(0, react_jsx_runtime.jsx)(CustomEditor, { registry, custom, t })
				]
			});
		}
		//#endregion

		//#region dsh-fonts: client plugin body
		/**
		 * Required services: slots/locale (the settings row). Fonts are applied
		 * through an injected stylesheet, persistence is localStorage — no
		 * theme or settings transport is needed.
		 */
		const inject = [
			"slots",
			"locale"
		];

		/**
		 * Client plugin body: provide the font registry as `ctx.fonts`,
		 * restore the saved selection, keep the row's store in sync with the
		 * registry snapshot, and register the picker into Settings → General.
		 * @param ctx - client cordis context.
		 */
		function apply(ctx) {
			const registry = createRegistry();
			ctx.provide("fonts", registry);
			ctx.effect(() => () => {
				registry.dispose();
			}, "dsh-fonts: registry disposal");

			// Unlike themes, font CSS overrides never fight an async boot
			// adoption, so a plain restore at apply time is sufficient.
			registry.restore(readPrefs());

			const fontStore = createFontStore();
			let fontBound;
			const unsubscribe = registry.subscribe((snapshot) => {
				fontBound?.sync(snapshot);
			});
			ctx.effect(() => unsubscribe, "dsh-fonts: store subscription");

			ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
				zh,
				en,
				ja
			}), "dsh-fonts: settings row dictionaries");

			const fontInjected = (actions) => {
				fontBound = actions;
				fontBound.sync(registry.getSnapshot());
				return {
					registry
				};
			};
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "fonts",
				order: 18,
				store: fontStore,
				locale: SETTINGS_NS,
				inject: fontInjected
			}, FontRow));
		}
		//#endregion

		exports.SETTINGS_NS = SETTINGS_NS;
		exports.DEFAULT_ID = DEFAULT_ID;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
