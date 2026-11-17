import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { describe, expect, it } from "vitest";
import { publicProcedure, router } from "../src/index.ts";

const testRouter = router({
  fails: publicProcedure.query(() => {
    throw new Error("internal detail");
  }),
});

const call = async (path: string) => {
  const response = await fetchRequestHandler({
    endpoint: "/trpc",
    req: new Request(`http://localhost/trpc/${path}`),
    router: testRouter,
    createContext: () => ({}),
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
});
