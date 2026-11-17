import { describe, expect, it } from "vitest";
import { Card } from "../src/index.ts";
import { get, render } from "./render.ts";

describe("Card", () => {
  it("renders its content on a surface", async () => {
    const { screen } = await render(
      <Card>
        <h4>Feijoada</h4>
      </Card>,
    );
    const card = get(screen, ".wfd-card");
    expect(card.tagName.toLowerCase()).toBe("div");
    expect(get(card, "h4").textContent).toBe("Feijoada");
  });

  it("can be an article or a section for landmarks and lists", async () => {
    const { screen } = await render(<Card as="article">Prato</Card>);
    expect(get(screen, ".wfd-card").tagName.toLowerCase()).toBe("article");
  });
});
