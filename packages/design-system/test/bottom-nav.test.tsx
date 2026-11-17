import { describe, expect, it } from "vitest";
import { BottomNav } from "../src/index.ts";
import { all, get, render } from "./render.ts";

const items = [
  { href: "/semana", label: "Semana", icon: "week" },
  { href: "/pratos", label: "Pratos", icon: "dishes" },
] as const;

describe("BottomNav", () => {
  it("renders a labelled navigation landmark with a visible label for each destination", async () => {
    const { screen } = await render(<BottomNav items={[...items]} current="/semana" />);
    const nav = get(screen, "nav.wfd-bottom-nav");
    expect(nav.getAttribute("aria-label")).toBe("Navegação principal");
    const links = all<HTMLAnchorElement>(nav, "a");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/semana", "/pratos"]);
    expect(links.map((link) => link.textContent)).toEqual(["Semana", "Pratos"]);
  });

  it("marks the current destination as the current page", async () => {
    const { screen } = await render(<BottomNav items={[...items]} current="/pratos" />);
    const [week, dishes] = all(screen, "a");
    expect(week.hasAttribute("aria-current")).toBe(false);
    expect(dishes.getAttribute("aria-current")).toBe("page");
  });

  it.each([
    ["/pratos/", "Pratos"],
    ["/pratos/42", "Pratos"],
    ["/pratos/42/", "Pratos"],
    ["/", "Início"],
    ["/semana/", null],
    ["/pratosx", null],
    [undefined, null],
  ] as const)("marks the item for %s as current", async (current, expected) => {
    // "/" matches only itself; other items match their own path and anything below it.
    const withHome = [{ href: "/", label: "Início", icon: "pot" } as const, items[1]];
    const { screen } = await render(<BottomNav items={[...withHome]} current={current} />);
    const marked = all(screen, "a")
      .filter((link) => link.getAttribute("aria-current") === "page")
      .map((link) => link.textContent);
    expect(marked).toEqual(expected ? [expected] : []);
  });

  it("marks only the most specific item when two match", async () => {
    const nested = [items[1], { href: "/pratos/novo", label: "Novo", icon: "plus" } as const];
    const { screen } = await render(<BottomNav items={[...nested]} current="/pratos/novo/" />);
    const marked = all(screen, "a").filter((link) => link.hasAttribute("aria-current"));
    expect(marked.map((link) => link.textContent)).toEqual(["Novo"]);
  });

  it("accepts a different landmark label", async () => {
    const { screen } = await render(<BottomNav items={[...items]} label="Seções" />);
    expect(get(screen, "nav").getAttribute("aria-label")).toBe("Seções");
  });
});
