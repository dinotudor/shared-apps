import type { Locale } from "./locale.ts";

/** The day as screens show it, such as "quinta-feira, 19 de novembro". */
const DAY: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

/**
 * Formats a date with Intl in the active locale and the app's time zone (TIME_ZONE, brief D1), so
 * an evening meal never shows as the next day. Dates never go in translation strings
 * (playbook guideline i18n.md): pass the result into `_` as a parameter.
 */
export const formatDate = (
  date: Date,
  { locale, timeZone }: { locale: Locale; timeZone: string },
  options: Intl.DateTimeFormatOptions = DAY,
): string => new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
