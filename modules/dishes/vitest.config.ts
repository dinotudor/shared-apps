import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The first test in a file starts a PostgreSQL container, which can take a while
    // when the image is not cached yet.
    hookTimeout: 120_000,
    testTimeout: 120_000,
  },
});
