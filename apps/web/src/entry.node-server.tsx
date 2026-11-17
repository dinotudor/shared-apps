import { createServer } from "node:http";
import { createQwikRouter } from "@qwik.dev/router/middleware/node";
import render from "./entry.ssr.tsx";
import { ConfigError, parseServerConfig } from "./server/config.ts";
import type { ServerConfig } from "./server/config.ts";

const loadConfig = (): ServerConfig => {
  try {
    // Fails at startup rather than on the first request that calls the API.
    return parseServerConfig(process.env);
  } catch (error) {
    console.error(error instanceof ConfigError ? error.message : error);
    process.exit(1);
  }
};

const config = loadConfig();
const { router, staticFile } = createQwikRouter({ render });

const server = createServer((req, res) => {
  void staticFile(req, res, () => {
    // router also answers 404s.
    void router(req, res, (error?: unknown) => {
      console.error(error);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  });
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(() => process.exit(0));
  });
}

server.listen(config.port, config.host, () => {
  console.info(`web listening on http://${config.host}:${String(config.port)}`);
});
