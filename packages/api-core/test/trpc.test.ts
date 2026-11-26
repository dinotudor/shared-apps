import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { describe, expect, it } from "vitest";
import type { Viewer } from "@shared-apps/auth";
import {
  App,
  DomainError,
  DomainErrorKind,
  memberProcedure,
  NotAMemberError,
  protectedProcedure,
  publicProcedure,
  router,
} from "../src/index.ts";

// Errors a module could declare, with codes api-core has never heard of.
class ThingNotFoundError extends DomainError {
  override name = "ThingNotFoundError";
  readonly code = "thing_not_found";
  readonly kind = DomainErrorKind.NotFound;
}

class ThingRuleError extends DomainError {
  override name = "ThingRuleError";
  readonly code = "thing_rule_broken";
  readonly kind = DomainErrorKind.RuleViolated;
}

class ThingForbiddenError extends DomainError {
  override name = "ThingForbiddenError";
  readonly code = "thing_not_yours";
  readonly kind = DomainErrorKind.Forbidden;
}

const VIEWER: Viewer = { id: "user-1", name: "Ana Teste", role: "member" };

const testRouter = router({
  fails: publicProcedure.query(() => {
    throw new Error("internal detail");
  }),
  notFound: publicProcedure.query(() => {
    throw new TRPCError({ code: "NOT_FOUND", message: "No such thing" });
  }),
  dinnerOnly: memberProcedure(App.WhatsForDinner).query(() => "ok"),
  // A rule broken inside a procedure, the way a module's service throws one.
  breaksRule: protectedProcedure.query(() => {
    throw new NotAMemberError();
  }),
  breaksRuleSignedOut: publicProcedure.query(() => {
    throw new NotAMemberError();
  }),
  thingNotFound: publicProcedure.query(() => {
    throw new ThingNotFoundError();
  }),
  thingRuleBroken: publicProcedure.query(() => {
    throw new ThingRuleError();
  }),
  thingNotYours: publicProcedure.query(() => {
    throw new ThingForbiddenError();
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

  it("give callers a generic message for an unexpected error, not its own message", async () => {
    const { body } = await call("fails");

    expect(JSON.stringify(body)).not.toContain("internal detail");
    expect(body).toMatchObject({ error: { message: "Internal server error" } });
  });

  it("keep the message of an error a procedure throws on purpose", async () => {
    const { body } = await call("notFound");

    expect(body).toMatchObject({ error: { message: "No such thing" } });
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

  it("map a module's not_found error to NOT_FOUND, keeping its own code", async () => {
    const { status, body } = await call("thingNotFound");

    expect(status).toBe(404);
    expect(body).toMatchObject({
      error: { data: { code: "NOT_FOUND", domainCode: "thing_not_found" } },
    });
  });

  it("map a module's rule_violated error to BAD_REQUEST, keeping its own code", async () => {
    const { status, body } = await call("thingRuleBroken");

    expect(status).toBe(400);
    expect(body).toMatchObject({
      error: { data: { code: "BAD_REQUEST", domainCode: "thing_rule_broken" } },
    });
  });

  it("map a module's forbidden error to FORBIDDEN, keeping its own code", async () => {
    const { status, body } = await call("thingNotYours");

    expect(status).toBe(403);
    expect(body).toMatchObject({
      error: { data: { code: "FORBIDDEN", domainCode: "thing_not_yours" } },
    });
  });
});
