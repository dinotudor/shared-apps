import { describe, expect, it, vi } from "vitest";
import type { LocaleFile } from "../scripts/i18n/check.ts";
import { englishHash, translateLocale } from "../scripts/i18n/translate.ts";
import type { TranslateBatch } from "../scripts/i18n/translate.ts";

const en = (translations: LocaleFile["translations"]): LocaleFile => ({
  locale: "en",
  translations,
});
const pt = (translations: LocaleFile["translations"]): LocaleFile => ({
  locale: "pt-BR",
  translations,
});

/** A fake LLM that knows a few words, and records what it was asked. */
const dictionary = (words: Record<string, string>) =>
  vi.fn<TranslateBatch>(({ entries }) =>
    Promise.resolve(Object.fromEntries(entries.map(({ key }) => [key, words[key] ?? ""]))),
  );

describe("translateLocale", () => {
  it("translates a missing key and records the hash of its English text", async () => {
    const translate = dictionary({ Week: "Semana" });

    const result = await translateLocale({
      en: en({ Week: "" }),
      target: pt({}),
      lock: {},
      translate,
      glossary: "",
    });

    expect(result.file.translations).toEqual({ Week: "Semana" });
    expect(result.lock).toEqual({ Week: englishHash("Week") });
    expect(result.translated).toEqual(["Week"]);
  });

  it("leaves alone a translation whose English hasn't changed", async () => {
    const translate = dictionary({});

    const result = await translateLocale({
      en: en({ Week: "" }),
      target: pt({ Week: "Semaninha" }),
      lock: { Week: englishHash("Week") },
      translate,
      glossary: "",
    });

    expect(translate).not.toHaveBeenCalled();
    expect(result.file.translations).toEqual({ Week: "Semaninha" });
    expect(result.translated).toEqual([]);
  });

  it("adopts a translation that has no hash yet, such as one written by hand", async () => {
    const translate = dictionary({});

    const result = await translateLocale({
      en: en({ Week: "" }),
      target: pt({ Week: "Semana" }),
      lock: {},
      translate,
      glossary: "",
    });

    expect(translate).not.toHaveBeenCalled();
    expect(result.lock).toEqual({ Week: englishHash("Week") });
  });

  it("retranslates a key whose English text changed", async () => {
    const translate = dictionary({ countTitle: "Pratos da semana" });

    const result = await translateLocale({
      en: en({ countTitle: "This week's dishes" }),
      target: pt({ countTitle: "Pratos" }),
      lock: { countTitle: englishHash("Dishes") },
      translate,
      glossary: "",
    });

    expect(translate).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ entries: [{ key: "countTitle", english: "This week's dishes" }] }),
    );
    expect(result.file.translations).toEqual({ countTitle: "Pratos da semana" });
    expect(result.lock).toEqual({ countTitle: englishHash("This week's dishes") });
  });

  it("drops lock entries for keys English no longer has", async () => {
    const result = await translateLocale({
      en: en({ Week: "" }),
      target: pt({ Week: "Semana" }),
      lock: { Week: englishHash("Week"), Old: "abc" },
      translate: dictionary({}),
      glossary: "",
    });

    expect(result.lock).toEqual({ Week: englishHash("Week") });
  });

  describe("checking the answer", () => {
    const options = { en: en({ "Hello $1": "" }), target: pt({}), lock: {}, glossary: "" };

    it("asks again once when the answer breaks a placeholder", async () => {
      const translate = vi
        .fn<TranslateBatch>()
        .mockResolvedValueOnce({ "Hello $1": "Olá" })
        .mockResolvedValueOnce({ "Hello $1": "Olá $1" });

      const result = await translateLocale({ ...options, translate });

      expect(translate).toHaveBeenCalledTimes(2);
      expect(result.file.translations).toEqual({ "Hello $1": "Olá $1" });
    });

    it("fails, so nothing is written, when the second answer is wrong too", async () => {
      const translate = vi.fn<TranslateBatch>().mockResolvedValue({ "Hello $1": "" });

      await expect(translateLocale({ ...options, translate })).rejects.toThrow(
        'pt-BR: missing "Hello $1"',
      );
      expect(translate).toHaveBeenCalledTimes(2);
    });

    it("asks again once when the provider call fails", async () => {
      const translate = vi
        .fn<TranslateBatch>()
        .mockRejectedValueOnce(new Error("stopped with refusal"))
        .mockResolvedValueOnce({ "Hello $1": "Olá $1" });

      const result = await translateLocale({ ...options, translate });

      expect(translate).toHaveBeenCalledTimes(2);
      expect(result.file.translations).toEqual({ "Hello $1": "Olá $1" });
    });

    it("fails with the provider's error when the second call fails too", async () => {
      const translate = vi.fn<TranslateBatch>().mockRejectedValue(new Error("network down"));

      await expect(translateLocale({ ...options, translate })).rejects.toThrow("network down");
      expect(translate).toHaveBeenCalledTimes(2);
    });

    it("rejects keys that weren't asked for", async () => {
      const translate = vi
        .fn<TranslateBatch>()
        .mockResolvedValue({ "Hello $1": "Olá $1", Extra: "x" });

      await expect(translateLocale({ ...options, translate })).rejects.toThrow('unused "Extra"');
    });
  });

  it("sends the keys in batches", async () => {
    const words = { A: "a", B: "b", C: "c" };
    const translate = dictionary(words);

    await translateLocale({
      en: en({ A: "", B: "", C: "" }),
      target: pt({}),
      lock: {},
      translate,
      glossary: "",
      batchSize: 2,
    });

    expect(translate.mock.calls.map(([request]) => request.entries.map(({ key }) => key))).toEqual([
      ["A", "B"],
      ["C"],
    ]);
  });

  it("leaves a plural for a human and reports it as skipped", async () => {
    const translate = dictionary({ Week: "Semana" });

    const result = await translateLocale({
      en: en({ Week: "", "Added $1 dishes": { "1": "Added one dish", "*": "Added $1 dishes" } }),
      target: pt({}),
      lock: {},
      translate,
      glossary: "",
    });

    expect(translate).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ entries: [{ key: "Week", english: "Week" }] }),
    );
    expect(result.skipped).toEqual(["Added $1 dishes"]);
    expect(result.lock).toEqual({ Week: englishHash("Week") });
  });
});
