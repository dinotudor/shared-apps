import { component$, useSignal } from "@qwik.dev/core";
import { describe, expect, it } from "vitest";
import { Toast } from "../src/index.ts";
import { all, get, render } from "./render.ts";

// Owns the open signal and exposes it, the way a screen would.
const Harness = component$<{ duration?: number }>(({ duration }) => {
  const open = useSignal(true);
  return (
    <div data-open={String(open.value)}>
      <Toast open={open} duration={duration}>
        Prato salvo.
      </Toast>
    </div>
  );
});

const waitFor = async (check: () => boolean, ms = 500) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > ms) throw new Error("Timed out");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
};

describe("Toast", () => {
  it("announces its message politely while open, with a close button", async () => {
    const { screen } = await render(<Harness />);
    const region = get(screen, ".wfd-toast-region");
    expect(region.getAttribute("role")).toBe("status");
    expect(get(region, ".wfd-toast__message").textContent).toBe("Prato salvo.");
    expect(get(region, "button").getAttribute("aria-label")).toBe("Fechar");
  });

  it("closes when the close button is pressed", async () => {
    const { screen, userEvent } = await render(<Harness />);
    await userEvent(get(screen, ".wfd-toast button"), "click");
    expect(get(screen, "[data-open]").getAttribute("data-open")).toBe("false");
    expect(all(screen, ".wfd-toast")).toHaveLength(0);
    // The live region stays, so the next message is announced.
    expect(all(screen, ".wfd-toast-region")).toHaveLength(1);
  });

  it("closes by itself after its duration", async () => {
    const { screen } = await render(<Harness duration={20} />);
    await waitFor(() => get(screen, "[data-open]").getAttribute("data-open") === "false");
    expect(all(screen, ".wfd-toast")).toHaveLength(0);
  });

  it("does not close by itself while the pointer or focus is on it", async () => {
    const { screen, userEvent } = await render(<Harness duration={20} />);
    await userEvent(get(screen, ".wfd-toast"), "focusin");
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(get(screen, "[data-open]").getAttribute("data-open")).toBe("true");
    await userEvent(get(screen, ".wfd-toast"), "focusout");
    await waitFor(() => get(screen, "[data-open]").getAttribute("data-open") === "false");
  });
});
