import { TRPCClientError } from "@trpc/client";
import { describe, expect, it } from "vitest";
import { viewerFromApi } from "../src/server/viewer.ts";

const errorWithCode = (code: string) =>
  new TRPCClientError(code, { result: { error: { message: code, code: -1, data: { code } } } });

const apiThat = (query: () => Promise<unknown>) =>
  ({ viewer: { me: { query } } }) as unknown as Parameters<typeof viewerFromApi>[0];

describe("viewerFromApi", () => {
  it("returns the signed-in viewer", async () => {
    const ana = { id: "user-1", name: "Ana Teste", role: "member" };

    expect(await viewerFromApi(apiThat(() => Promise.resolve(ana)))).toEqual(ana);
  });

  it("returns null when the API says nobody is signed in", async () => {
    const api = apiThat(() => Promise.reject(errorWithCode("UNAUTHORIZED")));

    expect(await viewerFromApi(api)).toBeNull();
  });

  it("fails, rather than signing the visitor out, when the API is down", async () => {
    const down = new TRPCClientError("fetch failed");

    await expect(viewerFromApi(apiThat(() => Promise.reject(down)))).rejects.toBe(down);
  });
});
