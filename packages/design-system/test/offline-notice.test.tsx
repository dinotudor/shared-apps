import { describe, expect, it } from "vitest";
import { OfflineNotice } from "../src/index.ts";
import { get, render } from "./render.ts";

describe("OfflineNotice", () => {
  it("shows the brief's offline copy, without humour", async () => {
    const { screen } = await render(<OfflineNotice />);
    const notice = get(screen, ".wfd-alert");
    expect(get(notice, ".wfd-alert__title").textContent).toBe("No connection.");
    expect(get(notice, ".wfd-alert__body").textContent).toBe(
      "What you've already seen is still here.",
    );
  });

  it("uses the offline icon as decoration, since the title says it", async () => {
    const { screen } = await render(<OfflineNotice />);
    expect(get(screen, "use").getAttribute("href")).toMatch(/#i-offline$/);
    expect(get(screen, "svg").getAttribute("aria-hidden")).toBe("true");
  });
});
