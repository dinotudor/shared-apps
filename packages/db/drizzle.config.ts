import { defineConfig } from "drizzle-kit";

// One migration history for the whole database (playbook ADR 0007). Every module
// declares its tables in its own schema.ts, inside its own PostgreSQL schema
// (docs/adr/0002). This glob is a tooling link only: no runtime code here imports a module.
export default defineConfig({
  dialect: "postgresql",
  schema: ["../../modules/*/src/schema.ts", "../../packages/*/src/schema.ts"],
  out: "./migrations",
});
