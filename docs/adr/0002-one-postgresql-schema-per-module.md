# 0002. One PostgreSQL schema per module, one migration history in packages/db

- Status: accepted
- Date: 2026-11-17
- Issue: #14

## Context

Playbook ADR 0007 says each module owns its tables, and that all modules share one database and one forward-only migration history. Issue #14 asks for "one schema per module" and a migration workflow every module uses. Module repository tests (#21) need migrated tables, and modules must not import from `apps/`.

## Decision

1. **Each module keeps its tables in its own PostgreSQL schema**, named after the module. The module's `schema.ts` declares it with `pgSchema` and **exports** it:

   ```ts
   export const dishes = pgSchema("dishes");
   export const dish = dishes.table("dish", { ... });
   ```

   drizzle-kit only writes `CREATE SCHEMA` for a schema object that is exported. Without the export, the generated migration fails on an empty database, and the migration tests catch it.

2. **Nothing goes in `public`.** A test applies every migration to an empty database and fails if any table lands in `public`. Packages that own tables follow the same rule. For example, Better Auth's tables (#15) go in an `auth` schema: its Drizzle adapter documents a `schemaName: "auth"` option, and its CLI then generates `pgSchema("auth")` tables. pg-boss already keeps its tables in its own `pgboss` schema.

3. **One migration history, in `packages/db/migrations`.** `packages/db/drizzle.config.ts` collects `modules/*/src/schema.ts` and `packages/*/src/schema.ts` by glob. That glob is a tooling link only: `packages/db` never imports a module at runtime. `migrate()` and the test helper `startTestDatabase()` apply this history without the caller passing a path.

4. **`pnpm db:migrate` runs from `apps/api`** (`src/migrate.ts`), with the same environment validation as the server, so the deployed image can migrate before it serves traffic (#24).

## Alternatives considered

- **One `schema.ts` per module, all tables in `public`:** less ceremony, but nothing in the database shows who owns a table, and two modules can clash on a name.
- **A migration history per module:** matches the module boundary, but playbook ADR 0007 asks for one history, and cross-module foreign keys would need ordering between histories.
- **Migrations in `apps/api`:** keeps tooling with the deployed app, but module tests could not apply them without importing from `apps/`.

## Consequences

- Queries name tables as `<module>.<table>`. Drizzle does this from the table objects, so repositories don't write it by hand.
- A cross-module foreign key is visible in the SQL as a reference to another schema, which makes it easy to spot in review.
- When the first `schema.ts` lands, `pnpm db:generate` writes the first migration. CI fails if a schema change is committed without its migration.
- Better Auth's own `migrate` command must not be used. Its tables go through drizzle-kit and this one history, like every other table.
