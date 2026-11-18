import { createDOM } from "@qwik.dev/core/testing";
import { describe, expect, it } from "vitest";
import { AppNav } from "../src/components/app-nav.tsx";

const renderNav = async (pathname: string) => {
  const dom = await createDOM();
  await dom.render(<AppNav pathname={pathname} />);
  return Array.from(dom.screen.querySelectorAll("nav a"));
};

describe("AppNav", () => {
  it("renders the Week and Dishes tabs", async () => {
    const links = await renderNav("/");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Week", "/"],
      ["Dishes", "/dishes/"],
    ]);
  });

  it.each([
    ["/", "Week"],
    ["/day/2026-11-12/", "Week"],
    ["/dishes/", "Dishes"],
    ["/dishes/42/", "Dishes"],
  ])("marks the active tab on %s", async (pathname, active) => {
    const links = await renderNav(pathname);
    const current = links.filter((link) => link.getAttribute("aria-current") === "page");
    expect(current.map((link) => link.textContent)).toEqual([active]);
  });

  it("marks no tab on a page outside the tabs", async () => {
    const links = await renderNav("/design-system/");
    expect(links.filter((link) => link.hasAttribute("aria-current"))).toEqual([]);
  });
});
