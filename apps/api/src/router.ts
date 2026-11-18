import { protectedProcedure, publicProcedure, router } from "@shared-apps/api-core";

// Health lives here, not in modules/: it has no business rules or tables.
const healthRouter = router({
  ping: publicProcedure.query(() => ({ ok: true as const })),
});

// Who is signed in, for the frontends' header and guard. Sign-in itself happens under
// /api/auth (Better Auth), not in tRPC.
const viewerRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.viewer),
});

export const appRouter = router({
  health: healthRouter,
  viewer: viewerRouter,
});

export type AppRouter = typeof appRouter;
