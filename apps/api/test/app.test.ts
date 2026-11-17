import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { publicProcedure, router } from "@shared-apps/api-core";
import { buildApp } from "../src/app.ts";

let app: FastifyInstance | undefined;

const config = { port: 0, host: "127.0.0.1", logLevel: "silent" } as const;

const startApp = async (appRouter?: Parameters<typeof buildApp>[1]) => {
  app = buildApp(config, appRouter);
  await app.ready();
  return app;
};

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("api", () => {
  it("responds 200 on GET /health", async () => {
    const api = await startApp();

    const response = await api.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("answers the health.ping tRPC query at /trpc with { ok: true }", async () => {
    const api = await startApp();

    const response = await api.inject({ method: "GET", url: "/trpc/health.ping" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ result: { data: { ok: true } } });
  });

  it("answers batched tRPC calls whose combined path is long", async () => {
    const api = await startApp();
    const calls = 12; // "health.ping" × 12 joined by commas is longer than 100 characters

    const response = await api.inject({
      method: "GET",
      url: `/trpc/${Array<string>(calls).fill("health.ping").join(",")}?batch=1`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(Array(calls).fill({ result: { data: { ok: true } } }));
  });

  it("logs an unexpected procedure error with its path, and returns 500", async () => {
    const failure = new Error("database unreachable");
    const api = await startApp(
      router({
        broken: publicProcedure.query(() => {
          throw failure;
        }),
      }),
    );
    const logError = vi.spyOn(api.log, "error");

    const response = await api.inject({ method: "GET", url: "/trpc/broken" });

    expect(response.statusCode).toBe(500);
    expect(logError).toHaveBeenCalledOnce();
    const [logged] = logError.mock.calls[0] as [{ path: string; err: Error }];
    expect(logged.path).toBe("broken");
    expect(logged.err.cause).toBe(failure);
  });

  it("does not log client errors, such as an unknown procedure, as errors", async () => {
    const api = await startApp();
    const logError = vi.spyOn(api.log, "error");

    const response = await api.inject({ method: "GET", url: "/trpc/health.nope" });

    expect(response.statusCode).toBe(404);
    expect(logError).not.toHaveBeenCalled();
  });
});
