// pnpm i18n:check: validates i18n/*.json against the code and en.json (playbook guideline
// i18n.md). Run it after `pnpm build`, which adds new keys. Exits 1 on any problem.
import { LOCALES } from "../src/i18n/locale.ts";
import { findLocaleProblems, findSourceProblems } from "./i18n/check.ts";
import { keysInAppSource, readLocaleFile } from "./i18n/files.ts";

const SOURCE_LOCALE = "en";

const problems: string[] = [];
try {
  const en = readLocaleFile(SOURCE_LOCALE);
  problems.push(...findSourceProblems(keysInAppSource(), en));
  for (const locale of LOCALES) {
    if (locale !== SOURCE_LOCALE) problems.push(...findLocaleProblems(en, readLocaleFile(locale)));
  }
} catch (error) {
  problems.push(error instanceof Error ? error.message : String(error));
}

if (problems.length) {
  console.error(`i18n:check found ${String(problems.length)} problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error("Fix the files, or run pnpm i18n:translate for missing translations.");
  process.exit(1);
}
console.info(`i18n:check: ${LOCALES.join(", ")} are complete.`);
