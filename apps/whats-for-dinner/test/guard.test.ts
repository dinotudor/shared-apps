import { describe, expect, it, vi } from "vitest";
import type { RequestEvent } from "@qwik.dev/router";
import { requireViewer, viewerFrom } from "../src/server/guard.ts";
import type { Viewer } from "../src/server/viewer.ts";

const ANA: Viewer = { id: "user-1", name: "Ana Teste", role: "member" };

// Only the parts of the request event the guard uses. redirect() returns the value
// Qwik expects the handler to throw, so the fake returns something easy to compare.
const eventFor = (path: string) =>
  ({
    url: new URL(path, "http://app.test"),
    sharedMap: new Map<string, unknown>(),
    redirect: (status: number, url: string) => ({ redirect: { status, url } }),
  }) as unknown as RequestEvent;

describe("requireViewer", () => {
  it("sends a signed-out visitor to sign-in, remembering the page they asked for", async () => {
    const event = eventFor("/dishes/42/?tab=notes");
    await expect(requireViewer(event, () => Promise.resolve(null))).rejects.toEqual({
      redirect: { status: 302, url: "/sign-in/?next=%2Fdishes%2F42%2F%3Ftab%3Dnotes" },
    });
  });

  it("leaves Qwik's internal query parameters out of the page it remembers", async () => {
    // A session that expires while an action is submitted: Qwik adds ?qaction=<id>.
    const event = eventFor("/dishes/42/?tab=notes&qaction=abc123&qfunc=f1&qdata=d1");
    await expect(requireViewer(event, () => Promise.resolve(null))).rejects.toEqual({
      redirect: { status: 302, url: "/sign-in/?next=%2Fdishes%2F42%2F%3Ftab%3Dnotes" },
    });
  });

  it("lets a signed-in viewer through and shares them with the page", async () => {
    const event = eventFor("/dishes/");
    await requireViewer(event, () => Promise.resolve(ANA));
    expect(viewerFrom(event)).toEqual(ANA);
  });

  it("leaves the sign-in page open to signed-out visitors", async () => {
    const getViewer = vi.fn(() => Promise.resolve(null));
    await requireViewer(eventFor("/sign-in/"), getViewer);
    expect(getViewer).not.toHaveBeenCalled();
  });
});

describe("viewerFrom", () => {
  it("returns null when the guard did not run or found no viewer", () => {
    expect(viewerFrom(eventFor("/sign-in/"))).toBeNull();
  });
});
