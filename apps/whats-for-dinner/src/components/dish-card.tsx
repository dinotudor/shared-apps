import { component$, getLocale } from "@qwik.dev/core";
import { _ } from "compiled-i18n";
import { Icon } from "@shared-apps/design-system";
import type { DishListItem, DishRatings } from "../dishes/model.ts";
import { dishPath } from "../dishes/paths.ts";
import { scoreEmoji } from "../dishes/score.ts";
import { SOURCE_LOCALE } from "../i18n/locale.ts";
import { AnyLink } from "./any-link.tsx";
import type { LinkComponent } from "./any-link.tsx";

export type DishCardProps = {
  dish: DishListItem;
  link?: LinkComponent;
};

/** "8.9" in English, "8,9" in Portuguese. */
const formatAverage = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    value,
  );

/**
 * The line under the name, such as "Cooked 11× · family 8.9 · you 9". The separator is the
 * same in every language, so the translated parts are joined rather than one long key.
 */
const ratingsLine = (ratings: DishRatings, locale: string): string => {
  if (ratings.timesCooked === 0) return _`New · not cooked yet`;
  const family =
    ratings.familyAverage === null
      ? _`no scores yet`
      : _`family ${formatAverage(ratings.familyAverage, locale)}`;
  // The wireframe shows "you –" until the viewer scores the dish.
  const viewer = _`you ${ratings.viewerScore ?? "–"}`;
  return [_`Cooked ${ratings.timesCooked}×`, family, viewer].join(" · ");
};

/** The emoji at the card's end: 🆕 for a dish nobody has cooked, else the average's band. */
const faceFor = (ratings: DishRatings): string | null => {
  if (ratings.timesCooked === 0) return "🆕";
  return ratings.familyAverage === null ? null : scoreEmoji(ratings.familyAverage);
};

/**
 * One dish on the Dishes page (wireframe 4): photo, name, and the ratings from #22. The
 * whole card is one link to the dish, so it is one tap target and one stop for the keyboard.
 */
export const DishCard = component$<DishCardProps>(({ dish, link }) => {
  const locale = getLocale(SOURCE_LOCALE);
  const { ratings } = dish;
  const face = ratings && faceFor(ratings);
  return (
    <AnyLink link={link} href={dishPath(dish.id)} class="dish-card">
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
        {ratings?.fedUp.map((name) => (
          <span key={name} class="dish-card__fed-up">
            <span aria-hidden="true">🤢 </span>
            {_`${name} is fed up`}
          </span>
        ))}
      </span>
      {face && (
        // The line above says it in words; the emoji only repeats it.
        <span class="dish-card__face" aria-hidden="true">
          {face}
        </span>
      )}
    </AnyLink>
  );
});
