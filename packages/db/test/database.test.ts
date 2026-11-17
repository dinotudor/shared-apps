import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    const { db, close } = createDatabase(database.url, { onError: vi.fn() });

    const result = await db.execute<{ answer: number }>(sql`select 42 as answer`);
    await close();

    expect(result.rows).toEqual([{ answer: 42 }]);
  });

  it("refuses queries after close", async () => {
    database = await startTestDatabase();
    const { db, close } = createDatabase(database.url, { onError: vi.fn() });

    await close();

    await expect(db.execute(sql`select 1`)).rejects.toThrow();
  });

  it("can be closed more than once, so shutdown and tests don't trip over each other", async () => {
    database = await startTestDatabase();
    const { close } = createDatabase(database.url, { onError: vi.fn() });
    await close();

    await expect(close()).resolves.toBeUndefined();
  });

  it("reports an idle connection dropped by the server, instead of crashing the process", async () => {
    database = await startTestDatabase();
    const onError = vi.fn<(error: Error) => void>();
    const { db, close } = createDatabase(database.url, { onError });
    // Leaves one idle connection in the pool.
    await db.execute(sql`select 1`);

    // What a database restart does to that connection.
    await database.db.execute(
      sql`select pg_terminate_backend(pid) from pg_stat_activity
          where datname = current_database() and pid <> pg_backend_pid()`,
    );

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledOnce();
    });
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    // The pool replaces the lost connection; later queries still work.
    await expect(db.execute(sql`select 1`)).resolves.toBeDefined();
    await close();
  });

  it("still rejects a failing query rather than reporting it as a pool error", async () => {
    database = await startTestDatabase();
    const onError = vi.fn<(error: Error) => void>();
    const { db, close } = createDatabase(database.url, { onError });

    await expect(db.execute(sql`select * from missing_table`)).rejects.toThrow();
    await close();

    expect(onError).not.toHaveBeenCalled();
  });
});
