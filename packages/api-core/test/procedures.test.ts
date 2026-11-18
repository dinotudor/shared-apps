import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import type { Viewer } from "@shared-apps/auth";
import { adminProcedure, createCallerFactory, protectedProcedure, router } from "../src/index.ts";

const MEMBER: Viewer = { id: "user-1", name: "Ana Teste", role: "member" };
const ADMIN: Viewer = { id: "user-2", name: "Bruno Teste", role: "admin" };

const testRouter = router({
  whoAmI: protectedProcedure.query(({ ctx }) => ctx.viewer.id),
  adminOnly: adminProcedure.query(({ ctx }) => ctx.viewer.id),
});

const callerFor = (viewer: Viewer | null) => createCallerFactory(testRouter)({ viewer });

const codeOf = async (call: Promise<unknown>) => {
  const error: unknown = await call.catch((caught: unknown) => caught);
  return error instanceof TRPCError ? error.code : error;
};

describe("protectedProcedure", () => {
  it("rejects a call without a session as UNAUTHORIZED", async () => {
    expect(await codeOf(callerFor(null).whoAmI())).toBe("UNAUTHORIZED");
  });

  it("gives the procedure the signed-in viewer", async () => {
    expect(await callerFor(MEMBER).whoAmI()).toBe("user-1");
  });
});

describe("adminProcedure", () => {
  it("rejects a call without a session as UNAUTHORIZED", async () => {
    expect(await codeOf(callerFor(null).adminOnly())).toBe("UNAUTHORIZED");
  });

  it("rejects a member as FORBIDDEN", async () => {
    expect(await codeOf(callerFor(MEMBER).adminOnly())).toBe("FORBIDDEN");
  });

  it("lets an admin through", async () => {
    expect(await callerFor(ADMIN).adminOnly()).toBe("user-2");
  });
});
