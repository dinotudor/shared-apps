import { randomUUID } from "node:crypto";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Client } from "pg";
import { createDatabase, migrate } from "./database.ts";
import type { Database } from "./database.ts";

// Keep in step with compose.yaml, so tests run on the version used locally.
const POSTGRES_IMAGE = "postgres:18-alpine";

export type TestDatabase = {
  url: string;
  db: Database;
  /** Closes the connections and drops the database. */
  stop: () => Promise<void>;
};

// One container per test file (Vitest isolates module state per file), and a new
// database in it per call: databases are quick to create, containers are not.
// Testcontainers removes the container when the test process exits.
let container: Promise<StartedPostgreSqlContainer> | undefined;

const adminQuery = async (adminUrl: string, statement: string) => {
  const client = new Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(statement);
  } finally {
    await client.end();
  }
};

/** A new, empty PostgreSQL database that no other test uses. */
export const startEmptyDatabase = async (): Promise<TestDatabase> => {
  container ??= new PostgreSqlContainer(POSTGRES_IMAGE).start();
  const started = await container;
  const adminUrl = started.getConnectionUri();

  // Generated, so safe to put in the statement unquoted.
  const name = `test_${randomUUID().replaceAll("-", "")}`;
  await adminQuery(adminUrl, `create database ${name}`);

  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  const { db, close } = createDatabase(url.href, {
    onError: (error) => {
      console.error("test database connection dropped:", error);
    },
  });

  return {
    url: url.href,
    db,
    stop: async () => {
      await close();
      await adminQuery(adminUrl, `drop database ${name} with (force)`);
    },
  };
};

/** A new database with every migration applied, for repository tests. */
export const startTestDatabase = async (): Promise<TestDatabase> => {
  const database = await startEmptyDatabase();
  await migrate(database.db);
  return database;
};
