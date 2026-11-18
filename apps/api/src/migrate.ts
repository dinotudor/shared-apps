// `pnpm db:migrate`: applies pending migrations, then exits. It lives in the deployed
// app so a release can migrate before the new version serves traffic (#24).
import { createDatabase, migrate } from "@shared-apps/db";
import { ConfigError, parseMigrateConfig } from "./config.ts";
import type { MigrateConfig } from "./config.ts";

const loadConfig = (): MigrateConfig => {
  try {
    // The server's rule for DATABASE_URL, without the variables only the server needs.
    return parseMigrateConfig(process.env);
  } catch (error) {
    console.error(error instanceof ConfigError ? error.message : error);
    process.exit(1);
  }
};

const database = createDatabase(loadConfig().databaseUrl, {
  onError: (error) => {
    console.error("database connection lost:", error);
  },
});
try {
  await migrate(database.db);
  console.info("migrations applied");
} catch (error) {
  // Driver errors name the host and port, never the URL or its password.
  console.error("migration failed:", error);
  process.exitCode = 1;
} finally {
  await database.close();
}
