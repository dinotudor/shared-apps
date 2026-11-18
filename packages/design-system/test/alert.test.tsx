import { describe, expect, it } from "vitest";
import { Alert } from "../src/index.ts";
import { all, get, render } from "./render.ts";

describe("Alert", () => {
  it.each([
    ["warning", "alert", "Warning"],
    ["info", "info", "Information"],
    ["success", "check", "Success"],
  ] as const)(
    "renders the %s variant with its own icon and a spoken name",
    async (variant, icon, spoken) => {
      const { screen } = await render(
        <Alert variant={variant} title="Missing ingredient">
          Sem arroz em casa.
        </Alert>,
      );
      const alert = get(screen, ".wfd-alert");
      expect(alert.classList.contains(`wfd-alert--${variant}`)).toBe(true);
      expect(get(alert, "use").getAttribute("href")).toMatch(new RegExp(`#i-${icon}$`));
      expect(get(alert, "svg").getAttribute("aria-label")).toBe(spoken);
      expect(get(alert, ".wfd-alert__title").textContent).toBe("Missing ingredient");
      // A div, not a p, so block content stays valid HTML.
      expect(get(alert, "div.wfd-alert__body").textContent).toBe("Sem arroz em casa.");
    },
  );

  it("can be just a line of text", async () => {
    const { screen } = await render(<Alert variant="info">No connection.</Alert>);
    expect(all(screen, ".wfd-alert__title")).toHaveLength(0);
  });
});
