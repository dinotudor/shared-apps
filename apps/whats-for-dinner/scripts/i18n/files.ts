import { existsSync, globSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { LocaleFile, Plural, Translation } from "./check.ts";
import { keysInSource } from "./source-keys.ts";

/** The app's folder. The scripts run from anywhere through `pnpm --filter`. */
export const APP_DIR = resolve(import.meta.dirname, "../..");
export const I18N_DIR = resolve(APP_DIR, "i18n");
export const LOCK_FILE = resolve(APP_DIR, "i18n-lock.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPlural = (value: unknown): value is Plural =>
  isRecord(value) &&
  Object.values(value).every(
    (branch) => typeof branch === "string" || typeof branch === "number" || isPlural(branch),
  );

const isTranslation = (value: unknown): value is Translation =>
  typeof value === "string" || isPlural(value);

/**
 * Checks the parsed contents of i18n/<locale>.json: the locale it names, and that every
 * translation is a string or a plural object. `source` names the file in error messages.
 */
export const parseLocaleFile = (data: unknown, locale: string, source: string): LocaleFile => {
  if (!isRecord(data) || data.locale !== locale || !isRecord(data.translations)) {
    throw new Error(`${source} must have "locale": "${locale}" and a "translations" object`);
  }
  const translations = Object.fromEntries(
    Object.entries(data.translations).map(([key, value]): [string, Translation] => {
      if (!isTranslation(value)) {
        throw new Error(`${source}: ${JSON.stringify(key)} must be a string or a plural object`);
      }
      return [key, value];
    }),
  );
  return {
    locale,
    ...(typeof data.name === "string" ? { name: data.name } : {}),
    ...(typeof data.fallback === "string" ? { fallback: data.fallback } : {}),
    translations,
  };
};

/** Reads i18n/<locale>.json, failing with a clear message if it is missing or malformed. */
export const readLocaleFile = (locale: string): LocaleFile => {
  const path = resolve(I18N_DIR, `${locale}.json`);
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Can't read ${path}. Run pnpm build to create it.`, { cause: error });
  }
  return parseLocaleFile(data, locale, path);
};

/** i18n-lock.json: per locale, the hash of the English text each translation was made from. */
export type Lock = Record<string, Record<string, string>>;

/** Checks the parsed contents of i18n-lock.json. `source` names the file in error messages. */
export const parseLock = (data: unknown, source: string): Lock => {
  if (!isRecord(data)) throw new Error(`${source} must be an object of locales`);
  // Object.fromEntries, not assignment: a key such as "__proto__" stays a plain key.
  return Object.fromEntries(
    Object.entries(data).map(([locale, hashes]): [string, Record<string, string>] => {
      if (!isRecord(hashes)) throw new Error(`${source}: "${locale}" must be an object`);
      return [
        locale,
        Object.fromEntries(
          Object.entries(hashes).map(([key, hash]): [string, string] => {
            if (typeof hash !== "string") {
              throw new Error(
                `${source}: "${locale}" ${JSON.stringify(key)} must be a hash string`,
              );
            }
            return [key, hash];
          }),
        ),
      ];
    }),
  );
};

/** Reads i18n-lock.json, or an empty lock before the first i18n:translate. */
export const readLock = (): Lock => {
  if (!existsSync(LOCK_FILE)) return {};
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(LOCK_FILE, "utf8"));
  } catch (error) {
    throw new Error(`Can't read ${LOCK_FILE}`, { cause: error });
  }
  return parseLock(data, LOCK_FILE);
};

export const writeLock = (lock: Lock): void => {
  writeFileSync(LOCK_FILE, `${JSON.stringify(lock, null, 2)}\n`);
};

/**
 * Writes a locale file the way the Vite plugin does (2-space JSON), plus a final newline.
 * Keys keep their order, so diffs stay small.
 */
export const writeLocaleFile = (file: LocaleFile): void => {
  writeFileSync(resolve(I18N_DIR, `${file.locale}.json`), `${JSON.stringify(file, null, 2)}\n`);
};

/** Every translation key the app's source uses. */
export const keysInAppSource = (): Set<string> => {
  const keys = new Set<string>();
  for (const path of globSync("src/**/*.{ts,tsx}", { cwd: APP_DIR })) {
    for (const key of keysInSource(readFileSync(resolve(APP_DIR, path), "utf8"), path)) {
      keys.add(key);
    }
  }
  return keys;
};
