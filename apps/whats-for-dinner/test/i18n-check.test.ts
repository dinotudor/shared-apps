import { describe, expect, it } from "vitest";
import { findLocaleProblems, findSourceProblems } from "../scripts/i18n/check.ts";
import type { LocaleFile } from "../scripts/i18n/check.ts";

const en = (translations: LocaleFile["translations"]): LocaleFile => ({
  locale: "en",
  translations,
});
const pt = (translations: LocaleFile["translations"]): LocaleFile => ({
  locale: "pt-BR",
  translations,
});

describe("findLocaleProblems", () => {
  it("accepts a locale that translates every English key", () => {
    expect(
      findLocaleProblems(en({ Week: "", Dishes: "" }), pt({ Week: "Semana", Dishes: "Pratos" })),
    ).toEqual([]);
  });

  it("reports a key missing from the locale", () => {
    expect(findLocaleProblems(en({ Week: "", Dishes: "" }), pt({ Week: "Semana" }))).toEqual([
      'pt-BR: missing "Dishes"',
    ]);
  });

  it("reports an empty translation as missing, since it would silently show English", () => {
    expect(findLocaleProblems(en({ Week: "" }), pt({ Week: "" }))).toEqual([
      'pt-BR: missing "Week"',
    ]);
  });

  it("reports a key that English doesn't have as unused", () => {
    expect(findLocaleProblems(en({ Week: "" }), pt({ Week: "Semana", Old: "Velho" }))).toEqual([
      'pt-BR: unused "Old"',
    ]);
  });

  it("reports placeholders that differ from the English", () => {
    expect(
      findLocaleProblems(
        en({ "Hello $1, you have $2 dishes": "" }),
        pt({ "Hello $1, you have $2 dishes": "Olá $1, você tem pratos" }),
      ),
    ).toEqual(['pt-BR: placeholders in "Hello $1, you have $2 dishes" are $1, expected $1 $2']);
  });

  it("compares placeholders with the English value when there is one, as for a named key", () => {
    expect(
      findLocaleProblems(en({ countTitle: "$1 dishes" }), pt({ countTitle: "$1 pratos" })),
    ).toEqual([]);
  });

  it("treats $$ as a literal dollar sign, not a placeholder", () => {
    expect(findLocaleProblems(en({ "Costs $$5": "" }), pt({ "Costs $$5": "Custa $$5" }))).toEqual(
      [],
    );
  });

  describe("plurals", () => {
    const key = "Added $1 dishes";

    it("accepts a plural with a * fallback and the same placeholders in every branch", () => {
      const plural = { "1": "$1 prato adicionado", "*": "$1 pratos adicionados" };
      expect(findLocaleProblems(en({ [key]: "" }), pt({ [key]: plural }))).toEqual([]);
    });

    it("reports a plural without a * fallback", () => {
      const plural = { "1": "$1 prato adicionado" };
      expect(findLocaleProblems(en({ [key]: "" }), pt({ [key]: plural }))).toEqual([
        'pt-BR: plural "Added $1 dishes" has no "*" fallback',
      ]);
    });

    it("reports branches with different placeholders", () => {
      const plural = { "1": "Um prato adicionado", "*": "$1 pratos adicionados" };
      expect(findLocaleProblems(en({ [key]: "" }), pt({ [key]: plural }))).toEqual([
        'pt-BR: plural "Added $1 dishes" has different placeholders per branch',
      ]);
    });

    it("compares the branches' placeholders with the English", () => {
      const plural = { "1": "Um prato", "*": "Pratos" };
      expect(findLocaleProblems(en({ [key]: "" }), pt({ [key]: plural }))).toEqual([
        'pt-BR: placeholders in "Added $1 dishes" are none, expected $1',
      ]);
    });
  });
});

describe("findSourceProblems", () => {
  it("accepts an en.json with exactly the keys the code uses", () => {
    expect(findSourceProblems(new Set(["Week"]), en({ Week: "" }))).toEqual([]);
  });

  it("reports a key the code uses that en.json lacks, so the build was not run or committed", () => {
    expect(findSourceProblems(new Set(["Week", "Dishes"]), en({ Week: "" }))).toEqual([
      'en: missing "Dishes" (run pnpm build to add it)',
    ]);
  });

  it("reports an en.json key no code uses, for a human to delete", () => {
    expect(findSourceProblems(new Set(["Week"]), en({ Week: "", Old: "" }))).toEqual([
      'en: unused "Old"',
    ]);
  });
});
