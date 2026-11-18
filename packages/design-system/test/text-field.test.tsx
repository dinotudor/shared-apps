import { describe, expect, it } from "vitest";
import { TextArea, TextField } from "../src/index.ts";
import { get, render } from "./render.ts";

const describedBy = (control: Element, root: HTMLElement) =>
  (control.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => get(root, `#${id}`).textContent);

describe.each([
  ["TextField", "input", TextField],
  ["TextArea", "textarea", TextArea],
] as const)("%s", (_, tag, Field) => {
  it("is labelled by an always-visible label", async () => {
    const { screen } = await render(<Field label="Dish name" name="name" value="Feijoada" />);
    const control = get(screen, tag) as HTMLInputElement;
    const label = get(screen, "label");
    expect(label.getAttribute("for")).toBe(control.id);
    expect(label.textContent).toBe("Dish name");
    expect(control.getAttribute("name")).toBe("name");
    expect(control.value).toBe("Feijoada");
    expect(control.hasAttribute("aria-invalid")).toBe(false);
  });

  it("links its hint to the control", async () => {
    const { screen } = await render(<Field label="Notas" hint="Optional" />);
    expect(describedBy(get(screen, tag), screen)).toEqual(["Optional"]);
  });

  it("shows an error with an icon, linked to the control and marked invalid", async () => {
    const { screen } = await render(
      <Field label="Dish name" hint="What the family calls it" error="Give the dish a name." />,
    );
    const control = get(screen, tag);
    expect(control.getAttribute("aria-invalid")).toBe("true");
    expect(describedBy(control, screen)).toEqual([
      "What the family calls it",
      "Give the dish a name.",
    ]);
    expect(get(screen, ".wfd-field__error use").getAttribute("href")).toMatch(/#i-alert$/);
  });

  it("keeps descriptions the caller links, after its own", async () => {
    const { screen } = await render(
      <div>
        <p id="rules">Up to 40 letters.</p>
        <Field label="Dish name" hint="Optional" aria-describedby="rules" />
      </div>,
    );
    expect(describedBy(get(screen, tag), screen)).toEqual(["Optional", "Up to 40 letters."]);
  });

  it("respects aria-invalid set by the caller", async () => {
    const { screen } = await render(<Field label="Dish name" aria-invalid="true" />);
    expect(get(screen, tag).getAttribute("aria-invalid")).toBe("true");
  });
});

describe("TextField", () => {
  it("renders a leading icon for search fields", async () => {
    const { screen } = await render(<TextField label="Search" type="search" icon="search" />);
    expect(get(screen, "input").getAttribute("type")).toBe("search");
    expect(get(screen, ".wfd-field__control svg").getAttribute("aria-hidden")).toBe("true");
  });
});

describe("TextArea", () => {
  it("uses three rows unless told otherwise", async () => {
    const { screen } = await render(<TextArea label="Method" />);
    expect(get(screen, "textarea").getAttribute("rows")).toBe("3");
  });
});
