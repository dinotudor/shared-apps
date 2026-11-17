import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { startEmptyDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";

const migratePath = fileURLToPath(new URL("../src/migrate.ts", import.meta.url));

const runMigrate = (env: Record<string, string>) =>
  spawnSync(process.execPath, [migratePath], {
    env: { PATH: process.env.PATH, ...env },
    encoding: "utf8",
    timeout: 30_000,
  });

let database: TestDatabase | undefined;

afterEach(async () => {
  await database?.stop();
  database = undefined;
});

describe("db:migrate", () => {
  it("migrates the database at DATABASE_URL and exits 0", async () => {
    database = await startEmptyDatabase();

    const result = runMigrate({ DATABASE_URL: database.url });

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });

  it("exits 1 naming DATABASE_URL when it is missing", () => {
    const result = runMigrate({});

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("DATABASE_URL");
  });

  it("exits 1 when the database cannot be reached, without printing the URL", () => {
    // Port 1 on localhost: nothing listens there, so the connection is refused.
    const result = runMigrate({ DATABASE_URL: "postgres://app:hunter2@127.0.0.1:1/app" });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("migration failed");
    expect(result.stderr).not.toContain("hunter2");
  });
});
