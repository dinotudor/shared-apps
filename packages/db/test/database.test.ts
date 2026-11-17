import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "../src/index.ts";
import { startTestDatabase } from "../src/testing.ts";
import type { TestDatabase } from "../src/testing.ts";

let database: TestDatabase | undefined;

afterEach(async () => {
  await database?.stop();
  database = undefined;
});

describe("createDatabase", () => {
  it("runs queries against the database at the URL", async () => {
    database = await startTestDatabase();
    const { db, close } = createDatabase(database.url);

    const result = await db.execute<{ answer: number }>(sql`select 42 as answer`);
    await close();

    expect(result.rows).toEqual([{ answer: 42 }]);
  });

  it("refuses queries after close", async () => {
    database = await startTestDatabase();
    const { db, close } = createDatabase(database.url);

    await close();

    await expect(db.execute(sql`select 1`)).rejects.toThrow();
  });

  it("can be closed more than once, so shutdown and tests don't trip over each other", async () => {
    database = await startTestDatabase();
    const { close } = createDatabase(database.url);
    await close();

    await expect(close()).resolves.toBeUndefined();
  });
});
