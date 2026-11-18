import { initTRPC, TRPCError } from "@trpc/server";
import type { Viewer } from "@shared-apps/auth";

export type Context = {
  /** Who is signed in, from a session apps/api verified for this call. Null when nobody is. */
  viewer: Viewer | null;
};

// isDev is fixed: tRPC's default reads NODE_ENV (env access outside apps/api,
// ADR 0012) and adds stack traces to responses. Stacks belong in the logs.
const t = initTRPC.context<Context>().create({ isDev: false });

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
