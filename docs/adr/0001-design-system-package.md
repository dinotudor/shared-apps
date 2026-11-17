# 0001. Design system package: Qwik components from source, plain CSS, TS tokens

- Status: accepted
- Date: 2026-11-16
- Issue: #18

## Context

The What's for dinner? design package (`docs/apps/whats-for-dinner/design/`) holds the tokens, icons and logo. The issue asks for them, and for 12 base components, as a workspace package that `apps/web` (Qwik 2) uses. Tokens must be available as CSS custom properties and as TypeScript. Light and dark modes follow the system, and `data-theme` can override it.

## Decision

1. **`packages/design-system` (`@shared-apps/design-system`), consumed from source.** `exports` points at `src/`, like the backend modules. The app's Vite build and Qwik optimizer compile the components, so the package has no build step. The issue sets the folder name, which is why it differs from the playbook's `packages/ui` example.
2. **Qwik components with plain CSS classes.** One stylesheet (`styles.css`, with `wfd-` classes) holds fonts, tokens and component styles. Apps import it once. This avoids scoped styles or CSS-in-JS, keeps the CSS readable next to the prototype, and works the same in SSR.
3. **`src/tokens.ts` is the source of truth.** `tokens.css` is generated from it by a pure function, and a test fails if the committed CSS drifts. Another test checks every palette value against the approved `tokens-wfd.css`. `vars` gives `var(--…)` references for inline styles.
4. **Icons through the sprite.** `<Icon>` renders `<use href="sprite.svg#i-name">` with `currentColor`, as brief section 10 asks. Vite serves the sprite as one cached file.
5. **Fonts are self-hosted** through `@fontsource-variable/figtree` and `@fontsource-variable/jetbrains-mono`. This means no requests to Google, and the fonts keep working offline.
6. **Native `<dialog>`** for Dialog and BottomSheet, for focus trapping, Esc and inert background without custom code.

## Consequences

- A consumer needs Vite and the Qwik plugin. That is true of `apps/web`, but a non-Vite consumer would need a build step first.
- Changing a token means editing `tokens.ts` and running `pnpm tokens`. CI catches a stale `tokens.css`.
- Success alert roles (`--wfd-success*`) are aliases of existing palette B values, not new colours.
