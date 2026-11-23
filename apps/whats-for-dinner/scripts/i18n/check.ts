export type Plural = { [tag: string]: string | number | Plural };
export type Translation = string | Plural;
export type LocaleFile = {
  locale: string;
  name?: string;
  fallback?: string;
  translations: Record<string, Translation>;
};

const quote = (key: string): string => JSON.stringify(key);

// Keys are user text, so look them up with Object.hasOwn: `in` also finds inherited
// properties such as "constructor".

/** The `$1`…`$9` placeholders in a string, sorted and once each. `$$` is a literal `$`. */
export const placeholders = (text: string): string[] => {
  const found = new Set<string>();
  for (const [, token] of text.matchAll(/\$(\$|[1-9])/g)) {
    if (token !== "$") found.add(`$${token}`);
  }
  return [...found].sort();
};

const describe = (list: string[]): string => (list.length ? list.join(" ") : "none");

const onlyFirst = <T>(value: T, index: number, list: T[]): boolean => list.indexOf(value) === index;

/** Every text in a plural, nested plurals included. A number only points to another branch. */
const pluralBranches = (plural: Plural): string[] =>
  Object.values(plural).flatMap((branch) => {
    if (typeof branch === "number") return [];
    return typeof branch === "string" ? [branch] : pluralBranches(branch);
  });

/**
 * What is wrong with one translated locale, compared with en.json (playbook guideline
 * i18n.md, `i18n:check`). An empty list means it is complete.
 */
export const findLocaleProblems = (en: LocaleFile, target: LocaleFile): string[] => {
  const problems: string[] = [];
  const report = (problem: string) => problems.push(`${target.locale}: ${problem}`);
  for (const key of Object.keys(en.translations)) {
    const translation = Object.hasOwn(target.translations, key)
      ? target.translations[key]
      : undefined;
    // The plugin adds new keys as "", and "" renders the English key without a warning.
    if (translation === undefined || translation === "") {
      report(`missing ${quote(key)}`);
      continue;
    }
    let actual: string[];
    if (typeof translation === "string") {
      actual = placeholders(translation);
    } else {
      if (!Object.hasOwn(translation, "*")) report(`plural ${quote(key)} has no "*" fallback`);
      const branches = new Set(
        pluralBranches(translation).map((text) => describe(placeholders(text))),
      );
      if (branches.size > 1) {
        report(`plural ${quote(key)} has different placeholders per branch`);
        continue;
      }
      actual = pluralBranches(translation).flatMap(placeholders).filter(onlyFirst);
    }
    // An empty English value means the key itself is the English text. An English plural
    // is checked through its own branches only.
    const english = en.translations[key] || key;
    if (typeof english !== "string") continue;
    const expected = placeholders(english);
    if (describe(actual) !== describe(expected)) {
      report(
        `placeholders in ${quote(key)} are ${describe(actual)}, expected ${describe(expected)}`,
      );
    }
  }
  for (const key of Object.keys(target.translations)) {
    if (!Object.hasOwn(en.translations, key)) report(`unused ${quote(key)}`);
  }
  return problems;
};

/**
 * Compares en.json with the keys the code uses (keysInSource). The plugin only adds keys
 * during a production build and never fails on unused ones, so this catches both.
 */
export const findSourceProblems = (used: Set<string>, en: LocaleFile): string[] => [
  ...[...used]
    .filter((key) => !Object.hasOwn(en.translations, key))
    .map((key) => `en: missing ${quote(key)} (run pnpm build to add it)`),
  ...Object.keys(en.translations)
    .filter((key) => !used.has(key))
    .map((key) => `en: unused ${quote(key)}`),
];

/**
 * A named key is an identifier, not English text: lowerCamelCase (`countTitle`) or two
 * words joined by a hyphen to tell identical English apart (`Right-direction`), as in the
 * playbook guideline. Plain keys, even one word or a component name, are the English.
 */
export const isNamedKey = (key: string): boolean =>
  /^[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*$/.test(key) || /^[A-Za-z]+-[A-Za-z]+$/.test(key);

/**
 * What is wrong with en.json on its own. An empty value falls back to the key, which is
 * right for English text but renders a named key's identifier.
 */
export const findEnglishProblems = (en: LocaleFile): string[] =>
  Object.entries(en.translations)
    .filter(([key, value]) => value === "" && isNamedKey(key))
    .map(([key]) => `en: named key ${quote(key)} needs its English text`);
