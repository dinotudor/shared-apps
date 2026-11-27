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
 * GLOSSARY: Times cooked, Score, Family average and Fed up (brief 3.2), as a dish card
 * shows them. The API doesn't return these yet: #22 adds them.
 */
export type DishRatings = {
  timesCooked: number;
  /** GLOSSARY: Family average. Null when no member has scored the dish. */
  familyAverage: number | null;
  /** The viewer's Score, 0 to 10. Null when they haven't scored the dish. */
  viewerScore: number | null;
  /** Names of the members who are Fed up with the dish now. */
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
