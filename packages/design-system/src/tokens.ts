// Source of truth for the design tokens. `tokens.css` is generated from this file
// (`pnpm tokens`), and a test fails if the two drift apart.
//
// Two layers:
// - `--wfd-*`: What's for dinner? palette B "Verde de feira", font stacks and radii,
//   copied unchanged from docs/apps/whats-for-dinner/design/tokens-wfd.css.
// - `--sl-*`: the SkiroLiro base (type scale, spacing, shadow, motion), copied from
//   the SkiroLiro design system's tokens.css.

const light = {
  bg: "#F4F6F1",
  surface: "#FFFFFF",
  sunken: "#E8EDE4",
  border: "#D6DDD0",
  "border-strong": "#7C8A78",
  text: "#12263A",
  "text-muted": "#55665F",
  action: "#0F7A5C",
  "on-action": "#FFFFFF",
  confirm: "#0F7A5C",
  selected: "#D9F0E4",
  warning: "#8A5200",
  "warning-bg": "#FFEFD0",
  "warning-border": "#E8C27A",
  info: "#1E3A5F",
  "info-bg": "#E6EEF8",
  "info-border": "#A9C0E0",
  danger: "#B92D3A",
  // Palette B has no success role. These alias existing values (confirm, selected)
  // so the three alert variants share one naming pattern without adding colours.
  success: "#0F7A5C",
  "success-bg": "#D9F0E4",
  "success-border": "#0F7A5C",
} as const;

type ColorRole = keyof typeof light;

const dark: Record<ColorRole, string> = {
  bg: "#0C1512",
  surface: "#15211C",
  sunken: "#09100D",
  border: "#243229",
  "border-strong": "#627A6C",
  text: "#E8F1EC",
  "text-muted": "#9BB0A4",
  action: "#4FE0B0",
  "on-action": "#07140F",
  confirm: "#4FE0B0",
  selected: "#153A2D",
  warning: "#F2B84B",
  "warning-bg": "#3A2C10",
  "warning-border": "#6B5220",
  info: "#B5CCF2",
  "info-bg": "#16294A",
  "info-border": "#2E4A7A",
  danger: "#FF8A93",
  success: "#4FE0B0",
  "success-bg": "#153A2D",
  "success-border": "#4FE0B0",
};

export const tokens = {
  color: { light, dark },
  // The @fontsource-variable packages (imported by styles.css) register the fonts
  // under these "Variable" family names; the rest is the design file's stack.
  font: {
    ui: "'Figtree Variable',Figtree,system-ui,sans-serif",
    mono: "'JetBrains Mono Variable','JetBrains Mono',ui-monospace,monospace",
  },
  // md, lg and xl come from palette B; sm and full from the SkiroLiro base.
  radius: { sm: "4px", md: "12px", lg: "14px", xl: "16px", full: "9999px" },
  text: {
    xs: { size: "0.75rem", leading: "1rem" },
    sm: { size: "0.875rem", leading: "1.25rem" },
    md: { size: "1rem", leading: "1.5rem" },
    lg: { size: "1.125rem", leading: "1.75rem" },
    xl: { size: "1.25rem", leading: "1.75rem" },
    "2xl": { size: "1.5rem", leading: "2rem" },
    "3xl": { size: "1.875rem", leading: "2.375rem" },
  },
  space: {
    0: "0rem",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
  },
  shadow: {
    light: {
      sm: "0 1px 2px rgba(14,27,46,.08)",
      md: "0 4px 12px rgba(14,27,46,.10)",
      lg: "0 12px 32px rgba(14,27,46,.14)",
    },
    dark: {
      sm: "0 1px 2px rgba(0,0,0,.40)",
      md: "0 4px 12px rgba(0,0,0,.45)",
      lg: "0 12px 32px rgba(0,0,0,.55)",
    },
  },
  duration: { fast: "120ms", base: "200ms", slow: "320ms" },
  ease: {
    standard: "cubic-bezier(.2,0,0,1)",
    enter: "cubic-bezier(0,0,0,1)",
    exit: "cubic-bezier(.4,0,1,1)",
  },
} as const;

type Tokens = typeof tokens;
type Refs<T> = { readonly [K in keyof T]: string };

const ref = (name: string): string => `var(--${name})`;

const refsFor = <T extends object>(values: T, prefix: string): Refs<T> =>
  Object.fromEntries(Object.keys(values).map((key) => [key, ref(`${prefix}${key}`)])) as Refs<T>;

/** `var(--…)` references, for inline styles. They follow the active theme. */
export const vars = {
  color: refsFor(tokens.color.light, "wfd-"),
  font: refsFor(tokens.font, "wfd-font-"),
  radius: refsFor(tokens.radius, "wfd-radius-"),
  space: refsFor(tokens.space, "sl-space-"),
  shadow: refsFor(tokens.shadow.light, "sl-shadow-"),
  duration: refsFor(tokens.duration, "sl-duration-"),
  ease: refsFor(tokens.ease, "sl-ease-"),
  text: Object.fromEntries(
    Object.keys(tokens.text).map((key) => [
      key,
      { size: ref(`sl-text-${key}`), leading: ref(`sl-leading-${key}`) },
    ]),
  ) as { readonly [K in keyof Tokens["text"]]: { size: string; leading: string } },
};

const declarations = (entries: Record<string, string>, prefix: string): string[] =>
  Object.entries(entries).map(([key, value]) => `--${prefix}${key}: ${value};`);

const block = (selector: string, lines: string[], indent = ""): string =>
  [`${indent}${selector} {`, ...lines.map((line) => `${indent}  ${line}`), `${indent}}`].join("\n");

const modeLines = (mode: "light" | "dark"): string[] => [
  ...declarations(tokens.color[mode], "wfd-"),
  ...declarations(tokens.shadow[mode], "sl-shadow-"),
  `color-scheme: ${mode};`,
];

/** Renders the CSS custom properties. Dark mode follows the system unless `data-theme` overrides it. */
export const renderTokensCss = (): string => {
  const base = [
    ...modeLines("light"),
    ...declarations(tokens.font, "wfd-font-"),
    ...declarations(tokens.radius, "wfd-radius-"),
    ...Object.entries(tokens.text).flatMap(([key, { size, leading }]) => [
      `--sl-text-${key}: ${size};`,
      `--sl-leading-${key}: ${leading};`,
    ]),
    ...declarations(tokens.space, "sl-space-"),
    ...declarations(tokens.duration, "sl-duration-"),
    ...declarations(tokens.ease, "sl-ease-"),
  ];
  return [
    "/* Generated from src/tokens.ts by `pnpm tokens`. Do not edit by hand. */",
    block(":root", base),
    [
      "@media (prefers-color-scheme: dark) {",
      block(':root:not([data-theme="light"])', modeLines("dark"), "  "),
      "}",
    ].join("\n"),
    block(':root[data-theme="dark"]', modeLines("dark")),
    "",
  ].join("\n");
};
