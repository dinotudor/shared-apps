import { describe, expect, it } from "vitest";
import { navCurrent } from "../src/navigation.ts";

describe("navCurrent", () => {
  it.each([
    ["/", "/"],
    ["/day/2026-11-12/", "/"],
    ["/day/2026-11-12/plan/", "/"],
    ["/dishes/", "/dishes/"],
    ["/dishes", "/dishes/"],
    ["/dishes/42/", "/dishes/"],
    ["/dishes/new/", "/dishes/"],
  ])("puts %s under the tab %s", (pathname, tab) => {
    expect(navCurrent(pathname)).toBe(tab);
  });

  it.each(["/design-system/", "/sign-in/", "/dishesx/", "/daylight/", "/nope/"])(
    "puts %s under no tab",
    (pathname) => {
      expect(navCurrent(pathname)).toBeUndefined();
    },
  );
});
