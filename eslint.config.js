import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import { qwikEslint9Plugin } from "eslint-plugin-qwik";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["**/node_modules/", "**/dist/", "**/server/", "**/coverage/", "docs/"] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        // The root vitest.config.ts belongs to no package tsconfig.
        projectService: { allowDefaultProject: ["vitest.config.ts"] },
      },
    },
  },
  {
    // Qwik components: browser globals and the Qwik rules (such as valid-lexical-scope,
    // which catches values that can't be serialized across $ boundaries).
    files: ["**/*.tsx"],
    extends: [qwikEslint9Plugin.configs.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    // Only server code calls the API (playbook ADR 0006): the tRPC client lives in
    // src/server/, and routes reach it from routeLoader$ or routeAction$.
    files: ["apps/web/src/**/*.{ts,tsx}"],
    ignores: ["apps/web/src/server/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@trpc/client",
              message: "Call the API through apiFor() in src/server/api.ts, from server code only.",
            },
          ],
        },
      ],
    },
  },
  {
    // Plain JS files (configs, scripts) are not part of any tsconfig project.
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
