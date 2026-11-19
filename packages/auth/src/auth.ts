import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Database } from "@shared-apps/db";
import { defineJob } from "@shared-apps/jobs";
import type { ScheduledJob } from "@shared-apps/jobs";
import { createAllowlist } from "./allowlist.ts";
import { deleteExpired, deleteSession } from "./repository.ts";
import type { PurgeResult } from "./repository.ts";
import { parseRole } from "./roles.ts";
import type { Viewer } from "./roles.ts";
import * as schema from "./schema.ts";

export type AuthConfig = {
  /** At least 32 characters. Signs cookies and encrypts OAuth tokens. */
  secret: string;
  /** Public URL of apps/api. Google redirects the browser to `<baseUrl>/api/auth/callback/google`. */
  baseUrl: string;
  google: { clientId: string; clientSecret: string };
  /** Emails that may sign in. Matched without case. */
  allowedEmails: readonly string[];
  /** Origins of the frontends: Better Auth only redirects to and accepts requests from them. */
  trustedOrigins: readonly string[];
  /**
   * The parent domain of the API and the frontends in production (`example.com` for
   * `api.example.com` and `dinner.example.com`), so they share the session cookie.
   * Unset in dev, where cookies ignore the port and `localhost` covers both.
   */
  cookieDomain?: string | undefined;
};

export type Session = {
  viewer: Viewer | null;
  /** Headers to pass back to the browser, such as a renewed session cookie. */
  headers: Headers;
};

export type Auth = {
  /** Answers every request under `/api/auth/`. */
  handler: (request: Request) => Promise<Response>;
  /** Reads the session from PostgreSQL on every call, so a revoked session ends at once. */
  getSession: (requestHeaders: Headers) => Promise<Session>;
  /** Deletes sessions and sign-in states that expired before `now`. */
  purgeExpired: (now: Date) => Promise<PurgeResult>;
  /** Jobs for apps/api to pass to the job runner (ADR 0004). */
  schedules: ScheduledJob[];
};

// The code in the error redirect (`?error=`), so the sign-in page can explain it.
export const EMAIL_NOT_ALLOWED = "email_not_allowed";

export const createAuth = (db: Database, config: AuthConfig): Auth => {
  const isAllowed = createAllowlist(config.allowedEmails);
  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    secret: config.secret,
    baseURL: config.baseUrl,
    trustedOrigins: [...config.trustedOrigins],
    socialProviders: {
      google: {
        clientId: config.google.clientId,
        clientSecret: config.google.clientSecret,
        // Lets people on a shared phone pick their own account instead of the last one.
        prompt: "select_account",
        // Sign-in always goes through the redirect flow. Turning off ID-token sign-in
        // closes an endpoint we don't use.
        disableIdTokenSignIn: true,
      },
    },
    user: {
      // Runs before a user is created and on every Google sign-in, with the email Google
      // sends now. So a stranger never gets a row, and removing an email from the
      // allowlist stops that person's next sign-in. Their open sessions end in
      // getSession below.
      validateUserInfo: ({ user }) =>
        isAllowed(user.email) ? undefined : { error: EMAIL_NOT_ALLOWED },
      additionalFields: {
        role: { type: "string", required: true, defaultValue: "member", input: false },
      },
    },
    // Better Auth picks these from NODE_ENV: the origin check is off under test and rate
    // limiting is on only in production. Fixed here, so tests check what production does
    // and a container without NODE_ENV is still protected.
    advanced: {
      disableOriginCheck: false,
      ...(config.cookieDomain
        ? { crossSubDomainCookies: { enabled: true, domain: config.cookieDomain } }
        : {}),
    },
    account: {
      // Nothing calls Google's APIs, but Better Auth keeps Google's tokens. Encrypted, a
      // database leak doesn't hand them out.
      encryptOAuthTokens: true,
    },
    rateLimit: {
      enabled: true,
      // Better Auth allows 3 per 10 s on /sign-in/*, against password guessing. Starting
      // Google sign-in has nothing to guess (it only builds Google's URL), and the request
      // comes from the frontend's server, so every person shares that one IP's limit.
      customRules: { "/sign-in/social": false },
    },
    // Nothing here lets people edit their profile, and Google is the source of their name
    // and picture. Open, it would let a signed-in person rename themselves.
    disabledPaths: ["/update-user"],
    telemetry: { enabled: false },
  });

  const purgeExpired = (now: Date) => deleteExpired(db, now);

  return {
    handler: (request) => auth.handler(request),
    getSession: async (requestHeaders) => {
      const { headers, response } = await auth.api.getSession({
        headers: requestHeaders,
        returnHeaders: true,
      });
      if (!response) return { viewer: null, headers };
      // Removing an email from the allowlist ends that person's sessions too, not only
      // their next sign-in. Deleted rather than ignored, so the session can't be renewed.
      // The headers are dropped, because they may carry a renewed cookie for it.
      if (!isAllowed(response.user.email)) {
        await deleteSession(db, response.session.id);
        return { viewer: null, headers: new Headers() };
      }
      const { id, name, role } = response.user;
      return { viewer: { id, name, role: parseRole(role) }, headers };
    },
    purgeExpired,
    schedules: [
      {
        job: defineJob<Record<string, never>>({
          name: "auth.purge-expired",
          handler: async (_data, { jobId, log }) => {
            const deleted = await purgeExpired(new Date());
            log.info({ jobId, ...deleted }, "purged expired sessions");
          },
        }),
        // Daily, at a quiet hour that isn't on the hour.
        cron: "17 4 * * *",
      },
    ],
  };
};
