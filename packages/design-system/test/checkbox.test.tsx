import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "../src/index.ts";
import { get, render } from "./render.ts";

// Module scope: Qwik serializes values captured by $ handlers, so a local spy would be copied.
const onChange = vi.fn();

describe("Checkbox", () => {
  it("renders a native checkbox named by its visible label", async () => {
    const { screen } = await render(<Checkbox label="Arroz" name="arroz" />);
    const input = get<HTMLInputElement>(screen, "label.wfd-checkbox input");
    expect(input.getAttribute("type")).toBe("checkbox");
    expect(input.getAttribute("name")).toBe("arroz");
    expect(input.hasAttribute("checked")).toBe(false);
    expect(get(screen, "label.wfd-checkbox").textContent).toContain("Arroz");
  });

  it("renders the checked state with a check mark", async () => {
    const { screen } = await render(<Checkbox label="Arroz" checked />);
    expect(get<HTMLInputElement>(screen, "input").checked).toBe(true);
    expect(get(screen, ".wfd-checkbox__box use").getAttribute("href")).toMatch(/#i-check$/);
  });

  it("shows a hint next to the label", async () => {
    const { screen } = await render(<Checkbox label="Arroz" hint="2 xícaras" />);
    expect(get(screen, ".wfd-checkbox__hint").textContent).toBe("2 xícaras");
  });

  it("can be disabled", async () => {
    const { screen } = await render(<Checkbox label="Arroz" disabled />);
    expect(get(screen, "input").hasAttribute("disabled")).toBe(true);
  });

  it("reports the new checked state", async () => {
    const { screen, userEvent } = await render(
      <Checkbox label="Arroz" onChange$={(checked) => onChange(checked)} />,
    );
    const input = get<HTMLInputElement>(screen, "input");
    input.checked = true;
    await userEvent(input, "change");
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
