import { describe, expect, it } from "vitest";
import { LoadingState } from "../src/index.ts";
import { all, get, render } from "./render.ts";

describe("LoadingState", () => {
  it("announces the guide's loading copy politely, with the logo mark as decoration", async () => {
    const { screen } = await render(<LoadingState />);
    const loading = get(screen, ".wfd-loading");
    expect(loading.getAttribute("role")).toBe("status");
    expect(get(loading, ".wfd-loading__label").textContent).toBe("Thinking about dinner…");
    const images = all<HTMLImageElement>(loading, "img");
    expect(images.length).toBeGreaterThan(0);
    expect(images.every((image) => image.getAttribute("alt") === "")).toBe(true);
  });

  it("shows placeholder blocks hidden from screen readers", async () => {
    const { screen } = await render(<LoadingState blocks={3} />);
    const skeleton = get(screen, ".wfd-loading__skeleton");
    expect(skeleton.getAttribute("aria-hidden")).toBe("true");
    expect(all(skeleton, ".wfd-skeleton")).toHaveLength(3);
  });

  it("accepts a different label", async () => {
    const { screen } = await render(<LoadingState label="Loading dishes…" />);
    expect(get(screen, ".wfd-loading__label").textContent).toBe("Loading dishes…");
  });
});
