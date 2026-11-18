import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { AnyTRPCRouter } from "@trpc/server";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import type { Context } from "@shared-apps/api-core";
import type { DatabaseHandle } from "@shared-apps/db";
import type { JobRunner } from "@shared-apps/jobs";
import type { Config } from "./config.ts";
import { appRouter } from "./router.ts";

export type AppDependencies = {
  database: DatabaseHandle;
  jobs: Pick<JobRunner, "start" | "stop">;
  // A parameter so tests can mount procedures that fail.
  router?: AnyTRPCRouter;
};

export const buildApp = (
  config: Config,
  { database, jobs, router = appRouter }: AppDependencies,
): FastifyInstance => {
  const app = Fastify({
    logger: { level: config.logLevel },
    // Batched tRPC calls put every procedure name in one path segment
    // (/trpc/a,b,c); Fastify's default limit of 100 characters rejects them.
    routerOptions: { maxParamLength: 5000 },
  });

  // Part of startup: if pg-boss can't start, listen() fails and the process exits, so
  // the API never serves without its jobs running (ADR 0004).
  app.addHook("onReady", () => jobs.start());
  // preClose runs as soon as close() starts: new requests already get 503, and in-flight
  // ones keep running. So jobs stop taking work and finish alongside those requests,
  // instead of after them, and both are done before onClose closes the database pool.
  app.addHook("preClose", () => jobs.stop());
  // Every app.close() releases the pool: at shutdown, and in tests.
  app.addHook("onClose", () => database.close());

  app.get("/health", () => ({ status: "ok" }));

  const trpcOptions: FastifyTRPCPluginOptions<AnyTRPCRouter>["trpcOptions"] = {
    router,
    createContext: (): Context => ({}),
    onError: ({ error, path }) => {
      // Only unexpected failures: client errors (bad input, unknown path) are not ours.
      if (error.code === "INTERNAL_SERVER_ERROR") {
        app.log.error({ err: error, path }, "tRPC procedure failed");
      }
    },
  };
  void app.register(fastifyTRPCPlugin, { prefix: "/trpc", trpcOptions });

  return app;
};
