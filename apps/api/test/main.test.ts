import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const mainPath = fileURLToPath(new URL("../src/main.ts", import.meta.url));

describe("api process", () => {
  it("exits with an error naming the variable when the environment is invalid", () => {
    const result = spawnSync(process.execPath, [mainPath], {
      env: { PATH: process.env.PATH, PORT: "abc" },
      encoding: "utf8",
      // If config were not validated, the server would start and never exit.
      timeout: 10_000,
    });

    expect(result.signal).toBeNull();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("PORT");
  });
});
