import { component$ } from "@qwik.dev/core";
import type { Component, PropsOf, QRL } from "@qwik.dev/core";
import { _ } from "compiled-i18n";
import { Alert, Icon, StatusMessage, TextField } from "@shared-apps/design-system";
import { DISH_SORTS } from "../dishes/model.ts";
import type { DishesPage, DishListQuery, DishSort } from "../dishes/model.ts";
import { AnyLink } from "./any-link.tsx";
import { DishCard } from "./dish-card.tsx";

export const DISHES_PATH = "/dishes/";
/** STUB(#26): the New dish screen. The route shows "coming soon" until then. */
export const NEW_DISH_PATH = "/dishes/new/";

export type DishesViewProps = {
  page: DishesPage;
  /** Qwik Router's Link in the app. Tests leave it out and get plain links. */
  link?: Component<PropsOf<"a">>;
  /**
   * Runs a search without reloading the page. Without it, or before the page's script
   * loads, the form submits as a plain GET and the server renders the results.
   */
  onSearch$?: QRL<(query: DishListQuery) => void>;
};

/** The Dishes page's URL for a search and sort: what the form and the sort links go to. */
export const dishesHref = ({ search, sort }: DishListQuery): string => {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  params.set("sort", sort);
  return `${DISHES_PATH}?${params.toString()}`;
};

// A function, not a constant: labels are translated per render (docs/adr/0009).
const sortLabel = (sort: DishSort): string =>
  ({ mostCooked: _`Most cooked`, bestScore: _`Best score`, recent: _`Recent` })[sort];

const countLabel = (count: number): string => (count === 1 ? _`1 dish` : _`${count} dishes`);

/**
 * The Dishes page (wireframe 4): search, three sorts, the dish cards and a New dish link,
 * with empty, no-match and error states. Everything it shows comes from `page`.
 */
export const DishesView = component$<DishesViewProps>(({ page, link, onSearch$ }) => {
  const { query, result } = page;
  // A family with no dishes at all has nothing to search or sort, and the empty state's
  // button is the screen's one main action.
  const noDishesAtAll = result.ok && result.dishes.length === 0 && !query.search;

  return (
    <div class="stack dishes">
      <div class="dishes__header">
        <h1>{_`Dishes`}</h1>
        {!noDishesAtAll && (
          <AnyLink link={link} href={NEW_DISH_PATH} class="wfd-button wfd-button--primary">
            <Icon name="plus" size={20} />
            {_`New dish`}
          </AnyLink>
        )}
      </div>

      {!noDishesAtAll && (
        <>
          <form
            role="search"
            method="get"
            action={DISHES_PATH}
            preventdefault:submit={Boolean(onSearch$)}
            onSubmit$={(_event, form) => {
              const input = form.elements.namedItem("q");
              const search = input instanceof HTMLInputElement ? input.value.trim() : "";
              return onSearch$?.({ search, sort: query.sort });
            }}
          >
            <TextField
              name="q"
              type="search"
              icon="search"
              label={_`Search by dish or ingredient`}
              value={query.search}
              enterKeyHint="search"
              autoComplete="off"
            />
            <input type="hidden" name="sort" value={query.sort} />
          </form>

          <div class="dishes__sort row" role="group" aria-label={_`Sort by`}>
            {DISH_SORTS.map((sort) => {
              const selected = sort === query.sort;
              return (
                <AnyLink
                  key={sort}
                  link={link}
                  href={dishesHref({ search: query.search, sort })}
                  class="wfd-chip"
                  aria-current={selected ? "true" : undefined}
                >
                  {/* The selected sort shows a check mark, not only colour (brief 10). */}
                  {selected && <Icon name="check" size={16} />}
                  {sortLabel(sort)}
                </AnyLink>
              );
            })}
          </div>
        </>
      )}

      {!result.ok ? (
        // No humour in errors (brief 10).
        <Alert variant="warning" title={_`Couldn't load the dishes`}>
          {_`Please try again in a moment.`}
        </Alert>
      ) : noDishesAtAll ? (
        <StatusMessage title={_`No dishes yet`}>
          {_`Nobody has saved a dish yet. Want to be the first?`}
          <AnyLink
            q:slot="action"
            link={link}
            href={NEW_DISH_PATH}
            class="wfd-button wfd-button--primary"
          >
            {_`Save the first dish`}
          </AnyLink>
        </StatusMessage>
      ) : result.dishes.length === 0 ? (
        <StatusMessage icon="search" title={_`No dishes match “${query.search}”`}>
          {_`Try another name or ingredient, or save it as a new dish.`}
        </StatusMessage>
      ) : (
        <ul class="dishes__list">
          {result.dishes.map((dish) => (
            <li key={dish.id}>
              <DishCard dish={dish} link={link} />
            </li>
          ))}
        </ul>
      )}

      {/* Always on the page, so a new search's count is announced when it changes. */}
      <p class="dishes__count visually-hidden" role="status">
        {result.ok && result.dishes.length > 0 ? countLabel(result.dishes.length) : ""}
      </p>
    </div>
  );
});
