import { protectedProcedure, publicProcedure, router } from "@shared-apps/api-core";
import { dishesRouter } from "@shared-apps/dishes";
import type { Dishes } from "@shared-apps/dishes";

// Health lives here, not in modules/: it has no business rules or tables.
const healthRouter = router({
  ping: publicProcedure.query(() => ({ ok: true as const })),
});

// Who is signed in, for the frontends' header and guard. Sign-in itself happens under
// /api/auth (Better Auth), not in tRPC.
const viewerRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.viewer),
});

/** The module instances the procedures call, built once in main.ts. */
export type Modules = { dishes: Dishes };

export const createAppRouter = ({ dishes }: Modules) =>
  router({
    health: healthRouter,
    viewer: viewerRouter,
    // What's for dinner. Every procedure is for its members only.
    dishes: dishesRouter(dishes),
  });

export type AppRouter = ReturnType<typeof createAppRouter>;
