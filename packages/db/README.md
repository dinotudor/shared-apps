# @shared-apps/db

The database connection, the one migration history and disposable test databases. Modules use it from their `repository.ts` and tests. See [ADR 0002](../../docs/adr/0002-one-postgresql-schema-per-module.md).

## Interface

```ts
import { createDatabase, migrate } from "@shared-apps/db";
import type { Database, DatabaseHandle } from "@shared-apps/db";

const { db, close } = createDatabase(url); // pg Pool + Drizzle. Connects on first query.
await migrate(db); // applies every pending migration. Safe to run again.
await close(); // ends the pool. Later calls do nothing.
```

`apps/api` creates the one handle at startup and closes it on shutdown. Modules receive `db` and never read `DATABASE_URL`.

### Tests

```ts
import { startTestDatabase } from "@shared-apps/db/testing";

const database = await startTestDatabase(); // { url, db, stop }: a new, migrated database
// ...
await database.stop(); // closes its connections and drops it
```

Each call creates a new database inside one PostgreSQL container per test file, so tests don't share state. It needs Docker running. `startEmptyDatabase()` is the same without migrations, for migration tests. Test files that use it need a longer timeout for the first container start. See `vitest.config.ts`.

## Adding tables to a module

1. In `modules/<name>/src/schema.ts`, declare the module's PostgreSQL schema, **export it**, and add tables to it:

   ```ts
   import { pgSchema, text, uuid } from "drizzle-orm/pg-core";

   export const dishes = pgSchema("dishes");
   export const dish = dishes.table("dish", {
     id: uuid().primaryKey().defaultRandom(),
     name: text().notNull(),
   });
   ```

   Without the `export`, drizzle-kit leaves out `CREATE SCHEMA` and the migration fails. No table goes in `public`, and a test fails if one does.

2. Generate the migration, and review the SQL before committing it:

   ```sh
   pnpm db:generate
   ```

3. Apply it locally (`docker compose up -d --wait` first):

   ```sh
   pnpm db:migrate
   ```

Migrations are forward-only. Never edit a migration that has been merged; add a new one. CI fails when a `schema.ts` change has no matching migration.

## Notes

- `pg` (node-postgres) is the driver because pg-boss needs it too.
- The test image (`src/testing.ts`) and `compose.yaml` both use `postgres:18-alpine`. Change them together.
- An idle connection that PostgreSQL drops (for example, during a database restart) emits an error on the pool. It is not handled yet, so the process exits and the container restarts. Revisit when #24 sets up production.
