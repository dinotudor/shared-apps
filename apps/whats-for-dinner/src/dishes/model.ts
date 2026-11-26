import type { ApiClient } from "../server/api.ts";

// Types only from the API (playbook ADR 0006): the frontend never imports module code.
type ListInput = Extract<Parameters<ApiClient["dishes"]["list"]["query"]>[0], object>;
type ApiDishSort = NonNullable<ListInput["sort"]>;

/** The three orders the Dishes page offers, in the order its chips show them. */
export const DISH_SORTS = ["mostCooked", "bestScore", "recent"] as const satisfies ApiDishSort[];
export type DishSort = (typeof DISH_SORTS)[number];

/** Wireframe 4 opens on "Most cooked". */
export const DEFAULT_DISH_SORT: DishSort = "mostCooked";

/** What the Dishes page shows: the search as typed (empty for none) and the order. */
export type DishListQuery = { search: string; sort: DishSort };

/**
 * GLOSSARY: Times cooked, plus the ratings from brief 3.2. The API doesn't return these
 * yet: #22 adds them. Scores are 0 to 10.
 */
export type DishRatings = {
  timesCooked: number;
  /** Mean of every member's score; null when nobody has rated the dish. */
  familyAverage: number | null;
  /** The viewer's score; null when they haven't rated the dish. */
  myScore: number | null;
  /** Names of the members whose "fed up" is active, for the card's note. */
  fedUp: string[];
};

/** One card on the Dishes page. */
export type DishListItem = {
  id: string;
  name: string;
  /** Null until #22 adds ratings to the API. */
  ratings: DishRatings | null;
  /** Null until #23 adds photos, and for a dish without one. */
  photoUrl: string | null;
};

/** What the Dishes page loader returns: the query it ran, and the dishes or a failure. */
export type DishesPage = {
  query: DishListQuery;
  result: { ok: true; dishes: DishListItem[] } | { ok: false };
};
