# Final review fix report — 2026-08-25

## Scope completed

- `lib/client.tpl.js` now handles disposal of an active third-party preset as an
  internal fallback: it selects `system`, removes the owned style, persists the
  selection, and keeps the saved custom font set. The user-facing Default path
  still clears that set.
- Third-party preset disposers capture the normalized ID, and whitespace-only
  preset IDs are rejected during normalization.
- `scripts/font-config.mjs` limits relative bundled WOFF2 paths to explicit
  bundled conversion (`allowBundled: true`). Public custom sets and
  third-party presets accept HTTP(S) WOFF2 sources only.
- The custom editor now replaces an existing entry with the same normalized
  family and weight instead of appending a duplicate.
- Both READMEs now describe username/password URL-authority credentials,
  the actual `dsh-fonts-style` element and `--dsh-fonts-chat-family` variable,
  and that Japanese presets contain family names only, not Japanese binaries.
- `.tmp/` is ignored. The existing isolated acceptance profile was retained.

## Files changed

- `.gitignore`
- `README.md`, `README.en.md`
- `scripts/font-config.mjs`
- `lib/client.tpl.js`, regenerated `lib/client.js`
- `tests/font-config.test.mjs`
- `tests/client-runtime.test.mjs`

## Test evidence

Test-first regressions were added before the implementation. The focused red
run failed as expected: the generated registry remained on `third-party` after
disposing a normalized-ID preset, whitespace-only IDs were accepted, and the
new replacement helper was absent.

After the changes:

```text
node --test tests/font-config.test.mjs
15 pass, 0 fail

node --test tests/client-runtime.test.mjs
2 pass, 0 fail

npm run check
28 pass, 0 fail; generated client up to date; host and client syntax checks pass

git diff --check
exit 0
```

`tests/client-runtime.test.mjs` executes the generated client registry in a
minimal DOM/localStorage harness. It verifies the active third-party disposer
returns to `system`, preserves and persists the custom snapshot, removes the
owned style, and uses the normalized disposer ID.

## Unresolved concerns

None from this fix wave. The pre-existing `.tmp/dsh-fonts-acceptance` profile
is intentionally retained and is now ignored; this fix wave did not repeat
interactive browser acceptance.
