import { initTRPC, TRPCError } from "@trpc/server";
import type { Viewer } from "@shared-apps/auth";
import type { App } from "./apps.ts";
import { DomainError, NotAMemberError } from "./errors.ts";

export type Context = {
  /** Who is signed in, from a session apps/api verified for this call. Null when nobody is. */
  viewer: Viewer | null;
  /**
   * Whether the collaborator is a member of the app. A function, not a module import:
   * modules depend on api-core, so apps/api passes the membership module in here.
   */
  isMember: (app: App, userId: string) => Promise<boolean>;
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

/**
 * Open to everyone, signed in or not. Use it only on purpose: every procedure without a
 * session check must be listed in apps/api's public procedures test.
 */
export const publicProcedure = t.procedure;

/** The default for every procedure: rejects calls without a session as UNAUTHORIZED. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
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
    if (!(await ctx.isMember(app, ctx.viewer.id))) {
      throw new TRPCError({ code: "FORBIDDEN", cause: new NotAMemberError() });
    }
    return next();
  });
