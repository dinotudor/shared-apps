import { createHash } from "node:crypto";
import { findLocaleProblems } from "./check.ts";
import type { LocaleFile } from "./check.ts";

/** One request to the translation provider: English texts in, translations by key out. */
export type TranslateBatch = (request: {
  locale: string;
  entries: { key: string; english: string }[];
  glossary: string;
}) => Promise<Record<string, string>>;

/** The hash i18n-lock.json keeps, so a key is retranslated only when its English changes. */
export const englishHash = (text: string): string =>
  createHash("sha256").update(text).digest("hex").slice(0, 16);

/** The problems in one answer, by the same rules as i18n:check. */
const answerProblems = (
  locale: string,
  batch: { key: string; english: string }[],
  answer: Record<string, string>,
): string[] =>
  findLocaleProblems(
    // English values are the texts sent, so placeholders are compared with those.
    {
      locale: "en",
      translations: Object.fromEntries(batch.map(({ key, english }) => [key, english])),
    },
    { locale, translations: answer },
  );

/**
 * Translates one batch, asking once more if the first try fails: an answer that breaks a
 * rule, or a call that throws (a refusal, malformed JSON, the network).
 */
const translateBatch = async (
  locale: string,
  entries: { key: string; english: string }[],
  glossary: string,
  translate: TranslateBatch,
): Promise<Record<string, string>> => {
  let problems: string[] = [];
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    let answer: Record<string, string>;
    try {
      answer = await translate({ locale, entries, glossary });
    } catch (error) {
      lastError = error;
      problems = [error instanceof Error ? error.message : String(error)];
      continue;
    }
    lastError = undefined;
    problems = answerProblems(locale, entries, answer);
    if (problems.length === 0) return answer;
  }
  throw new Error(`The translation for ${locale} failed twice:\n  ${problems.join("\n  ")}`, {
    cause: lastError,
  });
};

const DEFAULT_BATCH_SIZE = 40;

export type TranslateResult = {
  file: LocaleFile;
  /** This locale's hashes in i18n-lock.json, for every key English still has. */
  lock: Record<string, string>;
  translated: string[];
  /** Keys a human must translate, such as plurals. */
  skipped: string[];
};

/**
 * Fills one locale's missing or outdated translations (playbook guideline i18n.md,
 * `i18n:translate`). It returns the new file and lock entries and writes nothing, so a
 * failure leaves the locale untouched.
 */
export const translateLocale = async ({
  en,
  target,
  lock,
  translate,
  glossary,
  batchSize = DEFAULT_BATCH_SIZE,
}: {
  en: LocaleFile;
  target: LocaleFile;
  lock: Record<string, string>;
  translate: TranslateBatch;
  glossary: string;
  batchSize?: number;
}): Promise<TranslateResult> => {
  const newLock: Record<string, string> = {};
  const entries: { key: string; english: string }[] = [];
  const skipped: string[] = [];
  for (const [key, value] of Object.entries(en.translations)) {
    // A plural has several English texts and needs a human: the provider gets plain text.
    if (typeof value !== "string") {
      skipped.push(key);
      continue;
    }
    // An empty English value means the key itself is the English text.
    const english = value || key;
    const hash = englishHash(english);
    const hasTranslation =
      Object.hasOwn(target.translations, key) && target.translations[key] !== "";
    // No hash yet means it was written before the lock existed, or by hand: keep it.
    const locked = Object.hasOwn(lock, key) ? lock[key] : undefined;
    const upToDate = hasTranslation && (locked === undefined || locked === hash);
    if (upToDate) newLock[key] = hash;
    else entries.push({ key, english });
  }
  if (entries.length === 0) return { file: target, lock: newLock, translated: [], skipped };

  const translations = { ...target.translations };
  for (let start = 0; start < entries.length; start += batchSize) {
    const batch = entries.slice(start, start + batchSize);
    Object.assign(translations, await translateBatch(target.locale, batch, glossary, translate));
  }
  for (const { key, english } of entries) newLock[key] = englishHash(english);
  return {
    file: { ...target, translations },
    lock: newLock,
    translated: entries.map(({ key }) => key),
    skipped,
  };
};
