import { component$, Slot } from "@qwik.dev/core";
import { describe, expect, it } from "vitest";
import { OfflineNotice, useLabelsProvider } from "../src/index.ts";
import type { DesignSystemLabels } from "../src/index.ts";
import { get, render } from "./render.ts";

const PIRATE: DesignSystemLabels = {
  appName: "Grub?",
  close: "Belay",
  warning: "Avast",
  information: "Hark",
  success: "Huzzah",
  mainNavigation: "Charts",
  loading: "Hauling…",
  offlineTitle: "Becalmed.",
  offlineBody: "What ye saw stays aboard.",
};

// Stands in for the app's layout, which provides translated labels once.
const WithLabels = component$(() => {
  useLabelsProvider(PIRATE);
  return <Slot />;
});

describe("useLabelsProvider", () => {
  it("replaces the package's built-in English copy", async () => {
    const { screen } = await render(
      <WithLabels>
        <OfflineNotice />
      </WithLabels>,
    );
    expect(get(screen, ".wfd-alert__title").textContent).toBe("Becalmed.");
    expect(get(screen, ".wfd-alert__body").textContent).toBe("What ye saw stays aboard.");
  });
});
