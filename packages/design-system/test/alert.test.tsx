import { describe, expect, it } from "vitest";
import { Alert } from "../src/index.ts";
import { all, get, render } from "./render.ts";

describe("Alert", () => {
  it.each([
    ["warning", "alert", "Atenção"],
    ["info", "info", "Informação"],
    ["success", "check", "Sucesso"],
  ] as const)("renders the %s tone with its own icon and a spoken tone name", async (tone, icon, spoken) => {
    const { screen } = await render(
      <Alert tone={tone} title="Falta ingrediente">
        Sem arroz em casa.
      </Alert>,
    );
    const alert = get(screen, ".wfd-alert");
    expect(alert.classList.contains(`wfd-alert--${tone}`)).toBe(true);
    expect(get(alert, "use").getAttribute("href")).toMatch(new RegExp(`#i-${icon}$`));
    expect(get(alert, "svg").getAttribute("aria-label")).toBe(spoken);
    expect(get(alert, ".wfd-alert__title").textContent).toBe("Falta ingrediente");
    expect(get(alert, ".wfd-alert__body").textContent).toBe("Sem arroz em casa.");
  });

  it("can be just a line of text", async () => {
    const { screen } = await render(<Alert tone="info">Sem conexão.</Alert>);
    expect(all(screen, ".wfd-alert__title")).toHaveLength(0);
  });
});
