# 0005. Sign-in lives in packages/auth, and the frontends pass the API's cookies on

- Status: accepted
- Date: 2026-11-18
- Issue: #15

## Context

Playbook ADR 0008 asks for Better Auth with Google sign-in, sessions in PostgreSQL, an email allowlist, protected-by-default procedures, a session check on every call and two roles. Its prototype never tried Google sign-in, stored sessions or roles.

Here, only Qwik's server code calls the API (playbook ADR 0006), and each app has its own frontend (ADR 0003). OAuth still needs the browser to reach the API once: Google redirects it to the callback URL registered on the OAuth client. ADR 0003 also left open how the API and frontends on separate subdomains share a session.

## Decision

1. **`packages/auth` (`@shared-apps/auth`) is the only package that imports Better Auth.** Its interface is `createAuth(db, config)`, which returns:
   - `handler(request)`: answers `/api/auth/*`;
   - `getSession(headers)`: returns `{ viewer, headers }`;
   - `purgeExpired(now)` and `schedules`: a daily job that deletes expired sessions and sign-in states (ADR 0004).

   Its tables live in the `auth` schema (ADR 0002), written by hand from Better Auth's table definitions, and migrate through drizzle-kit.
2. **The allowlist runs in Better Auth's `validateUserInfo` hook.** The hook runs before a user is created and on every Google sign-in, with the email Google sends at that moment. A stranger never gets a row, and removing an email from `AUTH_ALLOWED_EMAILS` stops that person's next sign-in. `getSession` checks the allowlist too: an open session whose email is no longer on it is deleted and gets no viewer, so it can't be renewed (amended by #56).
3. **The API checks the session in PostgreSQL on every tRPC call**, in `createContext`. Better Auth's cookie cache stays off, so a revoked session ends at once. `api-core` provides `protectedProcedure` (UNAUTHORIZED without a session) and `adminProcedure` (FORBIDDEN for members). A test walks every procedure in `appRouter` and expects UNAUTHORIZED without a session, except an explicit list of public ones.
4. **Roles are a `role` column on `auth.user`**: `member` by default, `admin` set only in the database. Better Auth never takes it from a request (`input: false`). Nothing makes anyone admin yet. An `AUTH_ADMIN_EMAILS`-style variable can come with the first admin feature.
5. **The browser reaches the API only for Google's callback.** The frontend's server starts sign-in and signs out by calling `/api/auth/*`, sending the frontend's origin, which must be listed in `AUTH_TRUSTED_ORIGINS`. Google then sends the browser to `BETTER_AUTH_URL/api/auth/callback/google`, and Better Auth redirects it back to the frontend.
6. **The frontends pass the API's cookies on to the browser**, from both the auth calls and every tRPC response. Better Auth renews a session once a day by sending a new cookie. Without this step, the browser's cookie would expire after 7 days while the session was still valid. The cookies go through Qwik's cookie API: Qwik Router 2.0.0-rc.5 keeps only the last `Set-Cookie` header otherwise.
7. **Cookies are shared by domain.** In dev, cookies ignore the port, so `localhost:3000` and `localhost:5173` share them, as long as the app is opened at `localhost`, not `127.0.0.1`. In production, `AUTH_COOKIE_DOMAIN` (the parent domain) turns on Better Auth's cross-subdomain cookies. This answers the question ADR 0003 left open.
8. **Settings that Better Auth picks from `NODE_ENV` are fixed in code:**
   - the origin check is always on, where Better Auth would turn it off under test;
   - rate limiting is always on, where Better Auth would turn it on only in production.

   Starting Google sign-in is exempt from the strict sign-in rate limit, because it comes from the frontend's server, whose one IP every person shares. Google's tokens are stored encrypted, and ID-token sign-in is off.

## Alternatives considered

- **Proxy `/api/auth/*` through each frontend**, so the browser never sees the API. Cookies would be first-party everywhere and no cookie domain would be needed. But every frontend would need a proxy route, and the Google client would list one callback URL per frontend.
- **A session hook (`session.create.before`) for the allowlist.** It works, but it has to look the user up, and it sees the stored email rather than the one Google just sent.
- **Better Auth's `admin` plugin for roles.** It adds ban, impersonation and user-management endpoints that nothing here uses: more surface to protect for one column.
- **Let the session cookie expire after 7 days** instead of passing renewed cookies on. That is simpler, but everyone would be signed out every week however often they use the app.

## Consequences

- Tests sign in through the real redirect flow, with real PostgreSQL. Only Google's token endpoint is stubbed (`@shared-apps/auth/testing`).
- `pnpm db:migrate` checks only `DATABASE_URL`, using the same rule as the server, so the release step doesn't need the sign-in secrets. This narrows ADR 0002's "same environment validation as the server".
- Deployment (#24) has to set:
  - `BETTER_AUTH_URL` to the API's public URL;
  - `AUTH_TRUSTED_ORIGINS` to the frontends;
  - `AUTH_COOKIE_DOMAIN` to the parent domain;
  - the production callback URL on the Google client.

  It also has to make sure the API sees the browser's IP behind the proxy, for rate limiting.
- The cookie workaround in `apps/whats-for-dinner/src/server/cookies.ts` should be rechecked when Qwik is upgraded.
- The role named `member` is not the glossary's **Member** (a collaborator who may use a given app, #16). See the glossary.
