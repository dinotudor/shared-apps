import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { publicProcedure, router } from "@shared-apps/api-core";
import type { Database } from "@shared-apps/db";
import { buildApp } from "../src/app.ts";
import type { AppDependencies } from "../src/app.ts";

let app: FastifyInstance | undefined;

const config = { logLevel: "silent" } as const;

// No procedure here queries the database or sends a job, so these tests need no container.
const database = { db: {} as Database, close: () => Promise.resolve() };
const jobs = { start: () => Promise.resolve(), stop: () => Promise.resolve() };
// Nobody is signed in, and nothing here goes through /api/auth.
const auth = {
  handler: () => Promise.resolve(new Response(null, { status: 404 })),
  getSession: () => Promise.resolve({ viewer: null, headers: new Headers() }),
};
// No procedure here is for members only.
const membership = { isMember: () => Promise.resolve(false) };

const startApp = async (appRouter?: AppDependencies["router"]) => {
  app = buildApp(config, { database, jobs, auth, membership, router: appRouter });
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

describe("request logs", () => {
  /** Starts an API that logs at info level, and returns what it logged. */
  const logsOf = async (url: string) => {
    const lines: string[] = [];
    app = buildApp(
      { logLevel: "info" },
      { database, jobs, auth, membership, logStream: { write: (line) => void lines.push(line) } },
    );
    await app.ready();
    await app.inject({ method: "GET", url });
    return lines.join("\n");
  };

  it("logs a tRPC call without its input, which can hold names or emails", async () => {
    const input = encodeURIComponent(JSON.stringify({ email: "ana@example.com" }));

    const logged = await logsOf(`/trpc/health.ping?input=${input}`);

    expect(logged).toContain("/trpc/health.ping");
    expect(logged).not.toContain("ana");
    expect(logged).not.toContain("input=");
  });

  it("does not log health checks, which the host sends every few seconds", async () => {
    const logged = await logsOf("/health");

    expect(logged).not.toContain("/health");
  });
});

describe("background jobs", () => {
  it("starts the job runner when the app is ready", async () => {
    const start = vi.fn(() => Promise.resolve());
    app = buildApp(config, { database, auth, membership, jobs: { ...jobs, start } });

    await app.ready();

    expect(start).toHaveBeenCalledOnce();
  });

  it("does not start when the job runner can't start", async () => {
    const failure = new Error("connect ECONNREFUSED");
    app = buildApp(config, {
      database,
      auth,
      membership,
      jobs: { ...jobs, start: () => Promise.reject(failure) },
    });

    await expect(app.ready()).rejects.toBe(failure);
  });

  it("stops the job runner on close, before the database closes", async () => {
    const calls: string[] = [];
    app = buildApp(config, {
      database: { ...database, close: () => Promise.resolve(void calls.push("database")) },
      jobs: { ...jobs, stop: () => Promise.resolve(void calls.push("jobs")) },
      auth,
      membership,
    });
    await app.ready();

    await app.close();
    app = undefined;

    expect(calls).toEqual(["jobs", "database"]);
  });
});
