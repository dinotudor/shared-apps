import { qwikVite } from "@qwik.dev/core/optimizer";
import { i18nPlugin } from "compiled-i18n/vite";
import { defineConfig } from "vitest/config";
import { DEFAULT_LOCALE, LOCALES } from "./src/i18n/locale.ts";

// Without qwikRouter: tests import route modules directly and need no route manifest.
// The i18n plugin provides the modules `_` reads; outside a production build it translates
// at runtime and writes nothing.
export default defineConfig({
  plugins: [i18nPlugin({ locales: [...LOCALES], defaultLocale: DEFAULT_LOCALE }), qwikVite()],
  test: {
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    setupFiles: ["test/setup-locale.ts"],
  },
});
