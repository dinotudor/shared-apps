import { describe, expect, it } from "vitest";
import { chooseLocale } from "../src/i18n/locale.ts";

describe("chooseLocale", () => {
  it("uses pt-BR, the members' language, when the request says nothing", () => {
    expect(chooseLocale({})).toEqual({ locale: "pt-BR", remember: false });
  });
});

describe("chooseLocale from Accept-Language", () => {
  it.each([
    ["en-US,en;q=0.9", "en"],
    ["pt-BR,pt;q=0.9,en;q=0.8", "pt-BR"],
    ["pt-br", "pt-BR"],
    ["pt-PT", "pt-BR"],
    ["fr-FR,fr;q=0.9,en;q=0.5", "en"],
    ["en;q=0.4,pt;q=0.8", "pt-BR"],
    ["de", "pt-BR"],
  ])("picks %j as %s", (acceptLanguage, locale) => {
    expect(chooseLocale({ acceptLanguage })).toEqual({ locale, remember: false });
  });
});

describe("chooseLocale from an explicit choice", () => {
  it("prefers the cookie over Accept-Language", () => {
    expect(chooseLocale({ cookie: "en", acceptLanguage: "pt-BR" })).toEqual({
      locale: "en",
      remember: false,
    });
  });

  it("prefers ?locale= over the cookie, and asks to remember it", () => {
    expect(chooseLocale({ query: "pt-BR", cookie: "en" })).toEqual({
      locale: "pt-BR",
      remember: true,
    });
  });

  it("ignores a ?locale= or cookie it doesn't know", () => {
    expect(chooseLocale({ query: "xx", cookie: "yy", acceptLanguage: "en" })).toEqual({
      locale: "en",
      remember: false,
    });
  });
});
