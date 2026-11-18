import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "../src/index.ts";
import { get, render } from "./render.ts";

// Module scope: Qwik serializes values captured by $ handlers, so a local spy would be copied.
const onChange = vi.fn<(checked: boolean) => void>();

describe("Checkbox", () => {
  it("renders a native checkbox named by its visible label", async () => {
    const { screen } = await render(<Checkbox label="Rice" name="arroz" />);
    const input = get(screen, "label.wfd-checkbox input") as HTMLInputElement;
    expect(input.getAttribute("type")).toBe("checkbox");
    expect(input.getAttribute("name")).toBe("arroz");
    expect(input.hasAttribute("checked")).toBe(false);
    expect(get(screen, "label.wfd-checkbox").textContent).toContain("Rice");
  });

  it("renders the checked state with a check mark", async () => {
    const { screen } = await render(<Checkbox label="Rice" checked />);
    expect((get(screen, "input") as HTMLInputElement).checked).toBe(true);
    expect(get(screen, ".wfd-checkbox__box use").getAttribute("href")).toMatch(/#i-check$/);
  });

  it("shows a hint next to the label", async () => {
    const { screen } = await render(<Checkbox label="Rice" hint="2 cups" />);
    expect(get(screen, ".wfd-checkbox__hint").textContent).toBe("2 cups");
  });

  it("can be disabled", async () => {
    const { screen } = await render(<Checkbox label="Rice" disabled />);
    expect(get(screen, "input").hasAttribute("disabled")).toBe(true);
  });

  it("reports the new checked state", async () => {
    const { screen, userEvent } = await render(
      <Checkbox
        label="Rice"
        onChange$={(checked) => {
          onChange(checked);
        }}
      />,
    );
    const input = get(screen, "input") as HTMLInputElement;
    input.checked = true;
    await userEvent(input, "change");
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
