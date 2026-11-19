import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
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
      database: { db: database.db, close: () => Promise.resolve() },
      jobs,
      auth: createAuth(database.db, authConfig),
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
