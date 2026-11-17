import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ICON_NAMES, Icon } from "../src/index.ts";
import { get, render } from "./render.ts";

const iconsDir = new URL("../src/icons/", import.meta.url);

describe("Icon", () => {
  it("lists every icon file and every sprite symbol, and nothing else", () => {
    const files = readdirSync(iconsDir)
      .filter((file) => file.endsWith(".svg") && file !== "sprite.svg")
      .map((file) => file.replace(/\.svg$/, ""));
    const symbols = [...readFileSync(new URL("sprite.svg", iconsDir), "utf8").matchAll(/<symbol id="i-([a-z-]+)"/g)].map(
      (m) => m[1],
    );
    expect([...ICON_NAMES].sort()).toEqual(files.sort());
    expect([...ICON_NAMES].sort()).toEqual(symbols.sort());
    expect(ICON_NAMES).toHaveLength(33);
  });

  it("renders a decorative 24 px icon from the sprite by default", async () => {
    const { screen } = await render(<Icon name="search" />);
    const svg = get(screen, "svg");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("width")).toBe("24");
    expect(svg.getAttribute("height")).toBe("24");
    expect(get(svg, "use").getAttribute("href")).toMatch(/sprite\.svg#i-search$/);
  });

  it.each([16, 20] as const)("renders at %i px", async (size) => {
    const { screen } = await render(<Icon name="check" size={size} />);
    expect(get(screen, "svg").getAttribute("width")).toBe(String(size));
  });

  it("is announced with its label when one is given", async () => {
    const { screen } = await render(<Icon name="trash" label="Excluir" />);
    const svg = get(screen, "svg");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe("Excluir");
    expect(svg.hasAttribute("aria-hidden")).toBe(false);
  });
});
