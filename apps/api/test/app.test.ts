import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.ts";

let app: FastifyInstance | undefined;

const startApp = async () => {
  app = buildApp({ port: 0, host: "127.0.0.1", logLevel: "silent" });
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
});
