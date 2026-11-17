import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import type { Context } from "@shared-apps/api-core";
import type { Config } from "./config.ts";
import { appRouter } from "./router.ts";
import type { AppRouter } from "./router.ts";

export const buildApp = (config: Config): FastifyInstance => {
  const app = Fastify({
    logger: { level: config.logLevel },
    // Batched tRPC calls put every procedure name in one path segment
    // (/trpc/a,b,c); Fastify's default limit of 100 characters rejects them.
    routerOptions: { maxParamLength: 5000 },
  });

  app.get("/health", () => ({ status: "ok" }));

  const trpcOptions: FastifyTRPCPluginOptions<AppRouter>["trpcOptions"] = {
    router: appRouter,
    createContext: (): Context => ({}),
  };
  void app.register(fastifyTRPCPlugin, { prefix: "/trpc", trpcOptions });

  return app;
};
