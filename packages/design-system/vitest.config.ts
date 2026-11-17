import { qwikVite } from "@qwik.dev/core/optimizer";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [qwikVite()],
  test: { include: ["test/**/*.test.tsx", "test/**/*.test.ts"] },
});
