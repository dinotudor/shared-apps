import { describe, expect, it } from "vitest";
import { watchConnection } from "../src/connection.ts";

// Stands in for window: an event target with navigator.onLine.
const fakeWindow = (onLine: boolean) => Object.assign(new EventTarget(), { navigator: { onLine } });

describe("watchConnection", () => {
  it("reports the current state right away", () => {
    const seen: boolean[] = [];
    watchConnection(fakeWindow(false), (online) => seen.push(online));
    expect(seen).toEqual([false]);
  });

  it("reports going offline and coming back", () => {
    const win = fakeWindow(true);
    const seen: boolean[] = [];
    watchConnection(win, (online) => seen.push(online));
    win.dispatchEvent(new Event("offline"));
    win.dispatchEvent(new Event("online"));
    expect(seen).toEqual([true, false, true]);
  });

  it("stops reporting after cleanup", () => {
    const win = fakeWindow(true);
    const seen: boolean[] = [];
    const stop = watchConnection(win, (online) => seen.push(online));
    stop();
    win.dispatchEvent(new Event("offline"));
    expect(seen).toEqual([true]);
  });
});
