import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate as applyMigrations } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export type Database = NodePgDatabase;

export type DatabaseHandle = {
  db: Database;
  /** Ends the connection pool. Later calls do nothing. */
  close: () => Promise<void>;
};

// The one migration history (playbook ADR 0007), shipped with this package so
// callers never pass a path.
const MIGRATIONS_FOLDER = fileURLToPath(new URL("../migrations", import.meta.url));

export const createDatabase = (url: string): DatabaseHandle => {
  const pool = new Pool({ connectionString: url });
  // pg rejects a second end(); keep the first one so every caller can await it.
  let ending: Promise<void> | undefined;
  return {
    db: drizzle({ client: pool }),
    close: () => (ending ??= pool.end()),
  };
};

/** Applies every migration not applied yet, in order. Safe to run again. */
export const migrate = async (db: Database): Promise<void> => {
  await applyMigrations(db, { migrationsFolder: MIGRATIONS_FOLDER });
};
