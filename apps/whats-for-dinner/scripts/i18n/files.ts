import { globSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { LocaleFile } from "./check.ts";
import { keysInSource } from "./source-keys.ts";

/** The app's folder. The scripts run from anywhere through `pnpm --filter`. */
export const APP_DIR = resolve(import.meta.dirname, "../..");
export const I18N_DIR = resolve(APP_DIR, "i18n");
export const LOCK_FILE = resolve(APP_DIR, "i18n-lock.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Reads i18n/<locale>.json, failing with a clear message if it is missing or malformed. */
export const readLocaleFile = (locale: string): LocaleFile => {
  const path = resolve(I18N_DIR, `${locale}.json`);
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Can't read ${path}. Run pnpm build to create it.`, { cause: error });
  }
  if (!isRecord(data) || data.locale !== locale || !isRecord(data.translations)) {
    throw new Error(`${path} must have "locale": "${locale}" and a "translations" object`);
  }
  return data as LocaleFile;
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
