import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { describe, expect, it } from "vitest";
import type { Viewer } from "@shared-apps/auth";
import {
  App,
  memberProcedure,
  NotAMemberError,
  protectedProcedure,
  publicProcedure,
  router,
} from "../src/index.ts";

const VIEWER: Viewer = { id: "user-1", name: "Ana Teste", role: "member" };

const testRouter = router({
  fails: publicProcedure.query(() => {
    throw new Error("internal detail");
  }),
  dinnerOnly: memberProcedure(App.WhatsForDinner).query(() => "ok"),
  // A rule broken inside a procedure, the way a module's service throws one.
  breaksRule: protectedProcedure.query(() => {
    throw new NotAMemberError();
  }),
  breaksRuleSignedOut: publicProcedure.query(() => {
    throw new NotAMemberError();
  }),
});

const call = async (path: string) => {
  const response = await fetchRequestHandler({
    endpoint: "/trpc",
    req: new Request(`http://localhost/trpc/${path}`),
    router: testRouter,
    createContext: () => ({ viewer: VIEWER, isMemberOf: () => Promise.resolve(false) }),
  });
  return { status: response.status, body: (await response.json()) as unknown };
};

describe("tRPC errors", () => {
  it("never send a stack trace to callers, whatever NODE_ENV is", async () => {
    // Vitest sets NODE_ENV=test, which tRPC's default treats as development.
    const { status, body } = await call("fails");

    expect(status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("carry a stable domain code the frontend can branch on, such as not_a_member", async () => {
    const { status, body } = await call("dinnerOnly");

    expect(status).toBe(403);
    expect(body).toMatchObject({
      error: { data: { code: "FORBIDDEN", domainCode: "not_a_member" } },
    });
  });

  it("map a domain error thrown inside a procedure to its status, not a 500", async () => {
    const { status, body } = await call("breaksRule");

    expect(status).toBe(403);
    expect(body).toMatchObject({
      error: { data: { code: "FORBIDDEN", domainCode: "not_a_member" } },
    });
  });

  it("map a domain error the same way on a public procedure", async () => {
    const { status } = await call("breaksRuleSignedOut");

    expect(status).toBe(403);
  });
});
