import { defineConfig } from "vitest/config";

// One run for the whole workspace. Each package keeps its own config, and the
// output labels every test with its package name.
export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*", "modules/*"],
    // The tree reporter reads best locally. CI keeps the default, which prints less.
    reporters: process.env.CI ? ["default"] : ["tree"],
  },
});
