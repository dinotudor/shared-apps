import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TOKENS_CSS_PATH, tokensCss } from "../scripts/tokens-css.ts";
import { renderTokensCss, tokens, vars } from "../src/tokens.ts";

const designFile = new URL(
  "../../../docs/apps/whats-for-dinner/design/tokens-wfd.css",
  import.meta.url,
);

// Reads `--name:value` pairs from one CSS block of the approved design file.
const declarations = (block: string): Record<string, string> =>
  Object.fromEntries(
    [...block.matchAll(/--(wfd-[a-z-]+):([^;}]+)/g)].map((m) => [m[1], m[2].trim()]),
  );

describe("tokens", () => {
  const design = readFileSync(designFile, "utf8");
  const [lightBlock = "", darkBlock = ""] = design.split("@media");
  const designLight = declarations(lightBlock);
  const designDark = declarations(darkBlock);

  it("keeps every palette B colour from the approved design file, light and dark", () => {
    for (const [name, value] of Object.entries(designLight)) {
      if (!name.startsWith("wfd-font") && !name.startsWith("wfd-radius")) {
        expect(tokens.color.light[name.slice(4) as keyof typeof tokens.color.light], name).toBe(
          value,
        );
      }
    }
    for (const [name, value] of Object.entries(designDark)) {
      expect(tokens.color.dark[name.slice(4) as keyof typeof tokens.color.dark], name).toBe(value);
    }
  });

  it("puts the self-hosted variable fonts in front of the design file's font stacks", () => {
    expect(tokens.font.ui).toBe(`'Figtree Variable',${designLight["wfd-font-ui"]}`);
    expect(tokens.font.mono).toBe(`'JetBrains Mono Variable',${designLight["wfd-font-mono"]}`);
  });

  it("keeps the design file's radii", () => {
    expect(tokens.radius).toMatchObject({ md: "12px", lg: "14px", xl: "16px" });
  });

  it("includes the SkiroLiro base spacing scale on the 4 px grid", () => {
    expect(tokens.space).toMatchObject({ 0: "0rem", 1: "0.25rem", 4: "1rem", 20: "5rem" });
  });

  it("names success roles as aliases of existing palette values", () => {
    expect(tokens.color.light.success).toBe("#0F7A5C");
    expect(tokens.color.light["success-bg"]).toBe("#D9F0E4");
    expect(tokens.color.dark.success).toBe("#4FE0B0");
  });

  it("exposes var() references for inline styles", () => {
    expect(vars.color.action).toBe("var(--wfd-action)");
    expect(vars.space[4]).toBe("var(--sl-space-4)");
    expect(vars.radius.lg).toBe("var(--wfd-radius-lg)");
  });

  it("switches to dark by system preference unless data-theme says light, and by data-theme=dark", () => {
    const css = renderTokensCss();
    expect(css).toContain(
      '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {',
    );
    expect(css).toContain(':root[data-theme="dark"] {');
    expect(css).toContain("--wfd-action: #4FE0B0;");
  });

  it("matches the committed tokens.css (run `pnpm tokens` after editing tokens.ts)", async () => {
    expect(readFileSync(TOKENS_CSS_PATH, "utf8")).toBe(await tokensCss());
  });
});
