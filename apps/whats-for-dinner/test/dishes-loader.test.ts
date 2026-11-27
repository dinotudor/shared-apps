import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../src/server/api.ts";
import { loadDishes } from "../src/server/dishes.ts";

type ListInput = Parameters<ApiClient["dishes"]["list"]["query"]>[0];

const summary = (id: string, name: string) => ({
  id,
  name,
  createdById: "user-1",
  createdAt: "2026-11-20T18:00:00.000Z",
  updatedAt: "2026-11-20T18:00:00.000Z",
});

// A mocked tRPC client with only the procedure the loader uses.
const clientWith = (query: (input: ListInput) => Promise<unknown>) =>
  ({ dishes: { list: { query } } }) as unknown as Pick<ApiClient, "dishes">;

const url = (search: string) => new URL(`http://localhost/dishes/${search}`);

describe("loadDishes (Dishes page loader)", () => {
  it("asks the API for the search and sort in the URL", async () => {
    const query = vi.fn<(input: ListInput) => Promise<unknown>>(() => Promise.resolve([]));

    const page = await loadDishes(clientWith(query), url("?q=ricota&sort=recent"), vi.fn());

    expect(query).toHaveBeenCalledExactlyOnceWith({ search: "ricota", sort: "recent" });
    expect(page.query).toEqual({ search: "ricota", sort: "recent" });
  });

  it("sorts by most cooked when the URL asks for no sort or an unknown one", async () => {
    const query = vi.fn<(input: ListInput) => Promise<unknown>>(() => Promise.resolve([]));

    const plain = await loadDishes(clientWith(query), url(""), vi.fn());
    const unknown = await loadDishes(clientWith(query), url("?sort=tastiest"), vi.fn());

    expect(plain.query).toEqual({ search: "", sort: "mostCooked" });
    expect(unknown.query.sort).toBe("mostCooked");
    expect(query).toHaveBeenNthCalledWith(1, { search: undefined, sort: "mostCooked" });
  });

  it("trims the search and leaves out one that is only spaces", async () => {
    const query = vi.fn<(input: ListInput) => Promise<unknown>>(() => Promise.resolve([]));

    const page = await loadDishes(clientWith(query), url("?q=%20%20"), vi.fn());

    expect(query).toHaveBeenCalledExactlyOnceWith({ search: undefined, sort: "mostCooked" });
    expect(page.query.search).toBe("");
  });

  it("cuts a search longer than the API accepts instead of failing", async () => {
    const query = vi.fn<(input: ListInput) => Promise<unknown>>(() => Promise.resolve([]));

    await loadDishes(clientWith(query), url(`?q=${"a".repeat(200)}`), vi.fn());

    expect(query.mock.calls[0]?.[0]?.search).toHaveLength(120);
  });

  it("returns each dish's id and name, with no ratings or photo until #22 and #23", async () => {
    const page = await loadDishes(
      clientWith(() => Promise.resolve([summary("d1", "Moqueca"), summary("d2", "Strogonoff")])),
      url(""),
      vi.fn(),
    );

    expect(page.result).toEqual({
      ok: true,
      dishes: [
        { id: "d1", name: "Moqueca", ratings: null, photoUrl: null },
        { id: "d2", name: "Strogonoff", ratings: null, photoUrl: null },
      ],
    });
  });

  it("reports the error and returns a failure when the API call fails", async () => {
    const failure = new Error("fetch failed");
    const report = vi.fn();

    const page = await loadDishes(
      clientWith(() => Promise.reject(failure)),
      url("?q=moqueca"),
      report,
    );

    expect(page.result).toEqual({ ok: false });
    expect(page.query.search).toBe("moqueca");
    expect(report).toHaveBeenCalledExactlyOnceWith(failure);
  });
});
