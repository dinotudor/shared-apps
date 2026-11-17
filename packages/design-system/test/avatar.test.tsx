import { describe, expect, it } from "vitest";
import { Avatar } from "../src/index.ts";
import { get, render } from "./render.ts";

describe("Avatar", () => {
  it("shows up to two initials and is named after the person", async () => {
    const { screen } = await render(<Avatar name="Ana Maria Souza" />);
    const avatar = get(screen, ".wfd-avatar");
    expect(avatar.getAttribute("role")).toBe("img");
    expect(avatar.getAttribute("aria-label")).toBe("Ana Maria Souza");
    expect(avatar.textContent).toBe("AS");
    expect(avatar.classList.contains("wfd-avatar--32")).toBe(true);
  });

  it("uses one initial for a single name", async () => {
    const { screen } = await render(<Avatar name="ana" />);
    expect(get(screen, ".wfd-avatar").textContent).toBe("A");
  });

  it.each([24, 40, 56] as const)("renders at %i px", async (size) => {
    const { screen } = await render(<Avatar name="Ana" size={size} />);
    expect(get(screen, ".wfd-avatar").classList.contains(`wfd-avatar--${size}`)).toBe(true);
  });

  it("shows a photo when there is one", async () => {
    const { screen } = await render(<Avatar name="Ana" src="/ana.jpg" />);
    const img = get(screen, ".wfd-avatar img");
    expect(img.getAttribute("src")).toBe("/ana.jpg");
    expect(img.getAttribute("alt")).toBe("Ana");
  });
});
