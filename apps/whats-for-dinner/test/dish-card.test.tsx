import { createDOM } from "@qwik.dev/core/testing";
import { describe, expect, it } from "vitest";
import { DishCard } from "../src/components/dish-card.tsx";
import type { DishListItem, DishRatings } from "../src/dishes/model.ts";

const moqueca: DishListItem = { id: "d1", name: "Moqueca", ratings: null, photoUrl: null };

const rated = (ratings: Partial<DishRatings>): DishListItem => ({
  ...moqueca,
  ratings: { timesCooked: 3, familyAverage: 6.5, viewerScore: 7, fedUp: [], ...ratings },
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

  it("shows times cooked, the family average and the viewer's score", async () => {
    const link = await renderCard(rated({ timesCooked: 11, familyAverage: 8.9, viewerScore: 9 }));

    expect(text(link.querySelector(".dish-card__meta"))).toBe("Cooked 11× · family 8.9 · you 9");
  });

  it("shows a dash for the viewer's score when they haven't scored the dish", async () => {
    const link = await renderCard(rated({ viewerScore: null }));

    expect(text(link.querySelector(".dish-card__meta"))).toBe("Cooked 3× · family 6.5 · you –");
  });

  it("says so when the family hasn't scored a cooked dish", async () => {
    const link = await renderCard(rated({ familyAverage: null, viewerScore: null }));

    expect(text(link.querySelector(".dish-card__meta"))).toBe("Cooked 3× · no scores yet · you –");
    expect(link.querySelector(".dish-card__face")).toBeFalsy();
  });

  it("calls a dish nobody has cooked new, with the 🆕 face", async () => {
    const link = await renderCard(
      rated({ timesCooked: 0, familyAverage: null, viewerScore: null }),
    );

    expect(text(link.querySelector(".dish-card__meta"))).toBe("New · not cooked yet");
    const face = link.querySelector(".dish-card__face");
    expect(text(face)).toBe("🆕");
    expect(face?.getAttribute("aria-hidden")).toBe("true");
  });

  // Brief 3.2's bands are whole scores (0–4, 5–7, 8–10); an average takes the band of the
  // nearest whole score, as the prototype does.
  it.each([
    [4.4, "🤢"],
    [4.5, "😐"],
    [7.4, "😐"],
    [7.5, "😍"],
  ])("shows the emoji for a family average of %d", async (familyAverage, emoji) => {
    const link = await renderCard(rated({ familyAverage }));

    const face = link.querySelector(".dish-card__face");
    expect(text(face)).toBe(emoji);
    // The average is in the text already; the emoji only repeats it.
    expect(face?.getAttribute("aria-hidden")).toBe("true");
  });

  it("notes each member who is fed up with the dish", async () => {
    const link = await renderCard(rated({ fedUp: ["Alex", "Sam"] }));

    const notes = Array.from(link.querySelectorAll(".dish-card__fed-up"));
    expect(notes.map(text)).toEqual(["🤢 Alex is fed up", "🤢 Sam is fed up"]);
  });

  it("shows no fed-up note when nobody is fed up", async () => {
    const link = await renderCard(rated({ fedUp: [] }));

    expect(link.querySelector(".dish-card__fed-up")).toBeFalsy();
  });
});
