import { describe, expect, it, vi } from "vitest";
import type { RequestEvent } from "@qwik.dev/router";
import { applyLocale, LOCALE_COOKIE } from "../src/server/locale.ts";
import { fakeCookie } from "./fake-cookie.ts";

// Only the parts of the request event applyLocale uses.
const eventFor = (
  url: string,
  { cookie, acceptLanguage }: { cookie?: string; acceptLanguage?: string } = {},
) => {
  const jar = fakeCookie();
  const locale = vi.fn();
  const event = {
    query: new URL(url, "http://app.test").searchParams,
    cookie: {
      ...jar.event.cookie,
      get: (name: string) => (name === LOCALE_COOKIE && cookie ? { value: cookie } : null),
    },
    request: new Request("http://app.test/", {
      headers: acceptLanguage ? { "accept-language": acceptLanguage } : {},
    }),
    locale,
  } as unknown as RequestEvent;
  return { event, locale, set: jar.set };
};

describe("applyLocale", () => {
  it("renders in the browser's language without storing anything", () => {
    const { event, locale, set } = eventFor("/", { acceptLanguage: "en-US" });

    applyLocale(event);

    expect(locale).toHaveBeenCalledExactlyOnceWith("en");
    expect(set).not.toHaveBeenCalled();
  });

  it("remembers ?locale= in a cookie for later visits", () => {
    const { event, locale, set } = eventFor("/?locale=en", { acceptLanguage: "pt-BR" });

    applyLocale(event);

    expect(locale).toHaveBeenCalledExactlyOnceWith("en");
    expect(set).toHaveBeenCalledExactlyOnceWith(
      LOCALE_COOKIE,
      "en",
      expect.objectContaining({ path: "/", sameSite: "lax" }),
    );
  });

  it("keeps the remembered choice", () => {
    const { event, locale } = eventFor("/", { cookie: "en", acceptLanguage: "pt-BR" });

    applyLocale(event);

    expect(locale).toHaveBeenCalledExactlyOnceWith("en");
  });
});
