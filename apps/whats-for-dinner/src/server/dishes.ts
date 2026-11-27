import { DEFAULT_DISH_SORT, DISH_SORTS } from "../dishes/model.ts";
import type { DishesPage, DishListQuery, DishSort } from "../dishes/model.ts";
import type { ApiClient } from "./api.ts";

// The longest search dishes.list accepts (its NAME_MAX). Longer is cut, not refused.
const SEARCH_MAX = 120;

const isDishSort = (value: string | null): value is DishSort =>
  DISH_SORTS.some((sort) => sort === value);

/** The search and sort in the page's URL (`?q=` and `?sort=`), with defaults for anything else. */
const queryFrom = (url: URL): DishListQuery => {
  const sort = url.searchParams.get("sort");
  return {
    search: (url.searchParams.get("q") ?? "").trim().slice(0, SEARCH_MAX),
    sort: isDishSort(sort) ? sort : DEFAULT_DISH_SORT,
  };
};

/**
 * The Dishes page's data: the dishes matching the URL's search, in its order. A failed call
 * becomes `{ ok: false }` so the page can say so, and the error goes to `report` for the
 * server log.
 */
export const loadDishes = async (
  api: Pick<ApiClient, "dishes">,
  url: URL,
  report: (error: unknown) => void,
): Promise<DishesPage> => {
  const query = queryFrom(url);
  try {
    const found = await api.dishes.list.query({
      search: query.search || undefined,
      sort: query.sort,
    });
    const dishes = found.map(({ id, name }) => ({
      id,
      name,
      // STUB(#22): ratings and Times cooked come with the ratings API.
      ratings: null,
      // STUB(#23): photos come with object storage.
      photoUrl: null,
    }));
    return { query, result: { ok: true, dishes } };
  } catch (error) {
    report(error);
    return { query, result: { ok: false } };
  }
};
