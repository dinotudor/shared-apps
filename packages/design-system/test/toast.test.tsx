import { component$, useSignal } from "@qwik.dev/core";
import { describe, expect, it } from "vitest";
import { Toast } from "../src/index.ts";
import { all, get, render } from "./render.ts";

// Owns the open signal and the message, the way a screen would. "show" opens the
// toast again; "next" swaps in a new message while it is open.
const Harness = component$<{ duration?: number }>(({ duration }) => {
  const open = useSignal(true);
  const count = useSignal(1);
  return (
    <div data-open={String(open.value)}>
      <button
        type="button"
        class="show"
        onClick$={() => {
          open.value = true;
        }}
      />
      <button
        type="button"
        class="next"
        onClick$={() => {
          count.value += 1;
        }}
      />
      <Toast open={open} duration={duration} messageId={count.value}>
        {count.value === 1 ? "Prato salvo." : `Prato ${String(count.value)} salvo.`}
      </Toast>
    </div>
  );
});

const isOpen = (screen: HTMLElement) =>
  get(screen, "[data-open]").getAttribute("data-open") === "true";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    // A div, not a p, so block content stays valid HTML.
    expect(get(region, "div.wfd-toast__message").textContent).toBe("Prato salvo.");
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

  it("keeps the pause while focus stays inside, even after the pointer leaves", async () => {
    const { screen, userEvent } = await render(<Harness duration={20} />);
    const toast = get(screen, ".wfd-toast");
    await userEvent(toast, "focusin");
    await userEvent(toast, "pointerenter");
    await userEvent(toast, "pointerleave");
    await sleep(60);
    expect(isOpen(screen)).toBe(true);
    await userEvent(toast, "focusout");
    await waitFor(() => !isOpen(screen));
  });

  it("closes by itself the next time it opens after closing while hovered", async () => {
    const { screen, userEvent } = await render(<Harness duration={20} />);
    // Closed while hovered: pointerleave never fires on the removed element.
    await userEvent(get(screen, ".wfd-toast"), "pointerenter");
    await userEvent(get(screen, ".wfd-toast__close"), "click");
    expect(isOpen(screen)).toBe(false);
    await userEvent(get(screen, ".show"), "click");
    expect(isOpen(screen)).toBe(true);
    await waitFor(() => !isOpen(screen));
  });

  it("gives a new message its full duration", async () => {
    const { screen, userEvent } = await render(<Harness duration={80} />);
    await sleep(50);
    await userEvent(get(screen, ".next"), "click");
    expect(get(screen, ".wfd-toast__message").textContent).toBe("Prato 2 salvo.");
    // The first message's timer would have closed the toast at 80 ms.
    await sleep(50);
    expect(isOpen(screen)).toBe(true);
    await waitFor(() => !isOpen(screen));
  });
});
