import { qwikVite } from "@qwik.dev/core/optimizer";
import { qwikRouter } from "@qwik.dev/router/vite";
import { defineConfig } from "vite";

// Vite starts from src/entry.ssr.tsx (through qwikRouter), not from an index.html.
export default defineConfig({
  plugins: [qwikRouter(), qwikVite()],
  server: {
    // Don't cache server-rendered pages in dev.
    headers: { "Cache-Control": "public, max-age=0" },
  },
  preview: {
    headers: { "Cache-Control": "public, max-age=600" },
  },
});
