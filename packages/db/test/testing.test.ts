import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "../src/index.ts";
import { startTestDatabase } from "../src/testing.ts";
import type { TestDatabase } from "../src/testing.ts";

const started: TestDatabase[] = [];

const start = async () => {
  const database = await startTestDatabase();
  started.push(database);
  return database;
};

afterEach(async () => {
  await Promise.all(started.splice(0).map((database) => database.stop()));
});

describe("startTestDatabase", () => {
  it("gives each caller its own database", async () => {
    const first = await start();
    const second = await start();

    await first.db.execute(sql`create table note (body text)`);

    const tables = await second.db.execute(
      sql`select 1 from information_schema.tables where table_name = 'note'`,
    );
    expect(tables.rows).toEqual([]);
  });

  it("drops the database on stop, so nothing can connect to it afterwards", async () => {
    const database = await startTestDatabase();
    await database.stop();

    const { db, close } = createDatabase(database.url);
    try {
      // Drizzle wraps the driver error; its cause is PostgreSQL's "database does not exist".
      await expect(db.execute(sql`select 1`)).rejects.toMatchObject({
        cause: { code: "3D000" },
      });
    } finally {
      await close();
    }
  });
});
