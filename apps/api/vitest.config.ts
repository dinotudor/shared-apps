import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // test/migrate.test.ts starts a PostgreSQL container (packages/db/src/testing.ts),
    // which takes a while the first time, when the image is not cached yet.
    hookTimeout: 120_000,
    testTimeout: 120_000,
  },
});
