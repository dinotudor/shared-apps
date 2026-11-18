import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { startTestDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { createAuth } from "../src/index.ts";
import type { Auth, AuthConfig } from "../src/index.ts";
import { user } from "../src/schema.ts";
import { cookiesFrom, googleStub, signInWithGoogle } from "../src/testing.ts";

const API = "http://localhost:3000";
const WEB = "http://localhost:5173";

const config: AuthConfig = {
  secret: "test-secret-that-is-at-least-32-characters-long",
  baseUrl: API,
  google: { clientId: "test-client-id", clientSecret: "test-client-secret" },
  allowedEmails: ["ana@example.com", "Bruno@Example.com"],
  trustedOrigins: [WEB],
};

const signInFromWeb = {
  origin: WEB,
  callbackURL: `${WEB}/`,
  errorCallbackURL: `${WEB}/sign-in/`,
};

/** Where a refused sign-in lands, and the error code it carries. */
const refusal = (location: string | null) => {
  const url = new URL(location ?? "about:blank");
  return { page: url.origin + url.pathname, error: url.searchParams.get("error") };
};

let database: TestDatabase;
let auth: Auth;

beforeAll(async () => {
  database = await startTestDatabase();
  auth = createAuth(database.db, config);
});

afterAll(async () => {
  await database.stop();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("signing in with Google", () => {
  it("signs in an allowlisted email and sends them back to the page they asked for", async () => {
    googleStub({ sub: "google-ana", email: "ana@example.com", name: "Ana Teste" });

    const result = await signInWithGoogle(auth.handler, {
      origin: WEB,
      callbackURL: `${WEB}/dishes/`,
      errorCallbackURL: `${WEB}/sign-in/`,
    });

    expect(result.location).toBe(`${WEB}/dishes/`);
    const { viewer } = await auth.getSession(result.cookieHeaders);
    expect(viewer).toMatchObject({ name: "Ana Teste", role: "member" });
    expect(viewer?.id).toEqual(expect.any(String) as string);
  });

  it("refuses an email that is not on the allowlist, without a session", async () => {
    googleStub({ sub: "google-eve", email: "eve@example.com", name: "Eve Teste" });

    const result = await signInWithGoogle(auth.handler, signInFromWeb);

    expect(refusal(result.location)).toEqual({
      page: `${WEB}/sign-in/`,
      error: "email_not_allowed",
    });
    expect((await auth.getSession(result.cookieHeaders)).viewer).toBeNull();
  });

  it("matches allowlisted emails without regard to case", async () => {
    googleStub({ sub: "google-bruno", email: "bruno@EXAMPLE.com", name: "Bruno Teste" });

    const result = await signInWithGoogle(auth.handler, signInFromWeb);

    expect((await auth.getSession(result.cookieHeaders)).viewer?.name).toBe("Bruno Teste");
  });

  it("refuses a returning user whose email was removed from the allowlist", async () => {
    googleStub({ sub: "google-carla", email: "carla@example.com", name: "Carla Teste" });
    const withCarla = createAuth(database.db, {
      ...config,
      allowedEmails: [...config.allowedEmails, "carla@example.com"],
    });
    const first = await signInWithGoogle(withCarla.handler, signInFromWeb);
    expect((await withCarla.getSession(first.cookieHeaders)).viewer).not.toBeNull();

    const again = await signInWithGoogle(auth.handler, signInFromWeb);

    expect(refusal(again.location)).toEqual({
      page: `${WEB}/sign-in/`,
      error: "email_not_allowed",
    });
  });
});

describe("redirects", () => {
  it.each([
    ["a callback on another site", { callbackURL: "https://evil.example/" }],
    ["an error callback on another site", { errorCallbackURL: "https://evil.example/" }],
  ])("refuses to start sign-in with %s", async (_, override) => {
    const response = await auth.handler(
      new Request(`${API}/api/auth/sign-in/social`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: WEB },
        body: JSON.stringify({ provider: "google", ...signInFromWeb, ...override }),
      }),
    );

    expect(response.status).toBe(403);
  });
});

const signInAna = async () => {
  googleStub({ sub: "google-ana", email: "ana@example.com", name: "Ana Teste" });
  return (await signInWithGoogle(auth.handler, signInFromWeb)).cookieHeaders;
};

describe("signing out", () => {
  it("ends the session for good, even if the old cookie is sent again", async () => {
    const cookies = await signInAna();

    const response = await auth.handler(
      new Request(`${API}/api/auth/sign-out`, {
        method: "POST",
        headers: { cookie: cookies.get("cookie") ?? "", origin: WEB },
      }),
    );

    expect(response.status).toBe(200);
    expect((await auth.getSession(cookiesFrom(response, cookies))).viewer).toBeNull();
    // A copy of the cookie kept from before sign-out no longer works.
    expect((await auth.getSession(cookies)).viewer).toBeNull();
  });
});

describe("roles", () => {
  it("makes new users members, and admins only through the database", async () => {
    const cookies = await signInAna();
    const { viewer } = await auth.getSession(cookies);
    expect(viewer?.role).toBe("member");

    await database.db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, viewer?.id ?? ""));

    expect((await auth.getSession(cookies)).viewer?.role).toBe("admin");
  });

  it("does not let a user make themselves admin", async () => {
    const cookies = await signInAna();
    await database.db.update(user).set({ role: "member" }).where(eq(user.email, "ana@example.com"));

    await auth.handler(
      new Request(`${API}/api/auth/update-user`, {
        method: "POST",
        headers: {
          cookie: cookies.get("cookie") ?? "",
          origin: WEB,
          "content-type": "application/json",
        },
        body: JSON.stringify({ role: "admin" }),
      }),
    );

    expect((await auth.getSession(cookies)).viewer?.role).toBe("member");
  });
});

describe("the session cookie", () => {
  it("stays on the API's host when no cookie domain is set", async () => {
    googleStub({ sub: "google-ana", email: "ana@example.com", name: "Ana Teste" });

    const { setCookies } = await signInWithGoogle(auth.handler, signInFromWeb);

    const sessionCookie = setCookies.find((cookie) => cookie.includes("session_token="));
    expect(sessionCookie).toMatch(/httponly/i);
    expect(sessionCookie).not.toMatch(/domain=/i);
  });

  it("is shared with the frontends' subdomains when a cookie domain is set", async () => {
    googleStub({ sub: "google-ana", email: "ana@example.com", name: "Ana Teste" });
    const onSubdomains = createAuth(database.db, { ...config, cookieDomain: "example.test" });

    const { setCookies } = await signInWithGoogle(onSubdomains.handler, signInFromWeb);

    const sessionCookie = setCookies.find((cookie) => cookie.includes("session_token="));
    expect(sessionCookie).toMatch(/domain=example\.test/i);
  });
});

describe("purging expired rows", () => {
  it("deletes sessions and sign-in states that have expired, and keeps the rest", async () => {
    // A fresh database, so other tests' rows don't change the counts.
    const own = await startTestDatabase();
    try {
      const ownAuth = createAuth(own.db, config);
      googleStub({ sub: "google-ana", email: "ana@example.com", name: "Ana Teste" });
      const cookies = (await signInWithGoogle(ownAuth.handler, signInFromWeb)).cookieHeaders;
      // A sign-in that was started and never finished leaves its state behind.
      await ownAuth.handler(
        new Request(`${API}/api/auth/sign-in/social`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: WEB },
          body: JSON.stringify({ provider: "google", ...signInFromWeb }),
        }),
      );

      expect(await ownAuth.purgeExpired(new Date())).toEqual({ sessions: 0, verifications: 0 });
      expect((await ownAuth.getSession(cookies)).viewer).not.toBeNull();

      const inAYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      expect(await ownAuth.purgeExpired(inAYear)).toEqual({ sessions: 1, verifications: 1 });
    } finally {
      await own.stop();
    }
  });

  it("is scheduled once a day", () => {
    expect(auth.schedules.map(({ job, cron }) => ({ name: job.name, cron }))).toEqual([
      { name: "auth.purge-expired", cron: "17 4 * * *" },
    ]);
  });
});
