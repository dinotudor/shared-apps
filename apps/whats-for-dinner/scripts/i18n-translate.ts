// pnpm i18n:translate: fills missing or outdated translations with an LLM (playbook
// guideline i18n.md). Run `pnpm build` first so en.json has every key. It writes the
// locale files and i18n-lock.json and never commits: review the diff in a PR.
//
// Needs TRANSLATE_API_KEY only when something has to be translated. TRANSLATE_MODEL
// defaults to the provider's model. Never run it in the deploy pipeline.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LOCALES } from "../src/i18n/locale.ts";
import { claudeTranslator, DEFAULT_MODEL } from "./i18n/claude.ts";
import { APP_DIR, readLocaleFile, readLock, writeLocaleFile, writeLock } from "./i18n/files.ts";
import { translateLocale } from "./i18n/translate.ts";
import type { TranslateBatch } from "./i18n/translate.ts";

const SOURCE_LOCALE = "en";
const GLOSSARY = resolve(APP_DIR, "../../GLOSSARY.md");

// Created on first use, so a run with nothing to translate needs no API key.
let provider: TranslateBatch | undefined;
const translate: TranslateBatch = (request) => {
  if (!provider) {
    const apiKey = process.env.TRANSLATE_API_KEY;
    if (!apiKey) throw new Error("TRANSLATE_API_KEY is not set (see .env.example)");
    provider = claudeTranslator({ apiKey, model: process.env.TRANSLATE_MODEL || DEFAULT_MODEL });
  }
  return provider(request);
};

const en = readLocaleFile(SOURCE_LOCALE);
const glossary = existsSync(GLOSSARY) ? readFileSync(GLOSSARY, "utf8") : "";
const lock = readLock();
let failed = false;

for (const locale of LOCALES) {
  if (locale === SOURCE_LOCALE) continue;
  try {
    const result = await translateLocale({
      en,
      target: readLocaleFile(locale),
      lock: lock[locale] ?? {},
      translate,
      glossary,
    });
    writeLocaleFile(result.file);
    lock[locale] = result.lock;
    console.info(
      `${locale}: ${String(result.translated.length)} translated, ${String(result.skipped.length)} skipped` +
        (result.skipped.length
          ? ` (translate by hand: ${result.skipped.map((key) => JSON.stringify(key)).join(", ")})`
          : ""),
    );
  } catch (error) {
    // Nothing is written for this locale; the others go on.
    failed = true;
    console.error(
      `${locale}: not written. ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

writeLock(lock);
if (failed) process.exit(1);
console.info("Now run pnpm i18n:check and review the diff.");
