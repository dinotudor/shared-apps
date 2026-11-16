import { initTRPC } from "@trpc/server";

// Empty until sign-in (#15) adds the verified session.
export type Context = Record<string, never>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
