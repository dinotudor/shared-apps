# 0009. How What's for dinner applies playbook ADR 0015 (compiled-i18n)

- Status: proposed
- Date: 2026-11-19
- Issue: #20

## Context

Playbook ADR 0015 and its guideline (`guidelines/i18n.md`) choose compiled-i18n, with English keys, an `i18n:check` script and an `i18n:translate` script. The spike on #20 showed that the library works on Qwik 2 with one patch. It also left decisions that belong to this repo: which locales and which default, how a request picks its locale, how the shared design system gets translated text, and how CI catches keys the plugin doesn't report.

## Decision

1. **Locales are `pt-BR` and `en`, and `pt-BR` is the default.** They are listed once, in `LOCALES` (`apps/whats-for-dinner/src/i18n/locale.ts`), which the Vite plugin, the tests and the scripts all read. English is still the source language and the key. The default only applies to a browser that asks for neither language, and the family speaks Brazilian Portuguese (brief 3.6).
2. **Each request picks its locale in this order: `?locale=`, then the `locale` cookie, then `Accept-Language`, then the default.** `?locale=` is stored in the cookie for a year. Tags match ignoring case, and fall back to their language, so `pt-PT` gets `pt-BR` and `en-GB` gets `en`. The root layout's `onRequest` applies the choice. Changing language reloads the page, because each locale has its own client build.
3. **The design system has no translations.** It can't call `_`, which needs the app's Vite plugin. The few strings its components write themselves (close buttons, alert icon names, the logo's alt text, the offline notice, the default loading and navigation labels) come from a `DesignSystemLabels` context. The app provides that context once, in `root.tsx`, with `_` strings. Without a provider, components use English defaults, which the package's own tests rely on.
4. **`_` is only called while rendering or handling a request, never at module scope.** The server renders every locale from the same module instance, so a module-level `_` would freeze the first request's language. Lists such as the navigation tabs are functions (`navItems()`), and `head` exports are functions.
5. **`i18n:check` also scans the source for `_` keys** (with the TypeScript compiler API). A key the code uses that `en.json` lacks fails, and so does an `en.json` key no code uses. The plugin only adds keys during a production client build, and it never reports unused `en` keys. CI also runs `git diff --exit-code` on `i18n/` after the build, as the guideline says.
6. **`en.json` values stay empty.** The key is the English text, and an empty value falls back to it. A named key needs its English value filled in.
7. **Our own type for `_`** (`apps/whats-for-dinner/types/compiled-i18n.d.ts`, mapped in through `paths`) makes `` _`…` `` a `string` and rejects calling `_` as a function, which the build would not inline.
8. **Dates use `formatDate` (Intl) with the active locale and `TIME_ZONE`**, which defaults to `America/Sao_Paulo` (brief D1).

## Alternatives considered

- **`pt` instead of `pt-BR`** (as in the spike). It's shorter, but the copy is Brazilian, and `Intl` formats dates and numbers differently for `pt-PT`.
- **English as the default locale.** It would be simpler for development, but the default only matters when the browser asks for neither language, and then the family's language is the better guess.
- **`_` inside the design system**, extracted into the app's locale files. The package would then depend on compiled-i18n and on an app's build, and its tests would need the plugin.
- **Required label props on each component** (such as `closeLabel` on every Dialog). These are explicit, but every call site would repeat them, and a missing one would be easy to overlook.
- **Relying on the plugin's log for unused keys.** It only logs once per build and never fails.

## Consequences

- A second web app copies the scripts or moves them to a package. They are generic, except for `LOCALES` and the app directory.
- There is no language switcher in the UI yet. `?locale=en` works, and a switcher needs a design.
- The patch for backtick-quoted keys (`patches/compiled-i18n@1.3.0.patch`) stays until it's fixed upstream. Upgrading compiled-i18n means checking the patch, the alias for `@builder.io/qwik` that Qwik 2's Vite plugin provides, and our type for `_`.
