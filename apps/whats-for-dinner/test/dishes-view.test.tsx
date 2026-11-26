import { createDOM } from "@qwik.dev/core/testing";
import { describe, expect, it } from "vitest";
import { DishesView } from "../src/components/dishes-view.tsx";
import type { DishesPage, DishListItem } from "../src/dishes/model.ts";

const dish = (id: string, name: string): DishListItem => ({
  id,
  name,
  ratings: null,
  photoUrl: null,
});

const found = (dishes: DishListItem[], query: Partial<DishesPage["query"]> = {}): DishesPage => ({
  query: { search: "", sort: "mostCooked", ...query },
  result: { ok: true, dishes },
});

const renderView = async (page: DishesPage) => {
  const dom = await createDOM();
  await dom.render(<DishesView page={page} />);
  return dom.screen;
};

const text = (element: Element | null | undefined) =>
  element?.textContent.replace(/\s+/g, " ").trim();

const chips = (screen: HTMLElement) =>
  Array.from(screen.querySelectorAll(".dishes__sort a")).map((link) => ({
    label: text(link),
    href: link.getAttribute("href"),
    current: link.getAttribute("aria-current"),
  }));

describe("DishesView", () => {
  it("has the Dishes heading and a New dish link", async () => {
    const screen = await renderView(found([dish("d1", "Moqueca")]));

    expect(text(screen.querySelector("h1"))).toBe("Dishes");
    const newDish = screen.querySelector('a[href="/dishes/new/"]');
    expect(text(newDish)).toBe("New dish");
  });

  it("lists a card for each dish, in the order the API gave", async () => {
    const screen = await renderView(
      found([dish("d1", "Strogonoff"), dish("d2", "Moqueca"), dish("d3", "Lasanha")]),
    );

    const names = Array.from(screen.querySelectorAll("ul.dishes__list > li .dish-card__name"));
    expect(names.map(text)).toEqual(["Strogonoff", "Moqueca", "Lasanha"]);
  });

  it("announces how many dishes the list shows", async () => {
    const one = await renderView(found([dish("d1", "Moqueca")]));
    const two = await renderView(found([dish("d1", "Moqueca"), dish("d2", "Lasanha")]));

    expect(text(one.querySelector(".dishes__count[role=status]"))).toBe("1 dish");
    expect(text(two.querySelector(".dishes__count[role=status]"))).toBe("2 dishes");
  });

  it("searches with a GET form that keeps the current sort", async () => {
    const screen = await renderView(
      found([dish("d1", "Lasanha")], { search: "ricota", sort: "recent" }),
    );

    const form = screen.querySelector("form[role=search]");
    expect(form?.getAttribute("method")).toBe("get");
    expect(form?.getAttribute("action")).toBe("/dishes/");
    const input = form?.querySelector<HTMLInputElement>('input[name="q"]');
    expect(input?.getAttribute("type")).toBe("search");
    expect(input?.getAttribute("value")).toBe("ricota");
    expect(form?.querySelector("label[for]")?.textContent).toBe("Search by dish or ingredient");
    const sort = form?.querySelector('input[type="hidden"][name="sort"]');
    expect(sort?.getAttribute("value")).toBe("recent");
  });

  it("offers the three sorts as links, marking the current one", async () => {
    const screen = await renderView(found([dish("d1", "Moqueca")]));

    expect(chips(screen)).toEqual([
      { label: "Most cooked", href: "/dishes/?sort=mostCooked", current: "true" },
      { label: "Best score", href: "/dishes/?sort=bestScore", current: null },
      { label: "Recent", href: "/dishes/?sort=recent", current: null },
    ]);
  });

  it("keeps the search when changing the sort", async () => {
    const screen = await renderView(
      found([dish("d1", "Lasanha")], { search: "ricota fresca", sort: "bestScore" }),
    );

    expect(chips(screen).map(({ href, current }) => [href, current])).toEqual([
      ["/dishes/?q=ricota+fresca&sort=mostCooked", null],
      ["/dishes/?q=ricota+fresca&sort=bestScore", "true"],
      ["/dishes/?q=ricota+fresca&sort=recent", null],
    ]);
  });

  it("invites saving the first dish when there are none, without search or sort", async () => {
    const screen = await renderView(found([]));

    expect(text(screen.querySelector(".wfd-status__title"))).toBe("No dishes yet");
    expect(text(screen.querySelector(".wfd-status__body"))).toBe(
      "Nobody has saved a dish yet. Want to be the first?",
    );
    expect(text(screen.querySelector('.wfd-status__action a[href="/dishes/new/"]'))).toBe(
      "Save the first dish",
    );
    // One main action per screen: the empty state's replaces the header's New dish.
    expect(screen.querySelectorAll('a[href="/dishes/new/"]')).toHaveLength(1);
    expect(screen.querySelector("form[role=search]")).toBeFalsy();
    expect(screen.querySelector(".dishes__sort")).toBeFalsy();
  });

  it("says nothing matched a search, and keeps the search to change it", async () => {
    const screen = await renderView(found([], { search: "ricota" }));

    expect(text(screen.querySelector(".wfd-status__title"))).toBe("No dishes match “ricota”");
    expect(text(screen.querySelector(".wfd-status__body"))).toBe(
      "Try another name or ingredient, or save it as a new dish.",
    );
    expect(screen.querySelector("form[role=search]")).toBeTruthy();
    expect(screen.querySelector("ul.dishes__list")).toBeFalsy();
  });

  it("shows an error when the dishes couldn't be loaded, and keeps the search", async () => {
    const screen = await renderView({
      query: { search: "ricota", sort: "mostCooked" },
      result: { ok: false },
    });

    expect(text(screen.querySelector(".wfd-alert"))).toContain("Couldn't load the dishes");
    expect(screen.querySelector("form[role=search]")).toBeTruthy();
    expect(screen.querySelector("ul.dishes__list")).toBeFalsy();
    // No "no dishes" message: we don't know that there are none.
    expect(screen.querySelector(".wfd-status")).toBeFalsy();
  });
});
