import { publicProcedure, router } from "@shared-apps/api-core";

// Health lives here, not in modules/: it has no business rules or tables.
const healthRouter = router({
  ping: publicProcedure.query(() => ({ ok: true as const })),
});

export const appRouter = router({
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
