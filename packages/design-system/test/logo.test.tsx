import { describe, expect, it } from "vitest";
import { Logo } from "../src/index.ts";
import { all, render } from "./render.ts";

const images = (screen: HTMLElement) => all<HTMLImageElement>(screen, "img");

describe("Logo", () => {
  it("renders the 30 px mark in a light and a dark version, switched by the theme", async () => {
    const { screen } = await render(<Logo variant="mark" />);
    const [light, dark] = images(screen);
    expect(light.getAttribute("src")).toMatch(/wfd-mark-light\.svg$/);
    expect(light.classList.contains("wfd-logo--light")).toBe(true);
    expect(dark.getAttribute("src")).toMatch(/wfd-mark-dark\.svg$/);
    expect(dark.classList.contains("wfd-logo--dark")).toBe(true);
    expect(light.getAttribute("height")).toBe("30");
  });

  it("renders the lockup with the app name as alternative text", async () => {
    const { screen } = await render(<Logo variant="lockup" height={40} />);
    for (const img of images(screen)) {
      expect(img.getAttribute("src")).toMatch(/wfd-lockup-(light|dark)\.svg$/);
      expect(img.getAttribute("alt")).toBe("What's for dinner?");
      expect(img.getAttribute("height")).toBe("40");
    }
  });

  it("can be decorative when the name is already on screen", async () => {
    const { screen } = await render(<Logo variant="mark" decorative />);
    for (const img of images(screen)) expect(img.getAttribute("alt")).toBe("");
  });
});
