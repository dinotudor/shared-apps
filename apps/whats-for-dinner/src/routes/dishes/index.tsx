import { $, component$ } from "@qwik.dev/core";
import { Link, routeLoader$, useNavigate } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { _ } from "compiled-i18n";
import { DishesView } from "../../components/dishes-view.tsx";
import type { DishListQuery } from "../../dishes/model.ts";
import { dishesHref } from "../../dishes/paths.ts";
import { apiFor } from "../../server/api.ts";
import { loadDishes } from "../../server/dishes.ts";

// Runs on the server only: the browser never calls the API (playbook ADR 0006).
export const useDishesPage = routeLoader$((event) =>
  loadDishes(apiFor(event), event.url, (error) => {
    console.error("Listing dishes failed", error);
  }),
);

export default component$(() => {
  const page = useDishesPage();
  const navigate = useNavigate();
  // The URL holds the search, so a search can be shared, reloaded and undone with Back.
  const search = $((query: DishListQuery) => navigate(dishesHref(query)));
  return <DishesView page={page.value} link={Link} onSearch$={search} />;
});

export const head: DocumentHead = () => ({ title: _`Dishes · What's for dinner?` });
