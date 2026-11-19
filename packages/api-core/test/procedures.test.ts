import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import type { Viewer } from "@shared-apps/auth";
import {
  adminProcedure,
  App,
  createCallerFactory,
  memberProcedure,
  protectedProcedure,
  router,
} from "../src/index.ts";

const MEMBER: Viewer = { id: "user-1", name: "Ana Teste", role: "member" };
const ADMIN: Viewer = { id: "user-2", name: "Bruno Teste", role: "admin" };

const testRouter = router({
  whoAmI: protectedProcedure.query(({ ctx }) => ctx.viewer.id),
  adminOnly: adminProcedure.query(({ ctx }) => ctx.viewer.id),
  dinnerOnly: memberProcedure(App.WhatsForDinner).query(({ ctx }) => ctx.viewer.id),
});

/** `members` are the viewer IDs that are members of What's for dinner, the only app so far. */
const callerFor = (viewer: Viewer | null, members: readonly string[] = []) =>
  createCallerFactory(testRouter)({
    viewer,
    isMemberOf: () => Promise.resolve(viewer !== null && members.includes(viewer.id)),
  });

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

describe("memberProcedure", () => {
  it("rejects a call without a session as UNAUTHORIZED", async () => {
    expect(await codeOf(callerFor(null).dinnerOnly())).toBe("UNAUTHORIZED");
  });

  it("rejects a signed-in collaborator who is not a member of the app as FORBIDDEN", async () => {
    expect(await codeOf(callerFor(MEMBER).dinnerOnly())).toBe("FORBIDDEN");
  });

  it("rejects an admin who is not a member of the app as FORBIDDEN", async () => {
    expect(await codeOf(callerFor(ADMIN).dinnerOnly())).toBe("FORBIDDEN");
  });

  it("lets a member of the app through", async () => {
    expect(await callerFor(MEMBER, [MEMBER.id]).dinnerOnly()).toBe("user-1");
  });
});
