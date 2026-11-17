import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { AnyTRPCRouter } from "@trpc/server";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import type { Context } from "@shared-apps/api-core";
import type { Config } from "./config.ts";
import { appRouter } from "./router.ts";

// The router is a parameter so tests can mount procedures that fail.
export const buildApp = (config: Config, router: AnyTRPCRouter = appRouter): FastifyInstance => {
  const app = Fastify({
    logger: { level: config.logLevel },
    // Batched tRPC calls put every procedure name in one path segment
    // (/trpc/a,b,c); Fastify's default limit of 100 characters rejects them.
    routerOptions: { maxParamLength: 5000 },
  });

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
