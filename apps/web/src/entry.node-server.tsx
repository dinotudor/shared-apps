import { createServer } from "node:http";
import { createQwikRouter } from "@qwik.dev/router/middleware/node";
import render from "./entry.ssr.tsx";
import { ConfigError, parseServerConfig } from "./server/config.ts";
import type { ServerConfig } from "./server/config.ts";
import { createRequestListener, shutDown } from "./server/node-server.ts";

const loadConfig = (): ServerConfig => {
  try {
    // Fails at startup rather than on the first request that calls the API.
    return parseServerConfig(process.env);
  } catch (error) {
    console.error(error instanceof ConfigError ? error.message : error);
    process.exit(1);
  }
};

// Only checked here: apiFor() reads API_URL per request, but a bad value should stop
// the server at startup rather than fail the first page that calls the API.
const config = loadConfig();
const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = createServer(createRequestListener(createQwikRouter({ render }), console));

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    console.info(`${signal}: shutting down`);
    shutDown(server, {
      timeoutMs: SHUTDOWN_TIMEOUT_MS,
      exit: (code) => process.exit(code),
      log: console,
    });
  });
}

server.listen(config.port, config.host, () => {
  console.info(`web listening on http://${config.host}:${String(config.port)}`);
});
