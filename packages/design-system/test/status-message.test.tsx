import { describe, expect, it } from "vitest";
import { Button, StatusMessage } from "../src/index.ts";
import { all, get, render } from "./render.ts";

describe("StatusMessage", () => {
  it("renders a title, body text and a decorative icon", async () => {
    const { screen } = await render(
      <StatusMessage icon="search" title="Página não encontrada">
        O endereço pode ter mudado.
      </StatusMessage>,
    );
    const status = get(screen, ".wfd-status");
    expect(get(status, "h2").textContent).toBe("Página não encontrada");
    // A div, so the body can hold block content.
    expect(get(status, "div.wfd-status__body").textContent).toBe("O endereço pode ter mudado.");
    expect(get(status, "use").getAttribute("href")).toMatch(/#i-search$/);
    // The title says it all, so the icon is hidden from screen readers.
    expect(get(status, "svg").getAttribute("aria-hidden")).toBe("true");
  });

  it("uses the heading level it is given, so it can be the page heading", async () => {
    const { screen } = await render(<StatusMessage title="Página não encontrada" level={1} />);
    expect(all(screen, "h1").map((heading) => heading.textContent)).toEqual([
      "Página não encontrada",
    ]);
    expect(all(screen, "h2")).toHaveLength(0);
  });

  it("shows the decorative logo mark when no icon is given", async () => {
    const { screen } = await render(<StatusMessage title="Nenhum prato ainda" />);
    const status = get(screen, ".wfd-status");
    expect(all(status, "svg")).toHaveLength(0);
    const images = all<HTMLImageElement>(status, "img");
    expect(images.length).toBeGreaterThan(0);
    expect(images.every((image) => image.getAttribute("alt") === "")).toBe(true);
  });

  it("renders the action slot below the text", async () => {
    const { screen } = await render(
      <StatusMessage title="Página não encontrada">
        O endereço pode ter mudado.
        <Button q:slot="action">Voltar ao início</Button>
      </StatusMessage>,
    );
    const action = get(screen, ".wfd-status__action");
    expect(get(action, "button").textContent).toBe("Voltar ao início");
    expect(get(screen, ".wfd-status__body").textContent).toBe("O endereço pode ter mudado.");
  });
});
