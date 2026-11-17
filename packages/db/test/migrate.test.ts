import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { migrate } from "../src/index.ts";
import type { Database } from "../src/index.ts";
import { startEmptyDatabase } from "../src/testing.ts";
import type { TestDatabase } from "../src/testing.ts";

const journal = JSON.parse(
  await readFile(new URL("../migrations/meta/_journal.json", import.meta.url), "utf8"),
) as { entries: unknown[] };

// Drizzle records each applied migration here.
const appliedCount = async (db: Database) => {
  const result = await db.execute<{ count: number }>(
    sql`select count(*)::int as count from drizzle.__drizzle_migrations`,
  );
  return result.rows[0]?.count;
};

let database: TestDatabase | undefined;

afterEach(async () => {
  await database?.stop();
  database = undefined;
});

describe("migrate", () => {
  it("applies every committed migration to an empty database", async () => {
    database = await startEmptyDatabase();

    await migrate(database.db);

    expect(await appliedCount(database.db)).toBe(journal.entries.length);
  });

  it("changes nothing when run again", async () => {
    database = await startEmptyDatabase();
    await migrate(database.db);

    await migrate(database.db);

    expect(await appliedCount(database.db)).toBe(journal.entries.length);
  });

  // docs/adr/0002: each module keeps its tables in its own PostgreSQL schema.
  it("creates no tables in the public schema", async () => {
    database = await startEmptyDatabase();

    await migrate(database.db);

    const tables = await database.db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'public'`,
    );
    expect(tables.rows).toEqual([]);
  });
});
