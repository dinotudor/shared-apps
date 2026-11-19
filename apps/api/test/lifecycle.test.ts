import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Database } from "@shared-apps/db";
import { buildApp } from "../src/app.ts";
import { runServer } from "../src/lifecycle.ts";

// The lifecycle never queries the database; it only has to close it.
const setUp = () => {
  const closeDatabase = vi.fn(() => Promise.resolve());
  const app = buildApp(
    { logLevel: "silent" },
    {
      database: { db: {} as Database, close: closeDatabase },
      jobs: { start: () => Promise.resolve(), stop: () => Promise.resolve() },
      auth: {
        handler: () => Promise.resolve(new Response(null, { status: 404 })),
        getSession: () => Promise.resolve({ viewer: null, headers: new Headers() }),
      },
      membership: { isMember: () => Promise.resolve(false) },
    },
  );
  const signals = new EventEmitter();
  const exit = vi.fn<(code: number) => void>();
  return { app, signals, exit, closeDatabase };
};

const run = (
  app: FastifyInstance,
  { signals, exit }: { signals: EventEmitter; exit: (code: number) => void },
  timeoutMs = 10_000,
) => runServer(app, { port: 0, host: "127.0.0.1", timeoutMs, signals, exit });

describe("runServer", () => {
  it("serves until SIGTERM, then closes the app and the database and exits 0", async () => {
    const { app, signals, exit, closeDatabase } = setUp();
    await run(app, { signals, exit });
    expect(app.server.listening).toBe(true);

    signals.emit("SIGTERM");

    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledExactlyOnceWith(0);
    });
    expect(app.server.listening).toBe(false);
    expect(closeDatabase).toHaveBeenCalledOnce();
  });

  it("shuts down cleanly when SIGINT arrives while listen() is still pending", async () => {
    const { app, signals, exit } = setUp();
    const logFatal = vi.spyOn(app.log, "fatal");

    const running = run(app, { signals, exit });
    signals.emit("SIGINT");
    await running;

    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledExactlyOnceWith(0);
    });
    expect(app.server.listening).toBe(false);
    expect(logFatal).not.toHaveBeenCalled();
  });

  it("cuts open connections and exits 1 when closing takes longer than the timeout", async () => {
    const { app, signals, exit } = setUp();
    // An onClose hook that never finishes stands in for a hung request or pool.
    app.addHook("onClose", () => new Promise<void>(() => undefined));
    await run(app, { signals, exit }, 50);

    signals.emit("SIGTERM");

    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledExactlyOnceWith(1);
    });
  });

  it("logs and exits 1 when the server cannot listen", async () => {
    const { app, signals, exit } = setUp();
    const logFatal = vi.spyOn(app.log, "fatal");

    await runServer(app, { port: 0, host: "256.0.0.1", timeoutMs: 10_000, signals, exit });

    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
    expect(logFatal).toHaveBeenCalledOnce();
  });
});
