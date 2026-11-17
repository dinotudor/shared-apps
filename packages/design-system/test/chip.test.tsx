import { describe, expect, it, vi } from "vitest";
import { Chip } from "../src/index.ts";
import { all, get, render } from "./render.ts";

// Module scope: Qwik serializes values captured by $ handlers, so a local spy would be copied.
const onClick = vi.fn();

describe("Chip", () => {
  it("renders an unselected toggle", async () => {
    const { screen } = await render(<Chip>Massas</Chip>);
    const chip = get(screen, "button.wfd-chip");
    expect(chip.getAttribute("type")).toBe("button");
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    expect(all(chip, "svg")).toHaveLength(0);
  });

  it("marks the selected state with a check mark as well as colour", async () => {
    const { screen } = await render(<Chip selected>Massas</Chip>);
    const chip = get(screen, "button.wfd-chip");
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    expect(get(chip, "use").getAttribute("href")).toMatch(/#i-check$/);
  });

  it("calls onClick$ when toggled", async () => {
    const { screen, userEvent } = await render(
      <Chip onClick$={() => onClick()}>Massas</Chip>,
    );
    await userEvent(get(screen, "button"), "click");
    expect(onClick).toHaveBeenCalledOnce();
  });
});
