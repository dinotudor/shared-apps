import { describe, expect, it, vi } from "vitest";
import { Button } from "../src/index.ts";
import { get, render } from "./render.ts";

// Module scope: Qwik serializes values captured by $ handlers, so a local spy would be copied.
const onClick = vi.fn<() => void>();

describe("Button", () => {
  it.each(["primary", "secondary", "text", "danger"] as const)(
    "renders the %s variant as a non-submitting button",
    async (variant) => {
      const { screen } = await render(<Button variant={variant}>Salvar</Button>);
      const button = get(screen, "button");
      expect(button.classList.contains(`wfd-button--${variant}`)).toBe(true);
      expect(button.getAttribute("type")).toBe("button");
      expect(button.textContent).toBe("Salvar");
    },
  );

  it("is primary by default", async () => {
    const { screen } = await render(<Button>Planejar</Button>);
    expect(get(screen, "button").classList.contains("wfd-button--primary")).toBe(true);
  });

  it("submits forms when asked to", async () => {
    const { screen } = await render(<Button type="submit">Enviar</Button>);
    expect(get(screen, "button").getAttribute("type")).toBe("submit");
  });

  it("shows a decorative icon before the label", async () => {
    const { screen } = await render(<Button icon="plus">Novo prato</Button>);
    expect(get(screen, "button svg").getAttribute("aria-hidden")).toBe("true");
    expect(get(screen, "button use").getAttribute("href")).toMatch(/#i-plus$/);
  });

  it("can be disabled", async () => {
    const { screen } = await render(<Button disabled>Salvar</Button>);
    expect(get(screen, "button").hasAttribute("disabled")).toBe(true);
  });

  it("calls onClick$ when pressed", async () => {
    const { screen, userEvent } = await render(
      <Button
        onClick$={() => {
          onClick();
        }}
      >
        Salvar
      </Button>,
    );
    await userEvent(get(screen, "button"), "click");
    expect(onClick).toHaveBeenCalledOnce();
  });
});
