import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

async function createRuntime() {
  let factory;
  const storage = new Map();
  const styles = [];
  const document = {
    head: {
      appendChild(style) {
        style.isConnected = true;
        styles.push(style);
      },
    },
    createElement() {
      return {
        dataset: {},
        isConnected: false,
        remove() {
          this.isConnected = false;
        },
      };
    },
  };
  const window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    __ModuleLoader__: {
      load(module) {
        factory = module.factory;
      },
    },
  };
  const context = vm.createContext({ window, document, URL, console });
  const client = await readFile("lib/client.js", "utf8");
  vm.runInContext(client.replace(
    "exports.SETTINGS_NS = SETTINGS_NS;",
    "globalThis.__createFontRegistryForTest = createRegistry;\n\t\texports.SETTINGS_NS = SETTINGS_NS;",
  ), context);
  factory(() => ({}));
  return {
    registry: context.__createFontRegistryForTest(),
    storage,
    styles,
  };
}

const CUSTOM_SET = {
  ui: [{ family: "Meiryo", src: [] }],
  chat: [{ family: "Yu Mincho", src: [] }],
  code: [{ family: "Consolas", src: [] }],
};

test("disposing an active normalized third-party preset falls back without clearing custom", async () => {
  const { registry, storage, styles } = await createRuntime();
  registry.selectCustomSet(CUSTOM_SET);
  const dispose = registry.register({
    id: " third-party ",
    ui: ["Third UI"],
    code: ["Third Code"],
    faces: [],
  });
  registry.select("third-party");
  dispose();

  assert.equal(registry.getSnapshot().activeId, "system");
  const custom = JSON.parse(JSON.stringify(registry.getSnapshot().custom));
  assert.deepEqual(custom, {
    ui: [{ family: "Meiryo", src: [], weight: "400", display: "swap" }],
    chat: [{ family: "Yu Mincho", src: [], weight: "400", display: "swap" }],
    code: [{ family: "Consolas", src: [], weight: "400", display: "swap" }],
  });
  assert.deepEqual(JSON.parse(storage.get("dsh-fonts:prefs")), {
    version: 2,
    selected: "system",
    custom,
  });
  assert.equal(styles.at(-1).isConnected, false);
});

test("registry rejects a whitespace-only third-party preset id", async () => {
  const { registry } = await createRuntime();
  assert.throws(
    () => registry.register({ id: "  ", ui: ["Inter"], code: ["Consolas"], faces: [] }),
    /needs an id/i,
  );
});
