import { createAuth } from "@shared-apps/auth";
import { createDatabase } from "@shared-apps/db";
import { createJobRunner } from "@shared-apps/jobs";
import { createMembership } from "@shared-apps/membership";
import { buildApp } from "./app.ts";
import { ConfigError, parseConfig } from "./config.ts";
import type { Config } from "./config.ts";
import { heartbeat } from "./heartbeat.ts";
import { runServer } from "./lifecycle.ts";

const SHUTDOWN_TIMEOUT_MS = 10_000;
// Half the shutdown budget for running jobs, leaving the rest for in-flight requests
// and closing the pool. A job cut off here is marked failed and retried after restart.
const JOBS_STOP_TIMEOUT_MS = 5_000;

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
const auth = createAuth(database.db, config.auth);
const jobs = createJobRunner({
  url: config.databaseUrl,
  // Forwards to app.log, which exists by the time a job runs: the runner starts in
  // the app's onReady hook.
  log: {
    info: (fields, message) => {
      app.log.info(fields, message);
    },
    error: (fields, message) => {
      app.log.error(fields, message);
    },
  },
  // Modules add their jobs here (#21+).
  jobs: [],
  schedules: [heartbeat, ...auth.schedules],
  stopTimeoutMs: JOBS_STOP_TIMEOUT_MS,
});
const membership = createMembership(database.db);
const app = buildApp(config, { database, jobs, auth, membership });

await runServer(app, {
  port: config.port,
  host: config.host,
  timeoutMs: SHUTDOWN_TIMEOUT_MS,
  signals: process,
  exit: (code) => process.exit(code),
});
