import { buildApp } from "./app.ts";
import { ConfigError, parseConfig } from "./config.ts";
import type { Config } from "./config.ts";

const loadConfig = (): Config => {
  try {
    // The only place that reads process.env (ADR 0012).
    return parseConfig(process.env);
  } catch (error) {
    // No logger exists yet, so report on stderr and refuse to start.
    console.error(error instanceof ConfigError ? error.message : error);
    process.exit(1);
  }
};

const config = loadConfig();
const app = buildApp(config);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, "shutting down");
    app.close().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error({ err: error }, "shutdown failed");
        process.exit(1);
      },
    );
  });
}

try {
  await app.listen({ port: config.port, host: config.host });
} catch (error) {
  app.log.fatal({ err: error }, "failed to start");
  process.exit(1);
}
