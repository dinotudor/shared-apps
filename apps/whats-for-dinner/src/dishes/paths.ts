import type { DishListQuery } from "./model.ts";

/** The Dishes page (brief section 6). */
export const DISHES_PATH = "/dishes/";

/** STUB(#26): the New dish screen. Its route shows "coming soon" until then. */
export const NEW_DISH_PATH = "/dishes/new/";

/** STUB(#25): the Dish screen. Its route shows "coming soon" until then. */
export const dishPath = (id: string): string => `${DISHES_PATH}${encodeURIComponent(id)}/`;

/** The Dishes page's URL for a search and sort: where the form and the sort links go. */
export const dishesHref = ({ search, sort }: DishListQuery): string => {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  params.set("sort", sort);
  return `${DISHES_PATH}?${params.toString()}`;
};
