import { component$, Slot } from "@qwik.dev/core";
import type { PropsOf } from "@qwik.dev/core";
import { describe, expect, it } from "vitest";
import { BottomNav } from "../src/index.ts";
import { all, get, render } from "./render.ts";

const items = [
  { href: "/week", label: "Week", icon: "week" },
  { href: "/dishes", label: "Dishes", icon: "dishes" },
] as const;

describe("BottomNav", () => {
  it("renders a labelled navigation landmark with a visible label for each destination", async () => {
    const { screen } = await render(<BottomNav items={[...items]} current="/week" />);
    const nav = get(screen, "nav.wfd-bottom-nav");
    expect(nav.getAttribute("aria-label")).toBe("Main navigation");
    const links = all<HTMLAnchorElement>(nav, "a");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/week", "/dishes"]);
    expect(links.map((link) => link.textContent)).toEqual(["Week", "Dishes"]);
  });

  it("marks the current destination as the current page", async () => {
    const { screen } = await render(<BottomNav items={[...items]} current="/dishes" />);
    const [week, dishes] = all(screen, "a");
    expect(week.hasAttribute("aria-current")).toBe(false);
    expect(dishes.getAttribute("aria-current")).toBe("page");
  });

  it.each([
    ["/dishes/", "Dishes"],
    ["/dishes/42", "Dishes"],
    ["/dishes/42/", "Dishes"],
    ["/", "Home"],
    ["/week/", null],
    ["/dishesx", null],
    [undefined, null],
  ] as const)("marks the item for %s as current", async (current, expected) => {
    // "/" matches only itself; other items match their own path and anything below it.
    const withHome = [{ href: "/", label: "Home", icon: "pot" } as const, items[1]];
    const { screen } = await render(<BottomNav items={[...withHome]} current={current} />);
    const marked = all(screen, "a")
      .filter((link) => link.getAttribute("aria-current") === "page")
      .map((link) => link.textContent);
    expect(marked).toEqual(expected ? [expected] : []);
  });

  it("marks only the most specific item when two match", async () => {
    const nested = [items[1], { href: "/dishes/new", label: "New", icon: "plus" } as const];
    const { screen } = await render(<BottomNav items={[...nested]} current="/dishes/new/" />);
    const marked = all(screen, "a").filter((link) => link.hasAttribute("aria-current"));
    expect(marked.map((link) => link.textContent)).toEqual(["New"]);
  });

  it("accepts a different landmark label", async () => {
    const { screen } = await render(<BottomNav items={[...items]} label="Sections" />);
    expect(get(screen, "nav").getAttribute("aria-label")).toBe("Sections");
  });

  it("renders each destination through the link component it is given", async () => {
    // Stands in for Qwik Router's Link: it must keep the anchor attributes it receives.
    const RouterLink = component$<PropsOf<"a">>((props) => (
      <a {...props} data-router-link="">
        <Slot />
      </a>
    ));
    const { screen } = await render(
      <BottomNav items={[...items]} current="/dishes/" link={RouterLink} />,
    );
    const links = all<HTMLAnchorElement>(screen, "a");
    expect(links.map((link) => link.hasAttribute("data-router-link"))).toEqual([true, true]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/week", "/dishes"]);
    expect(links.map((link) => link.textContent)).toEqual(["Week", "Dishes"]);
    expect(links.map((link) => link.getAttribute("aria-current"))).toEqual([null, "page"]);
    expect(links[0]?.className).toBe("wfd-bottom-nav__link");
  });
});
