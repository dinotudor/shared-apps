# @shared-apps/design-system

Tokens, icons, logo and base Qwik components for What's for dinner?, built on the SkiroLiro base. The design sources are in `docs/apps/whats-for-dinner/design/`, and the rules are in brief section 10. The decisions behind this package are recorded in [ADR 0001](../../docs/adr/0001-design-system-package.md).

## Use

```ts
// Once, in the app's root layout:
import "@shared-apps/design-system/styles.css";

import { Button, Icon, tokens, vars } from "@shared-apps/design-system";
```

| Entry | Contents |
|---|---|
| `@shared-apps/design-system` | Components, `ICON_NAMES` / `IconName`, `tokens` (values), `vars` (`var(--…)` references) |
| `@shared-apps/design-system/styles.css` | Self-hosted fonts, tokens and component styles. Import it once |
| `@shared-apps/design-system/tokens.css` | Tokens only |
| `@shared-apps/design-system/brand/*` | Logo SVGs: `wfd-mark-*`, `wfd-lockup-*` (light and dark), `wfd-app-icon.svg` (app icon, favicon) |

The package ships TypeScript source with no build step. The app's Vite and Qwik setup compiles it.

## Tokens

- `--wfd-*`: palette B "Verde de feira" roles (`bg`, `surface`, `sunken`, `border`, `border-strong`, `text`, `text-muted`, `action`, `on-action`, `confirm`, `selected`, `warning*`, `info*`, `danger`, `success*`), plus `--wfd-font-ui`, `--wfd-font-mono` and `--wfd-radius-{sm,md,lg,xl,full}`.
- `--sl-*`: the SkiroLiro base: `--sl-text-*` / `--sl-leading-*`, `--sl-space-*` (4 px grid), `--sl-shadow-*`, `--sl-duration-*`, `--sl-ease-*`.
- Light mode is the default. Dark mode follows `prefers-color-scheme`. `data-theme="light"` or `data-theme="dark"` on `<html>` overrides the system.
- `success`, `success-bg` and `success-border` are aliases of `confirm` and `selected`. Palette B has no success role of its own.
- To change a token, edit `src/tokens.ts` and run `pnpm --filter @shared-apps/design-system tokens`. A test fails if `tokens.css` is out of date.

Use roles, never raw hex. In inline styles, use `vars.color.action` rather than a value from `tokens`, so the style follows the theme.

## Components

All components use class names prefixed with `wfd-` (`wfd-button`, modifiers like `wfd-button--primary`, parts like `wfd-field__label`) and only token values for colour. Every touch target is at least 44 px. State is never shown by colour alone. UI strings are pt-BR.

### Icon

`<Icon name="search" size={16 | 20 | 24} label?="Buscar" />`: a 24-grid stroke icon from the sprite, in `currentColor`. Without `label` it is hidden from screen readers (use this when visible text sits next to it). With `label` it has `role="img"` and that name. An icon-only button needs a `label` on the icon or an `aria-label` on the button.

The sprite must be served from the same origin as the page, because browsers refuse an SVG `<use>` that points to another origin. Vite serves it with the app's other assets, so this holds unless the assets are moved to a separate CDN domain.

### Logo

`<Logo variant="mark" | "lockup" height?={30} decorative? />`: renders the light and the dark file, and CSS shows the one for the active theme. Its alt text is "What's for dinner?". Set `decorative` when the name is already on screen.

Known trade-off: the browser downloads both images, even though only one shows. The files are small (8 to 17 kB). A possible improvement is one inline SVG whose colours come from tokens, or a `<picture>` element (which follows only the system preference, not `data-theme`).

### Button

| Variant | Use when | Look |
|---|---|---|
| `primary` (default) | The one main action on a screen | `action` fill, `on-action` text |
| `secondary` | Supporting actions, Cancel | `border-strong` outline |
| `text` | Low-emphasis actions inside content | `action` text, no border |
| `danger` | Destructive actions (delete) | `danger` outline and text. Never filled, never the default |

Props: `variant`, `icon` (decorative, before the label), `type` (defaults to `"button"`), plus any `<button>` attribute (`disabled`, `onClick$`). States: hover (sunken background), pressed, focus ring, disabled (50 % opacity, `not-allowed`). The label is a verb.

### Card

`<Card as?="div" | "article" | "section">`: a `surface` panel with a `border` and radius `xl`. Use `article` for an item such as a dish.

### Chip

`<Chip selected? onClick$>`: a toggle button with `aria-pressed`. When selected it inverts (text-coloured fill) and shows a check mark.

### Checkbox

`<Checkbox label hint? checked? disabled? name value onChange$={(checked) => …} />`: a native checkbox inside its label, so the whole 44 px row is the target. Checked shows an `action` box with a check mark. Keyboard focus is shown on the box. `hint` is right-aligned muted text, such as a quantity.

### TextField and TextArea

`<TextField label hint? error? icon? … />` and `<TextArea label hint? error? rows?={3} … />`: the label is always visible above the field. `hint` (muted) and `error` are linked through `aria-describedby`. An error sets `aria-invalid`, a 2 px `danger` border and an alert icon next to the message. TextField takes any `<input>` attribute. `icon` adds a decorative leading icon (use `search` with `type="search"`). Your own `aria-describedby` ids are kept after the hint and error ids, and an `aria-invalid` you pass takes precedence.

### BottomNav

`<BottomNav items={[{ href, label, icon }]} current?="/semana" label?="Navegação principal" />`: a `<nav>` landmark with up to 5 destinations. Labels are always visible. The current item is the one with the longest `href` that matches `current` segment by segment, ignoring trailing slashes: `/pratos` matches `/pratos/` and `/pratos/42`, but not `/pratosx`. `/` matches only itself. That item has `aria-current="page"`, the `action` colour and a `selected` pill behind its icon. It uses plain links, so the package doesn't depend on the router. Support for router links is planned for #13.

### Avatar

`<Avatar name size?={24 | 32 | 40 | 56} src? />`: a circle with the initials of the first and last names (`role="img"`, named after the person), or the photo with the name as alt text.

### Alert

| Variant | Icon (spoken as) | Use when |
|---|---|---|
| `warning` | alert ("Atenção") | Something needs attention: the missing-ingredient alert |
| `info` | info ("Informação") | Neutral information: offline mode |
| `success` | check ("Sucesso") | Something went well and the message should stay on screen |

`<Alert variant title?>body</Alert>`: a persistent inline message. The body sits in a `<div>`, so it can hold block content. It has no live region. Use Toast for transient confirmations.

### Toast

`<Toast open={signal} duration?={6000}>Prato salvo.</Toast>`: a short confirmation in a polite live region (`role="status"`) that is always in the page. It closes after `duration` (SkiroLiro asks for 5 to 8 s) or from its close button, and sets `open` to `false`. The timer pauses while the pointer or keyboard focus is on the toast, and only resumes when both have left. When you replace the message while the toast is open, change `messageId` (a counter is enough) so the new message gets its full `duration`. The message sits in a `<div>`, so it can hold block content. Errors that need action go in an Alert, not a toast.

### Dialog and BottomSheet

`<Dialog open={signal} title>text<div q:slot="actions">…</div></Dialog>` and the same API for `<BottomSheet>`: built on the native `<dialog>` with `showModal()`, which traps focus, closes on Esc, makes the page behind inert and returns focus on close. They are labelled by their title and have a "Fechar" button. Closing sets `open` to `false`. Dialog is centred. BottomSheet rises from the bottom edge and is preferred on phones for choices. Use one title, short text and at most two actions, and never make the destructive action the default.

## Accessibility

Checked with the token contrast pairs (WCAG 2.1 AA) and by rendering every component in light and dark mode:

- Text pairs are 4.5:1 or more in both modes, and control borders and icons are 3:1 or more. The prototype's `action` on `selected` is 4.4:1 in light mode, so avatar initials use `text` instead.
- Every control is a native element (`button`, `a`, `input`, `textarea`, `dialog`), so keyboard support comes with it. Focus is a 2 px `action` ring with a 2 px offset.
- `prefers-reduced-motion` turns off transitions and the rise animation.

## Open questions

- **Demo route:** the light and dark demo route asked for in #18 waits for `apps/web` (#13).
- **Off-grid sizes:** some sizes are copied from the prototype (6, 10 and 14 px gaps, a 22 px checkbox) and are not on the 4 px grid.
