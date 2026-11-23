import { qwikVite } from "@qwik.dev/core/optimizer";
import { qwikRouter } from "@qwik.dev/router/vite";
import { i18nPlugin } from "compiled-i18n/vite";
import { defineConfig } from "vite";
import { DEFAULT_LOCALE, LOCALES } from "./src/i18n/locale.ts";

// Vite starts from src/entry.ssr.tsx (through qwikRouter), not from an index.html.
export default defineConfig({
  // The production client build writes one copy per locale under build/<locale>/, and adds
  // new keys to i18n/*.json (playbook guideline i18n.md).
  plugins: [
    i18nPlugin({ locales: [...LOCALES], defaultLocale: DEFAULT_LOCALE }),
    qwikRouter(),
    qwikVite(),
  ],
  server: {
    // Don't cache server-rendered pages in dev.
    headers: { "Cache-Control": "public, max-age=0" },
  },
  preview: {
    headers: { "Cache-Control": "public, max-age=600" },
  },
});
