import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { createDatabase } from "@shared-apps/db";
import type { DatabaseHandle } from "@shared-apps/db";
import { startTestDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { buildApp } from "../src/app.ts";
import { runServer } from "../src/lifecycle.ts";

let database: TestDatabase | undefined;
let handle: DatabaseHandle | undefined;

afterEach(async () => {
  // Already closed when shutdown succeeded; closing again does nothing.
  await handle?.close();
  await database?.stop();
  handle = undefined;
  database = undefined;
});

const setUp = async () => {
  database = await startTestDatabase();
  // The app gets its own pool, as in production, so the test can see it closed.
  handle = createDatabase(database.url);
  const closeDatabase = vi.fn(handle.close);
  const app = buildApp(
    { port: 0, host: "127.0.0.1", logLevel: "silent", databaseUrl: database.url },
    { database: { db: handle.db, close: closeDatabase } },
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
    const { app, signals, exit, closeDatabase } = await setUp();
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
    const { app, signals, exit } = await setUp();
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
    const { app, signals, exit } = await setUp();
    // An onClose hook that never finishes stands in for a hung request or pool.
    app.addHook("onClose", () => new Promise<void>(() => undefined));
    await run(app, { signals, exit }, 50);

    signals.emit("SIGTERM");

    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledExactlyOnceWith(1);
    });
  });

  it("logs and exits 1 when the server cannot listen", async () => {
    const { app, signals, exit } = await setUp();
    const logFatal = vi.spyOn(app.log, "fatal");

    await runServer(app, { port: 0, host: "256.0.0.1", timeoutMs: 10_000, signals, exit });

    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
    expect(logFatal).toHaveBeenCalledOnce();
  });
});
