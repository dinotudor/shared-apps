// `pnpm db:migrate`: applies pending migrations, then exits. It lives in the deployed
// app so a release can migrate before the new version serves traffic (#24).
import { createDatabase, migrate } from "@shared-apps/db";
import { ConfigError, parseConfig } from "./config.ts";
import type { Config } from "./config.ts";

const loadConfig = (): Config => {
  try {
    // Same validation as the server, so both agree on what a valid environment is.
    return parseConfig(process.env);
  } catch (error) {
    console.error(error instanceof ConfigError ? error.message : error);
    process.exit(1);
  }
};

const database = createDatabase(loadConfig().databaseUrl);
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
