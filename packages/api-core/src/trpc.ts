import { initTRPC, TRPCError } from "@trpc/server";
import type { Viewer } from "@shared-apps/auth";
import type { App } from "./apps.ts";
import { DomainError, NotAMemberError } from "./errors.ts";
import type { DomainErrorCode } from "./errors.ts";

export type Context = {
  /** Who is signed in, from a session apps/api verified for this call. Null when nobody is. */
  viewer: Viewer | null;
  /**
   * Whether the viewer is a member of the app; false when nobody is signed in. A function,
   * not a module import: modules depend on api-core, so apps/api passes membership in here.
   * Queried only by member-only procedures.
   */
  isMemberOf: (app: App) => Promise<boolean>;
};

const t = initTRPC.context<Context>().create({
  // isDev is fixed: tRPC's default reads NODE_ENV (env access outside apps/api,
  // ADR 0012) and adds stack traces to responses. Stacks belong in the logs.
  isDev: false,
  errorFormatter: ({ shape, error }) => {
    const domainCode = error.cause instanceof DomainError ? error.cause.code : null;
    return { ...shape, data: { ...shape.data, domainCode } };
  },
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

// The one place domain errors become tRPC errors (playbook ADR 0012). A Record, so a new
// DomainErrorCode without a status here doesn't compile.
const STATUS_BY_DOMAIN_CODE: Record<DomainErrorCode, TRPCError["code"]> = {
  not_a_member: "FORBIDDEN",
};

// Every procedure starts here. tRPC wraps anything a procedure or a later middleware throws
// as INTERNAL_SERVER_ERROR, with the original as `cause`: a domain error gets its own
// status instead, so it is neither a 500 for the client nor logged as unexpected.
const baseProcedure = t.procedure.use(async ({ next }) => {
  const result = await next();
  if (!result.ok && result.error.cause instanceof DomainError) {
    const cause = result.error.cause;
    throw new TRPCError({ code: STATUS_BY_DOMAIN_CODE[cause.code], cause });
  }
  return result;
});

/**
 * Open to everyone, signed in or not. Use it only on purpose: every procedure without a
 * session check must be listed in apps/api's public procedures test.
 */
export const publicProcedure = baseProcedure;

/** The default for every procedure: rejects calls without a session as UNAUTHORIZED. */
export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {
  if (!ctx.viewer) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { viewer: ctx.viewer } });
});

/** For admins only: members get FORBIDDEN. */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.viewer.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});

/**
 * For members of `app` only. Anyone else signed in gets FORBIDDEN with the domain code
 * `not_a_member`, admins included: the `admin` role is not a membership.
 */
export const memberProcedure = (app: App) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    if (!(await ctx.isMemberOf(app))) throw new NotAMemberError();
    return next();
  });
