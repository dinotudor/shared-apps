import { afterAll, afterEach, assert, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { App } from "@shared-apps/api-core";
import { createAuth, findUserIdByEmail } from "@shared-apps/auth";
import { googleStub, signInWithGoogle } from "@shared-apps/auth/testing";
import { startTestDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { createDishes } from "@shared-apps/dishes";
import { createMembership } from "@shared-apps/membership";
import { buildApp } from "../src/app.ts";
import type { Config } from "../src/config.ts";
import { createAppRouter } from "../src/router.ts";
import { sendTo } from "./support/send.ts";

const WEB = "http://localhost:5173";

const config: Config = {
  port: 0,
  host: "127.0.0.1",
  logLevel: "silent",
  databaseUrl: "postgres://unused/unused",
  auth: {
    secret: "test-secret-that-is-at-least-32-characters-long",
    baseUrl: "http://localhost:3000",
    google: { clientId: "test-client-id", clientSecret: "test-client-secret" },
    allowedEmails: ["ana@example.com", "bruno@example.com"],
    trustedOrigins: [WEB],
    cookieDomain: undefined,
  },
};

let database: TestDatabase;
let app: FastifyInstance;

const send = sendTo(() => app);

const signIn = async (email: string, name: string) => {
  googleStub({ sub: `google-${email}`, email, name });
  const { cookieHeaders } = await signInWithGoogle(send, {
    origin: WEB,
    callbackURL: `${WEB}/`,
    errorCallbackURL: `${WEB}/sign-in/`,
  });
  return cookieHeaders;
};

// A What's for dinner procedure, called the way the frontend's server calls it.
const listDishes = (cookies: Headers) =>
  send(new Request("http://localhost:3000/trpc/dishes.list", { headers: cookies }));

beforeAll(async () => {
  database = await startTestDatabase();
  app = buildApp(config, {
    database: { db: database.db, close: () => Promise.resolve() },
    jobs: { start: () => Promise.resolve(), stop: () => Promise.resolve() },
    auth: createAuth(database.db, config.auth),
    membership: createMembership(database.db),
    router: createAppRouter({ dishes: createDishes(database.db) }),
  });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await database.stop();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("app membership through the API", () => {
  it("lets a member of What's for dinner use its procedures", async () => {
    const cookies = await signIn("ana@example.com", "Ana Teste");
    const ana = await findUserIdByEmail(database.db, "ana@example.com");
    assert(ana !== null, "signing in creates Ana's account");
    await createMembership(database.db).add(App.WhatsForDinner, ana);

    const response = await listDishes(cookies);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: { data: [] } });
  });

  it("refuses a signed-in collaborator who is not a member as FORBIDDEN, with not_a_member", async () => {
    const cookies = await signIn("bruno@example.com", "Bruno Teste");

    const response = await listDishes(cookies);

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { data: { code: "FORBIDDEN", domainCode: "not_a_member" } },
    });
  });
});
