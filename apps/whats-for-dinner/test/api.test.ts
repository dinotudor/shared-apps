import { afterEach, describe, expect, it, vi } from "vitest";
import type { RequestEventBase } from "@qwik.dev/router";
import { apiFor } from "../src/server/api.ts";
import { fakeCookie } from "./fake-cookie.ts";

// Only the parts of the request event that apiFor reads.
const eventWith = (
  env: Record<string, string>,
  headers: Record<string, string> = {},
  cookie = fakeCookie(),
) =>
  ({
    env: { get: (key: string) => env[key] },
    request: new Request("http://web.test/", { headers }),
    ...cookie.event,
  }) as unknown as RequestEventBase;

const trpcResponse = (data: unknown) =>
  new Response(JSON.stringify({ result: { data } }), {
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFor", () => {
  it("calls the API at API_URL/trpc and forwards the session cookie", async () => {
    const fetch = vi.fn(() => Promise.resolve(trpcResponse({ ok: true })));
    vi.stubGlobal("fetch", fetch);
    const event = eventWith({ API_URL: "http://api.test/" }, { cookie: "session=abc" });

    const result = await apiFor(event).health.ping.query();

    expect(result).toEqual({ ok: true });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api.test/trpc/health.ping");
    expect(new Headers(init.headers).get("cookie")).toBe("session=abc");
  });

  it("passes a renewed session cookie from the API on to the browser", async () => {
    const response = trpcResponse({ ok: true });
    response.headers.append("set-cookie", "better-auth.session_token=new; Path=/; HttpOnly");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(response)),
    );
    const cookie = fakeCookie();

    await apiFor(eventWith({ API_URL: "http://api.test/" }, {}, cookie)).health.ping.query();

    expect(cookie.set).toHaveBeenCalledExactlyOnceWith("better-auth.session_token", "new", {
      path: "/",
      httpOnly: true,
    });
  });

  it("rejects an invalid API_URL", () => {
    expect(() => apiFor(eventWith({ API_URL: "not a url" }))).toThrow("API_URL is not a valid URL");
  });
});
