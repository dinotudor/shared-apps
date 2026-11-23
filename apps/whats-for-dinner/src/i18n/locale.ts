/** Every UI locale. The Vite plugin, the tests and the i18n scripts all read this list. */
export const LOCALES = ["pt-BR", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** The source language: keys and base copy are English (playbook ADR 0015). */
export const SOURCE_LOCALE: Locale = "en";

/** The family's language (brief 3.6), for requests that don't ask for one we have. */
export const DEFAULT_LOCALE: Locale = "pt-BR";

/**
 * The locale we have for a BCP 47 tag, ignoring case. A tag we don't have exactly falls
 * back to its language, so "pt-PT" gets pt-BR and "en-GB" gets en.
 */
const matchLocale = (tag: string): Locale | undefined => {
  const wanted = tag.trim().toLowerCase();
  const language = wanted.split("-")[0];
  return (
    LOCALES.find((locale) => locale.toLowerCase() === wanted) ??
    LOCALES.find((locale) => locale.toLowerCase().split("-")[0] === language)
  );
};

/** Accept-Language's tags, most wanted first. */
const preferredTags = (header: string): string[] =>
  header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.split(";");
      const q = params.map((param) => /^\s*q=([\d.]+)\s*$/.exec(param)?.[1]).find(Boolean);
      return { tag, q: q === undefined ? 1 : Number(q), index };
    })
    .filter(({ tag, q }) => tag.trim() !== "" && q > 0)
    // Equal weights keep the header's order.
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map(({ tag }) => tag);

type LocaleRequest = {
  /** `?locale=`: a choice to remember in a cookie. */
  query?: string | null;
  /** The remembered choice. */
  cookie?: string | null;
  acceptLanguage?: string | null;
};

/**
 * The locale for a request: an explicit `?locale=`, then the remembered one, then the
 * browser's languages, then the family's. `remember` says the choice should be stored.
 */
export const chooseLocale = ({
  query,
  cookie,
  acceptLanguage,
}: LocaleRequest): { locale: Locale; remember: boolean } => {
  const chosen = query ? matchLocale(query) : undefined;
  if (chosen) return { locale: chosen, remember: true };
  const remembered = cookie ? matchLocale(cookie) : undefined;
  if (remembered) return { locale: remembered, remember: false };
  const fromHeader = acceptLanguage
    ? preferredTags(acceptLanguage).map(matchLocale).find(Boolean)
    : undefined;
  return { locale: fromHeader ?? DEFAULT_LOCALE, remember: false };
};
