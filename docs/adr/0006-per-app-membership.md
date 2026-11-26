# 0006. Per-app membership lives in modules/membership and reaches tRPC through the context

- Status: accepted. Decision 5 amended by ADR 0010: domain errors map to tRPC codes by kind, not by code.
- Date: 2026-11-19
- Issue: #16

## Context

Every app in `shared-apps` shares one sign-in (ADR 0005), so signing in can't decide who uses which app. The What's for dinner brief (D8) asks for an `app_member` (appId, userId) table, a tRPC check that rejects non-members with FORBIDDEN, and a script that adds members by email. Being on the allowlist only lets someone sign in. It does not make them a **Member** of any app (see the glossary).

## Decision

1. **`modules/membership` owns `membership.app_member`**, with primary key `(app_id, user_id)`. `user_id` references `auth.user` with `on delete cascade`, so deleting an account ends its memberships. Its interface is `createMembership(db)` → `{ isMember(app, userId), add(app, userId) }`. `add` is safe to repeat.
2. **App IDs are `App` in `packages/api-core`** (`App.WhatsForDinner = "whats-for-dinner"`). Modules, `apps/api` and the script all need them. The value is stored, so it never changes.
3. **`memberProcedure(app)` in `api-core` checks membership through `ctx.isMemberOf(app)`.** `apps/api` builds this function from the membership module, bound to the call's viewer, and it returns false when nobody is signed in. `api-core` can't import a module, because modules depend on `api-core`. The context is the one place the two meet, and binding it to the viewer means a procedure can't ask about someone else.
4. **Admins are not members by role.** The `admin` role is global (ADR 0005). Using an app still takes a membership.
5. **A non-member gets FORBIDDEN with `domainCode: "not_a_member"`.** `memberProcedure` throws `NotAMemberError`, the first `DomainError` (playbook ADR 0012). Domain errors become tRPC errors in one place: a middleware on `api-core`'s base procedure maps each `DomainError` code to a tRPC code through one table (`not_a_member` → FORBIDDEN). A code without an entry doesn't compile. The error formatter then adds `domainCode` to the response. A domain error thrown anywhere in a call gets its own status, never a 500. A frontend can show a "you're not a member yet" page without reading message text.
6. **Members are added by email after their first sign-in.** Run `pnpm --filter @shared-apps/api members:add <app> <email>...`. The table keys on `userId`, and Better Auth creates the account at first sign-in. Until then the script reports `no account` and exits 1. `packages/auth` exposes `findUserIdByEmail`, matched the same way as the allowlist, so membership never queries `auth.user`.

## Alternatives considered

- **Key `app_member` on email (pending invites).** People could be added before they first sign in. But the table would then repeat the allowlist's job and drift from accounts, and the brief asks for `userId`.
- **Membership inside `packages/auth`.** It is close to sign-in, but it's a different concept from the allowlist. Adding it there would also grow the package everyone's session check depends on.
- **`api-core` importing the membership module.** Simpler wiring, but it would create a dependency cycle (modules depend on `api-core`).

## Consequences

- Every What's for dinner procedure uses `memberProcedure(App.WhatsForDinner)`. `viewer.me` stays `protectedProcedure`, so a signed-in non-member still learns who they are.
- Being added is a manual step for now. A "request access" flow (pending requests an admin approves in the app) would be a feature of its own.
- A new app adds a value to `App` and its own members. No schema change is needed.
