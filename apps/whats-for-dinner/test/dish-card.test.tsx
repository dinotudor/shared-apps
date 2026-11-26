import { createDOM } from "@qwik.dev/core/testing";
import { describe, expect, it } from "vitest";
import { DishCard } from "../src/components/dish-card.tsx";
import type { DishListItem, DishRatings } from "../src/dishes/model.ts";

const moqueca: DishListItem = { id: "d1", name: "Moqueca", ratings: null, photoUrl: null };

const rated = (ratings: Partial<DishRatings>): DishListItem => ({
  ...moqueca,
  ratings: { timesCooked: 3, familyAverage: 6.5, myScore: 7, fedUp: [], ...ratings },
});

const renderCard = async (dish: DishListItem) => {
  const dom = await createDOM();
  await dom.render(<DishCard dish={dish} />);
  const link = dom.screen.querySelector("a");
  if (!link) throw new Error("the card has no link");
  return link;
};

const text = (element: Element | null | undefined) =>
  element?.textContent.replace(/\s+/g, " ").trim();

describe("DishCard", () => {
  it("links to the dish, named by the dish's name", async () => {
    const link = await renderCard(moqueca);

    expect(link.getAttribute("href")).toBe("/dishes/d1/");
    expect(text(link.querySelector(".dish-card__name"))).toBe("Moqueca");
  });

  it("shows a decorative photo placeholder while the dish has no photo", async () => {
    const link = await renderCard(moqueca);

    const photo = link.querySelector(".dish-card__photo");
    expect(photo?.getAttribute("aria-hidden")).toBe("true");
    expect(photo?.querySelector("img")).toBeFalsy();
  });

  it("shows the dish's photo when it has one, as decoration next to its name", async () => {
    const link = await renderCard({ ...moqueca, photoUrl: "/photos/d1.webp" });

    const img = link.querySelector(".dish-card__photo img");
    expect(img?.getAttribute("src")).toBe("/photos/d1.webp");
    expect(img?.getAttribute("alt")).toBe("");
  });

  it("shows no ratings line until ratings are available", async () => {
    const link = await renderCard(moqueca);

    expect(link.querySelector(".dish-card__meta")).toBeFalsy();
    expect(link.querySelector(".dish-card__face")).toBeFalsy();
  });

  it("shows times cooked, the family average and my score", async () => {
    const link = await renderCard(rated({ timesCooked: 11, familyAverage: 8.9, myScore: 9 }));

    expect(text(link.querySelector(".dish-card__meta"))).toBe("Cooked 11× · family 8.9 · you 9");
  });

  it("leaves out my score when I haven't rated the dish", async () => {
    const link = await renderCard(rated({ myScore: null }));

    expect(text(link.querySelector(".dish-card__meta"))).toBe("Cooked 3× · family 6.5");
  });

  it("says so when the family hasn't scored a cooked dish", async () => {
    const link = await renderCard(rated({ familyAverage: null, myScore: null }));

    expect(text(link.querySelector(".dish-card__meta"))).toBe("Cooked 3× · no scores yet");
    expect(link.querySelector(".dish-card__face")).toBeFalsy();
  });

  it("calls a dish nobody has cooked new", async () => {
    const link = await renderCard(rated({ timesCooked: 0, familyAverage: null, myScore: null }));

    expect(text(link.querySelector(".dish-card__meta"))).toBe("New · not cooked yet");
  });

  it.each([
    [4.9, "🤢"],
    [5, "😐"],
    [7.9, "😐"],
    [8, "😍"],
  ])("shows the emoji for a family average of %d", async (familyAverage, emoji) => {
    const link = await renderCard(rated({ familyAverage }));

    const face = link.querySelector(".dish-card__face");
    expect(text(face)).toBe(emoji);
    // The average is in the text already; the emoji only repeats it.
    expect(face?.getAttribute("aria-hidden")).toBe("true");
  });

  it("notes who is fed up with the dish", async () => {
    const one = await renderCard(rated({ fedUp: ["Bia"] }));
    const two = await renderCard(rated({ fedUp: ["Bia", "Pai"] }));

    expect(text(one.querySelector(".dish-card__fed-up"))).toBe("🤢 Bia is fed up");
    expect(text(two.querySelector(".dish-card__fed-up"))).toBe("🤢 Bia and Pai are fed up");
  });

  it("shows no fed-up note when nobody is fed up", async () => {
    const link = await renderCard(rated({ fedUp: [] }));

    expect(link.querySelector(".dish-card__fed-up")).toBeFalsy();
  });
});
