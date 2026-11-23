import { describe, expect, it } from "vitest";
import { parseLocaleFile, parseLock } from "../scripts/i18n/files.ts";

describe("parseLocaleFile", () => {
  it("accepts string translations and plural objects", () => {
    const data = {
      locale: "pt-BR",
      name: "Português",
      translations: { Week: "Semana", "$1 dishes": { 1: "1 prato", "*": "$1 pratos" } },
    };

    expect(parseLocaleFile(data, "pt-BR", "pt-BR.json")).toEqual(data);
  });

  it("rejects a file for another locale", () => {
    expect(() =>
      parseLocaleFile({ locale: "en", translations: {} }, "pt-BR", "pt-BR.json"),
    ).toThrow('pt-BR.json must have "locale": "pt-BR"');
  });

  it("rejects a translation that is neither a string nor a plural object", () => {
    const data = { locale: "pt-BR", translations: { Week: 7 } };

    expect(() => parseLocaleFile(data, "pt-BR", "pt-BR.json")).toThrow(
      'pt-BR.json: "Week" must be a string or a plural object',
    );
  });

  it("rejects a plural with a branch that is not text, a number or a plural", () => {
    const data = { locale: "pt-BR", translations: { "$1 dishes": { "*": ["pratos"] } } };

    expect(() => parseLocaleFile(data, "pt-BR", "pt-BR.json")).toThrow(
      '"$1 dishes" must be a string or a plural object',
    );
  });
});

describe("parseLock", () => {
  it("accepts a hash per key per locale", () => {
    const data = { "pt-BR": { Week: "0123456789abcdef" } };

    expect(parseLock(data, "i18n-lock.json")).toEqual(data);
  });

  it("rejects a hash that is not a string", () => {
    expect(() => parseLock({ "pt-BR": { Week: 1 } }, "i18n-lock.json")).toThrow(
      'i18n-lock.json: "pt-BR" "Week" must be a hash string',
    );
  });

  it("rejects a locale entry that is not an object", () => {
    expect(() => parseLock({ "pt-BR": "x" }, "i18n-lock.json")).toThrow(
      'i18n-lock.json: "pt-BR" must be an object',
    );
  });

  it("keeps a key named __proto__ as a plain key", () => {
    const lock = parseLock(JSON.parse('{"pt-BR": {"__proto__": "abc"}}'), "i18n-lock.json");

    expect(Object.hasOwn(lock["pt-BR"] ?? {}, "__proto__")).toBe(true);
  });
});
