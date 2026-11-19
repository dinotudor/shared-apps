import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { AnyTRPCRouter } from "@trpc/server";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import type { Context } from "@shared-apps/api-core";
import type { Auth } from "@shared-apps/auth";
import type { DatabaseHandle } from "@shared-apps/db";
import type { JobRunner } from "@shared-apps/jobs";
import type { Membership } from "@shared-apps/membership";
import { registerAuthRoute, serializeRequest, toHeaders } from "./auth-route.ts";
import type { Config } from "./config.ts";
import { appRouter } from "./router.ts";

export type AppDependencies = {
  database: DatabaseHandle;
  jobs: Pick<JobRunner, "start" | "stop">;
  auth: Pick<Auth, "handler" | "getSession">;
  membership: Pick<Membership, "isMember">;
  // A parameter so tests can mount procedures that fail.
  router?: AnyTRPCRouter;
  // Where log lines go: stdout by default, and an array in tests that read them.
  logStream?: { write: (line: string) => void };
};

export const buildApp = (
  config: Pick<Config, "logLevel">,
  { database, jobs, auth, membership, router = appRouter, logStream }: AppDependencies,
): FastifyInstance => {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      serializers: { req: serializeRequest },
      ...(logStream ? { stream: logStream } : {}),
    },
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
  registerAuthRoute(app, auth);

  const trpcOptions: FastifyTRPCPluginOptions<AnyTRPCRouter>["trpcOptions"] = {
    router,
    // Every call verifies its session against PostgreSQL (playbook ADR 0008): the API
    // trusts the cookie, never the frontend's word about who is signed in.
    createContext: async ({ req, res }): Promise<Context> => {
      const { viewer, headers } = await auth.getSession(toHeaders(req.headers));
      // A renewed session comes with a new cookie. The frontends pass it on to the browser.
      const cookies = headers.getSetCookie();
      if (cookies.length > 0) void res.header("set-cookie", cookies);
      return { viewer, isMember: membership.isMember };
    },
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
