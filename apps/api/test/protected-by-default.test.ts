import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { createCallerFactory } from "@shared-apps/api-core";
import { createAppRouter } from "../src/router.ts";
import { unusedModules } from "./support/unused-modules.ts";

// Procedures anyone may call without signing in. Adding one here is a decision, and
// review should see it: everything else must reject a call without a session.
const PUBLIC_PROCEDURES = ["health.ping"];

// The session check runs before any module is called, so the modules are never used.
const appRouter = createAppRouter(unusedModules);

const procedures = Object.keys(appRouter._def.procedures);

/** Calls a procedure by its dotted path, with no session and no input. */
const callSignedOut = (path: string): Promise<unknown> => {
  const caller: unknown = createCallerFactory(appRouter)({
    viewer: null,
    isMemberOf: () => Promise.resolve(false),
  });
  const procedure = path
    .split(".")
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], caller);
  return (procedure as () => Promise<unknown>)();
};

describe("procedures are protected by default", () => {
  it("finds the procedures in the router", () => {
    // Guards the test itself: an empty list would make every check below pass.
    expect(procedures).toContain("health.ping");
    expect(procedures).toContain("viewer.me");
    expect(procedures).toContain("dishes.list");
  });

  it.each(procedures.filter((path) => !PUBLIC_PROCEDURES.includes(path)))(
    "%s rejects a call without a session as UNAUTHORIZED",
    async (path) => {
      // Missing input would fail validation first, but the session check runs before it.
      const error: unknown = await callSignedOut(path).catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("UNAUTHORIZED");
    },
  );

  it.each(PUBLIC_PROCEDURES)("%s, which is public, answers without a session", async (path) => {
    await expect(callSignedOut(path)).resolves.toBeDefined();
  });
});
