// Our own types for compiled-i18n's main entry, mapped in through `paths` in tsconfig.json.
// The package declares `_` with types that collapse to `any` under skipLibCheck, so
// typecheck and lint would not catch misuse (playbook ADR 0015). Declare only what the
// app uses, and check the real signature when upgrading the package.

/**
 * Translates English text: `` _`Hello ${name}!` `` looks up the key "Hello $1!" in the
 * active locale and falls back to the English. Only the tagged form is extracted and
 * inlined by the Vite plugin, so calling `_` as a function is not allowed here.
 */
export declare const _: (strings: TemplateStringsArray, ...params: unknown[]) => string;

/** Sets the locale used outside SSR when the page has no `lang`. Dev and tests only. */
export declare const setDefaultLocale: (locale: string) => void;
