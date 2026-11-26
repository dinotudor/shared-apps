import { component$, getLocale } from "@qwik.dev/core";
import type { Component, PropsOf } from "@qwik.dev/core";
import { _ } from "compiled-i18n";
import { Icon } from "@shared-apps/design-system";
import type { DishListItem, DishRatings } from "../dishes/model.ts";
import { scoreEmoji } from "../dishes/score.ts";
import { SOURCE_LOCALE } from "../i18n/locale.ts";
import { AnyLink } from "./any-link.tsx";

/** STUB(#25): the Dish screen. The route shows "coming soon" until then. */
export const dishPath = (id: string): string => `/dishes/${encodeURIComponent(id)}/`;

export type DishCardProps = {
  dish: DishListItem;
  /** Qwik Router's Link in the app. Tests leave it out and get a plain link. */
  link?: Component<PropsOf<"a">>;
};

/** "8.9" in English, "8,9" in Portuguese. */
const formatAverage = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    value,
  );

/** The line under the name, such as "Cooked 11× · family 8.9 · you 9". */
const ratingsLine = (ratings: DishRatings, locale: string): string => {
  if (ratings.timesCooked === 0) return _`New · not cooked yet`;
  const parts = [_`Cooked ${ratings.timesCooked}×`];
  parts.push(
    ratings.familyAverage === null
      ? _`no scores yet`
      : _`family ${formatAverage(ratings.familyAverage, locale)}`,
  );
  if (ratings.myScore !== null) parts.push(_`you ${ratings.myScore}`);
  return parts.join(" · ");
};

const fedUpNote = (names: string[], locale: string): string => {
  const list = new Intl.ListFormat(locale, { type: "conjunction" }).format(names);
  return names.length === 1 ? _`${list} is fed up` : _`${list} are fed up`;
};

/**
 * One dish on the Dishes page (wireframe 4): photo, name, and the ratings from #22. The
 * whole card is one link to the dish, so it is one tap target and one stop for the keyboard.
 */
export const DishCard = component$<DishCardProps>(({ dish, link }) => {
  const locale = getLocale(SOURCE_LOCALE);
  const { ratings } = dish;
  const content = (
    <>
      {/* Decorative: the name next to it says which dish this is. */}
      <span class="dish-card__photo" aria-hidden="true">
        {dish.photoUrl ? (
          <img src={dish.photoUrl} alt="" width={56} height={56} loading="lazy" />
        ) : (
          <Icon name="image" size={24} />
        )}
      </span>
      <span class="dish-card__body">
        <span class="dish-card__name">{dish.name}</span>
        {ratings && <span class="dish-card__meta">{ratingsLine(ratings, locale)}</span>}
        {ratings && ratings.fedUp.length > 0 && (
          <span class="dish-card__fed-up">
            <span aria-hidden="true">🤢 </span>
            {fedUpNote(ratings.fedUp, locale)}
          </span>
        )}
      </span>
      {ratings?.familyAverage != null && (
        // The average is in the line above; the emoji only repeats it.
        <span class="dish-card__face" aria-hidden="true">
          {scoreEmoji(ratings.familyAverage)}
        </span>
      )}
    </>
  );
  return (
    <AnyLink link={link} href={dishPath(dish.id)} class="dish-card">
      {content}
    </AnyLink>
  );
});
