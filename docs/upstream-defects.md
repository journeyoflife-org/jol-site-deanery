# Upstream `@journeyoflife-org/*` Packaging Defects

**Discovered during:** Stage 0 remediation of `jol-site-deanery`
**Branch:** `fix/stage0-build-remediation`
**Date:** 2026-09-22
**Verified by:** Comparing published tarballs (installed in spoke `node_modules/`) against hub monorepo source at `jol-hub/frontend/packages/`.

---

## Defect 1 — `i18n@1.0.0`: `resolveLocale` + `LocalizedText` + `TODO_MARKER` absent from published dist

**Severity:** Build-breaking for any spoke that depends on the documented API.

**Evidence:**

| Location | `resolveLocale` | `LocalizedText` | `TODO_MARKER` |
|---|---|---|---|
| Hub source `src/index.ts` | exported | exported | exported |
| Hub local `dist/index.d.ts` | present | present | present |
| **Published** `dist/index.d.ts` (spoke `node_modules/`) | **ABSENT** | **ABSENT** | **ABSENT** |

**Root cause:** The `localized-text.ts` module was added to the i18n source *after* 1.0.0 was published. The hub's local `dist/` was rebuilt (it contains the new exports), but the package was never version-bumped and re-published.

**Impact:** `jol-site-deanery` commit `9ff2b97` imported `resolveLocale` from `@journeyoflife-org/i18n` and broke the build (8 TypeScript errors). Spoke worked around it with a local shim in `src/lib/resolve-locale.ts`.

**Fix:** `cd frontend/packages/i18n && pnpm build && npm version 1.1.0 && npm publish`

---

## Defect 2 — `ui@1.0.0`: `files` field omits `src/tokens/` — tailwind preset import broken

**Severity:** Build-breaking for any spoke that uses the `@journeyoflife-org/ui/tailwind` preset.

**Evidence:**

```
tailwind.config.ts line 4:  import { jolThemeExtension } from './src/tokens/tailwind';

package.json "files": ["dist", "src/styles", "tailwind.config.ts"]
                                      ↑ src/tokens/ NOT included
```

Hub source has `src/tokens/tailwind.ts` (and 8 other token files), but the published tarball does not include the `src/tokens/` directory. The `tailwind.config.ts` is shipped but its dependency is not.

**Impact:** `jol-site-deanery` could not consume the platform Tailwind preset. Worked around by manually mapping CSS custom properties in the spoke's own `tailwind.config.ts` (commit `5014334`).

**Fix:** Change `files` to `["dist", "src/styles", "src/tokens", "tailwind.config.ts"]`

---

## Defect 3 — `seo`: version skew between hub source and published registry

**Severity:** Process defect — makes it impossible to know which source commit produced the published package.

**Evidence:**

| Location | Version |
|---|---|
| Hub source `packages/seo/package.json` | `1.0.0` |
| Published registry (spoke lockfile) | `1.1.0` |

The seo@1.1.0 tarball exists on `npm.pkg.github.com` and is installed in the spoke, but the hub source still declares `1.0.0`. Either the version was bumped temporarily for publish and reverted, or the source was not committed after the bump.

**Impact:** Cannot trace which source commit produced seo@1.1.0. Future publishes risk collision or confusion.

**Fix:** Bump hub source to `"version": "1.1.0"` and commit. Going forward, use `npm version` (not manual edits) to ensure the version is always in sync.

---

## Defect 4 — `seo@1.1.0`: `ChurchEntityInput.address` required but undocumented

**Severity:** Usability defect — consumers cannot determine from the type alone whether/how to provide an address.

**Evidence:**

```typescript
interface ChurchEntityInput {
    kind: ChurchKind;
    name: string;
    url: string;
    address: PostalAddressInput;    // ← required, no JSDoc
    geo?: { ... };                  // ← has JSDoc explaining when required
    // ...
}
```

The `address` field is the only required field without a JSDoc comment. The `geo` field below it has a comment explaining "Required for basilica/cathedral/parish/orthodox (strategy rows 3/4/7/9)." but `address` has nothing.

**Impact:** `jol-site-deanery` has an address in the fixture but it was unverified. The spoke chose NOT to emit `churchEntity()` because structured data must describe verified content — but the type gives no guidance on what to do when the address is not yet available.

**Fix:** Add JSDoc: `/** Postal address for schema.org LocalBusiness/Place. Required for all kinds — structured data without an address is rejected by Google's validator. */`

---

## Defect 5 — `i18n`: no release process — source has fixes, registry has stale tarball

**Severity:** Process defect — root cause of Defect 1.

**Evidence:** The hub's local `dist/` for i18n contains `resolveLocale`, `LocalizedText`, and `TODO_MARKER`, but the published 1.0.0 tarball does not. This means someone ran `pnpm build` locally (updating `dist/`) but never ran `npm publish` (or version-bumped first).

**Impact:** Every spoke that depends on `@journeyoflife-org/i18n` is running a stale snapshot. The spoke cannot access any post-1.0.0 i18n improvements without a manual workaround.

**Fix:** Establish a release checklist:
1. `pnpm build`
2. `pnpm test`
3. `npm version <semver>` (auto-commits + tags)
4. `npm publish --registry=https://npm.pkg.github.com`
5. Verify: `npm view @journeyoflife-org/i18n versions --registry=https://npm.pkg.github.com`

---

## Summary

| # | Package | Defect | Severity | Spoke workaround |
|---|---|---|---|---|
| 1 | `i18n@1.0.0` | `resolveLocale`/`LocalizedText`/`TODO_MARKER` missing from published dist | Build-breaking | Local shim in `src/lib/resolve-locale.ts` |
| 2 | `ui@1.0.0` | `files` omits `src/tokens/` — tailwind preset broken | Build-breaking | Manual token mapping in spoke `tailwind.config.ts` |
| 3 | `seo` | Source says 1.0.0, registry has 1.1.0 | Process | N/A (works but untraceable) |
| 4 | `seo@1.1.0` | `ChurchEntityInput.address` required, no JSDoc | Usability | Deferred entity emission |
| 5 | `i18n` | No release process — stale published tarball | Process (root cause of #1) | N/A |

---

## Filing instructions

This report should be filed as a GitHub issue on `journeyoflife-org/jol-hub` (or as 5 separate issues if one-defect-per-issue is preferred). Defects 1 and 2 are build-blocking and should be prioritised.
