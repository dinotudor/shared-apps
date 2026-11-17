import { createDatabase } from "@shared-apps/db";
import { buildApp } from "./app.ts";
import { ConfigError, parseConfig } from "./config.ts";
import type { Config } from "./config.ts";
import { runServer } from "./lifecycle.ts";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const loadConfig = (): Config => {
  try {
    // The only place, with migrate.ts, that reads process.env (ADR 0012).
    return parseConfig(process.env);
  } catch (error) {
    // No logger exists yet, so report on stderr and refuse to start.
    console.error(error instanceof ConfigError ? error.message : error);
    process.exit(1);
  }
};

const config = loadConfig();
// Connects lazily: a database that is down shows up on the first query, not here.
const database = createDatabase(config.databaseUrl, {
  // A dropped idle connection (database restart, laptop sleep) is logged, not fatal:
  // the pool reconnects on the next query. `app` exists by the time this can fire,
  // since no connection opens before the server handles a request.
  onError: (error) => {
    app.log.error({ err: error }, "database connection lost");
  },
});
const app = buildApp(config, { database });

await runServer(app, {
  port: config.port,
  host: config.host,
  timeoutMs: SHUTDOWN_TIMEOUT_MS,
  signals: process,
  exit: (code) => process.exit(code),
});
