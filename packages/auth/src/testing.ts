// Test helpers for code that signs in through Better Auth: packages/auth and apps/api.
import { vi } from "vitest";
import type { Database } from "@shared-apps/db";
import { deleteUser, insertUser } from "./repository.ts";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

type GoogleProfile = { sub: string; email: string; name: string };

// Unsigned on purpose: in the code flow, Better Auth reads the ID token Google returns
// from its token endpoint over TLS and only decodes it.
const idTokenFor = (profile: GoogleProfile): string => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  return [
    encode({ alg: "RS256", typ: "JWT" }),
    encode({
      iss: "https://accounts.google.com",
      aud: "test-client-id",
      iat: now,
      exp: now + 3600,
      email_verified: true,
      picture: "",
      ...profile,
    }),
    "signature",
  ].join(".");
};

/**
 * Replaces Google at the network boundary: the token endpoint answers with an ID token
 * for `profile`. Every other request goes to the real fetch, and none is expected.
 */
export const googleStub = (profile: GoogleProfile): void => {
  const realFetch = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.startsWith(GOOGLE_TOKEN_ENDPOINT)) {
      return Promise.resolve(
        Response.json({
          access_token: "google-access-token",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "openid email profile",
          id_token: idTokenFor(profile),
        }),
      );
    }
    return realFetch(input, init);
  });
};

/** A `Cookie` header with the cookies a response sets, as a browser would send them back. */
export const cookiesFrom = (response: Response, previous = new Headers()): Headers => {
  const jar = new Map<string, string>();
  for (const pair of (previous.get("cookie") ?? "").split("; ").filter(Boolean)) {
    const [name = "", ...value] = pair.split("=");
    jar.set(name, value.join("="));
  }
  for (const cookie of response.headers.getSetCookie()) {
    const [pair = ""] = cookie.split(";");
    const [name = "", ...value] = pair.split("=");
    // Max-Age=0 deletes the cookie.
    if (/max-age=0/i.test(cookie)) jar.delete(name);
    else jar.set(name, value.join("="));
  }
  const headers = new Headers();
  headers.set("cookie", [...jar].map(([name, value]) => `${name}=${value}`).join("; "));
  return headers;
};

type SignInOptions = { origin: string; callbackURL: string; errorCallbackURL: string };

/** Sends a request to wherever Better Auth is mounted: its handler, or the whole API. */
export type Send = (request: Request) => Promise<Response>;

/**
 * What a browser does: the frontend starts sign-in, the browser goes to Google, and
 * Google sends it back to the callback with a code. Returns where the callback redirects
 * and the cookies the browser holds afterwards.
 */
export const signInWithGoogle = async (
  send: Send,
  { origin, callbackURL, errorCallbackURL }: SignInOptions,
): Promise<{ location: string | null; cookieHeaders: Headers; setCookies: string[] }> => {
  const start = await send(
    new Request("http://localhost:3000/api/auth/sign-in/social", {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ provider: "google", callbackURL, errorCallbackURL }),
    }),
  );
  if (!start.ok) throw new Error(`sign-in start failed: ${String(start.status)}`);
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get("state") ?? "";
  const cookies = cookiesFrom(start);

  const callback = await send(
    new Request(
      `http://localhost:3000/api/auth/callback/google?code=google-code&state=${encodeURIComponent(state)}`,
      { headers: cookies },
    ),
  );
  return {
    location: callback.headers.get("location"),
    cookieHeaders: cookiesFrom(callback, cookies),
    setCookies: callback.headers.getSetCookie(),
  };
};

type TestUser = { id: string; email: string; name: string };

/**
 * An account as Better Auth creates it at first sign-in, for tests that need someone who
 * has signed in without going through Google. Other packages use this, never auth's tables.
 */
export const createTestUser = async (db: Database, testUser: TestUser): Promise<string> => {
  // Lowercased, as Better Auth stores it.
  await insertUser(db, { ...testUser, email: testUser.email.toLowerCase() });
  return testUser.id;
};

/** Deletes an account, as an admin removing someone would. */
export const deleteTestUser = async (db: Database, id: string): Promise<void> => {
  await deleteUser(db, id);
};
