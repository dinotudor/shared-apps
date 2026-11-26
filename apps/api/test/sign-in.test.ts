import { sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { createAuth } from "@shared-apps/auth";
import { cookiesFrom, googleStub, signInWithGoogle } from "@shared-apps/auth/testing";
import { startTestDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { buildApp } from "../src/app.ts";
import type { Config } from "../src/config.ts";
import { createAppRouter } from "../src/router.ts";
import { sendTo } from "./support/send.ts";
import { unusedModules } from "./support/unused-modules.ts";

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
    allowedEmails: ["ana@example.com"],
    trustedOrigins: [WEB],
    cookieDomain: undefined,
  },
};

const jobs = { start: () => Promise.resolve(), stop: () => Promise.resolve() };

let database: TestDatabase;
let app: FastifyInstance;

const send = sendTo(() => app);

const signInFromWeb = { origin: WEB, callbackURL: `${WEB}/`, errorCallbackURL: `${WEB}/sign-in/` };

const me = (cookies?: Headers) =>
  send(new Request("http://localhost:3000/trpc/viewer.me", { headers: cookies }));

/** The API on the shared test database, as it starts with `authConfig`. */
const buildAppWith = async (authConfig: Config["auth"]): Promise<FastifyInstance> => {
  const built = buildApp(config, {
    // The test database closes itself in afterAll.
    database: { close: () => Promise.resolve() },
    jobs,
    auth: createAuth(database.db, authConfig),
    membership: { isMember: () => Promise.resolve(false) },
    // Calls viewer.me only, which reaches no module.
    router: createAppRouter(unusedModules),
  });
  await built.ready();
  return built;
};

beforeAll(async () => {
  database = await startTestDatabase();
  app = await buildAppWith(config.auth);
});

afterAll(async () => {
  await app.close();
  await database.stop();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("signing in through the API", () => {
  it("signs in an allowlisted person, who then gets their viewer from viewer.me", async () => {
    googleStub({ sub: "google-ana", email: "ana@example.com", name: "Ana Teste" });

    const { location, cookieHeaders } = await signInWithGoogle(send, signInFromWeb);
    const response = await me(cookieHeaders);

    expect(location).toBe(`${WEB}/`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      result: { data: { id: expect.any(String) as string, name: "Ana Teste", role: "member" } },
    });
  });

  it("refuses someone who is not on the allowlist", async () => {
    googleStub({ sub: "google-eve", email: "eve@example.com", name: "Eve Teste" });

    const { location, cookieHeaders } = await signInWithGoogle(send, signInFromWeb);

    expect(new URL(location ?? "").searchParams.get("error")).toBe("email_not_allowed");
    expect((await me(cookieHeaders)).status).toBe(401);
  });

  it("answers viewer.me without a session with UNAUTHORIZED", async () => {
    const response = await me();

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { data: { code: "UNAUTHORIZED" } } });
  });

  it("signs out: the session ends, and the old cookie no longer works", async () => {
    googleStub({ sub: "google-ana", email: "ana@example.com", name: "Ana Teste" });
    const { cookieHeaders } = await signInWithGoogle(send, signInFromWeb);

    const signOut = await send(
      new Request("http://localhost:3000/api/auth/sign-out", {
        method: "POST",
        headers: { cookie: cookieHeaders.get("cookie") ?? "", origin: WEB },
      }),
    );

    expect(signOut.status).toBe(200);
    expect((await me(cookiesFrom(signOut, cookieHeaders))).status).toBe(401);
    expect((await me(cookieHeaders)).status).toBe(401);
  });

  it("answers viewer.me with UNAUTHORIZED once the person's email is removed from the allowlist", async () => {
    googleStub({ sub: "google-ana", email: "ana@example.com", name: "Ana Teste" });
    const { cookieHeaders } = await signInWithGoogle(send, signInFromWeb);
    expect((await me(cookieHeaders)).status).toBe(200);
    const withoutAna = await buildAppWith({ ...config.auth, allowedEmails: [] });
    try {
      const response = await withoutAna.inject({
        url: "/trpc/viewer.me",
        headers: { cookie: cookieHeaders.get("cookie") ?? "" },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({ error: { data: { code: "UNAUTHORIZED" } } });
    } finally {
      await withoutAna.close();
    }
  });

  it("sends a renewed session cookie with the tRPC response when the session is renewed", async () => {
    googleStub({ sub: "google-ana", email: "ana@example.com", name: "Ana Teste" });
    const { cookieHeaders } = await signInWithGoogle(send, signInFromWeb);
    // Better Auth renews a session once it is a day old: make this one look a week old.
    await database.db.execute(
      sql`update auth.session set expires_at = now() + interval '1 hour', updated_at = now() - interval '7 days'`,
    );

    const response = await me(cookieHeaders);

    expect(response.status).toBe(200);
    expect(
      response.headers.getSetCookie().some((cookie) => cookie.includes("session_token=")),
    ).toBe(true);
  });
});
