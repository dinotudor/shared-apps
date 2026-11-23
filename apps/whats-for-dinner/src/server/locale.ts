import type { RequestEvent } from "@qwik.dev/router";
import { chooseLocale } from "../i18n/locale.ts";

export const LOCALE_COOKIE = "locale";
const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

type LocaleEvent = Pick<RequestEvent, "query" | "cookie" | "request" | "locale">;

/**
 * Sets the locale this request renders in. `?locale=en` is remembered in a cookie, so the
 * choice survives later visits. The page has no language switcher yet.
 */
export const applyLocale = (event: LocaleEvent): void => {
  const { locale, remember } = chooseLocale({
    query: event.query.get("locale"),
    cookie: event.cookie.get(LOCALE_COOKIE)?.value,
    acceptLanguage: event.request.headers.get("accept-language"),
  });
  if (remember) {
    event.cookie.set(LOCALE_COOKIE, locale, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      maxAge: ONE_YEAR_IN_SECONDS,
    });
  }
  event.locale(locale);
};
