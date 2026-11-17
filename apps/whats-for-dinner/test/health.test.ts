import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../src/server/api.ts";
import { ApiHealth } from "../src/api-health.ts";
import { getApiHealth } from "../src/server/health.ts";

// A mocked tRPC client with only the procedure the loader uses.
const clientWith = (query: () => Promise<{ ok: true }>) =>
  ({ health: { ping: { query } } }) as unknown as Pick<ApiClient, "health">;

describe("getApiHealth (home page loader)", () => {
  it("returns ok when the API answers the health ping", async () => {
    const report = vi.fn();

    const health = await getApiHealth(
      clientWith(() => Promise.resolve({ ok: true })),
      report,
    );

    expect(health).toBe(ApiHealth.Ok);
    expect(report).not.toHaveBeenCalled();
  });

  it("returns unreachable and reports the error when the call fails", async () => {
    const failure = new Error("fetch failed");
    const report = vi.fn();

    const health = await getApiHealth(
      clientWith(() => Promise.reject(failure)),
      report,
    );

    expect(health).toBe(ApiHealth.Unreachable);
    expect(report).toHaveBeenCalledExactlyOnceWith(failure);
  });
});
