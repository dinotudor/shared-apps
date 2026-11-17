import { initTRPC } from "@trpc/server";

// Empty until sign-in (#15) adds the verified session.
export type Context = Record<string, never>;

// isDev is fixed: tRPC's default reads NODE_ENV (env access outside apps/api,
// ADR 0012) and adds stack traces to responses. Stacks belong in the logs.
const t = initTRPC.context<Context>().create({ isDev: false });

export const router = t.router;
export const publicProcedure = t.procedure;
