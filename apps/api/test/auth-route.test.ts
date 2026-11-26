import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { router } from "@shared-apps/api-core";
import { createAuth } from "@shared-apps/auth";
import { googleStub, signInWithGoogle } from "@shared-apps/auth/testing";
import type { Send } from "@shared-apps/auth/testing";
import { startTestDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { buildApp } from "../src/app.ts";
import type { Config } from "../src/config.ts";

const WEB = "http://localhost:5173";

const authConfig: Config["auth"] = {
  secret: "test-secret-that-is-at-least-32-characters-long",
  baseUrl: "http://localhost:3000",
  google: { clientId: "test-client-id", clientSecret: "test-client-secret" },
  allowedEmails: ["ana@example.com"],
  trustedOrigins: [WEB],
  cookieDomain: undefined,
};

const jobs = { start: () => Promise.resolve(), stop: () => Promise.resolve() };

let database: TestDatabase;
let app: FastifyInstance;

/** Sends a fetch Request through Fastify's inject, as a browser or the frontend would. */
const send: Send = async (request) => {
  const url = new URL(request.url);
  const body = request.body ? await request.text() : undefined;
  const response = await app.inject({
    method: request.method as "GET" | "POST",
    url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers),
    ...(body === undefined ? {} : { payload: body }),
  });
  const headers = new Headers();
  for (const [name, value] of Object.entries(response.headers)) {
    for (const item of [value ?? []].flat()) headers.append(name, String(item));
  }
  const hasBody = response.rawPayload.length > 0 && response.statusCode !== 204;
  return new Response(hasBody ? new Uint8Array(response.rawPayload) : null, {
    status: response.statusCode,
    headers,
  });
};

const signInFromWeb = { origin: WEB, callbackURL: `${WEB}/`, errorCallbackURL: `${WEB}/sign-in/` };

beforeAll(async () => {
  database = await startTestDatabase();
  app = buildApp(
    { logLevel: "silent" },
    {
      // The test database closes itself in afterAll.
      database: { close: () => Promise.resolve() },
      jobs,
      auth: createAuth(database.db, authConfig),
      membership: { isMember: () => Promise.resolve(false) },
      // Nothing here calls tRPC.
      router: router({}),
    },
  );
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await database.stop();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Better Auth's endpoints", () => {
  it("answers update-user with 404, even for a signed-in person", async () => {
    googleStub({ sub: "google-ana", email: "ana@example.com", name: "Ana Teste" });
    const { cookieHeaders } = await signInWithGoogle(send, signInFromWeb);

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/update-user",
      headers: { cookie: cookieHeaders.get("cookie") ?? "", origin: WEB },
      payload: { name: "Someone Else" },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe("rate limiting", () => {
  // Better Auth allows 3 sign-in attempts per 10 s from one IP. Email sign-in is off,
  // so each attempt fails, but it still counts.
  const attemptSignIn = (remoteAddress: string, headers: Record<string, string> = {}) =>
    app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      remoteAddress,
      headers: { origin: WEB, ...headers },
      payload: { email: "ana@example.com", password: "guess" },
    });

  it("counts sign-in attempts per client IP", async () => {
    for (let attempt = 0; attempt < 3; attempt++) await attemptSignIn("203.0.113.1");

    expect((await attemptSignIn("203.0.113.1")).statusCode).toBe(429);
    expect((await attemptSignIn("203.0.113.2")).statusCode).not.toBe(429);
  });

  it("ignores an x-forwarded-for header sent by the caller", async () => {
    const statuses = [];
    for (let attempt = 1; attempt <= 4; attempt++) {
      const response = await attemptSignIn("203.0.113.3", {
        "x-forwarded-for": `198.51.100.${String(attempt)}`,
      });
      statuses.push(response.statusCode);
    }

    expect(statuses.at(-1)).toBe(429);
  });
});

describe("request logs", () => {
  /** An API that logs at info level into `lines`. */
  const loggingApp = async () => {
    const lines: string[] = [];
    const built = buildApp(
      { logLevel: "info" },
      {
        database: { close: () => Promise.resolve() },
        jobs,
        auth: createAuth(database.db, authConfig),
        membership: { isMember: () => Promise.resolve(false) },
        router: router({}),
        logStream: { write: (line: string) => void lines.push(line) },
      },
    );
    await built.ready();
    return { built, lines };
  };

  it("logs Google's callback without its one-time code and state", async () => {
    const { built, lines } = await loggingApp();
    try {
      await built.inject({ url: "/api/auth/callback/google?code=secret-code&state=secret-state" });
    } finally {
      await built.close();
    }

    const logged = lines.join("\n");
    expect(logged).toContain("/api/auth/callback/google");
    expect(logged).not.toContain("secret-code");
    expect(logged).not.toContain("secret-state");
  });
});
