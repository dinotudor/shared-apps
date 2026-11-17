import { qwikVite } from "@qwik.dev/core/optimizer";
import { defineConfig } from "vitest/config";

// Without qwikRouter: tests import route modules directly and need no route manifest.
export default defineConfig({
  plugins: [qwikVite()],
  test: { include: ["test/**/*.test.ts", "test/**/*.test.tsx"] },
});
