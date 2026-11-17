import { createServer, request } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRequestListener, shutDown } from "../src/server/node-server.ts";
import type { Middleware } from "../src/server/node-server.ts";

type Next = (error?: unknown) => void;

const fakeResponse = () => {
  const res = {
    statusCode: 200,
    headersSent: false,
    headers: {} as Record<string, string>,
    body: "",
    ended: false,
    writeHead(status: number, headers: Record<string, string> = {}) {
      res.statusCode = status;
      res.headers = headers;
      res.headersSent = true;
      return res;
    },
    end(body = "") {
      res.body = body;
      res.ended = true;
      return res;
    },
  };
  return res;
};

const handle = async (staticFile: Middleware, router: Middleware) => {
  const log = { error: vi.fn() };
  const res = fakeResponse();
  createRequestListener({ staticFile, router }, log)(
    {} as IncomingMessage,
    res as unknown as ServerResponse,
  );
  await vi.waitFor(() => {
    expect(res.ended).toBe(true);
  });
  return { res, log };
};

// Middleware that calls next(error), like Qwik Router's, and resolves.
const callsNext =
  (error?: unknown): Middleware =>
  (_req, _res, next: Next) => {
    next(error);
    return Promise.resolve();
  };
const passes = callsNext();

describe("createRequestListener", () => {
  it("answers 404 when neither static files nor the router handle the request", async () => {
    const { res, log } = await handle(passes, passes);

    expect(res.statusCode).toBe(404);
    expect(log.error).not.toHaveBeenCalled();
  });

  it("answers 500 and logs the error when the router fails", async () => {
    const failure = new Error("render failed");
    const { res, log } = await handle(passes, callsNext(failure));

    expect(res.statusCode).toBe(500);
    expect(log.error).toHaveBeenCalledExactlyOnceWith(failure);
  });

  it("answers 404 when a static path has no file", async () => {
    const missing = Object.assign(new Error("ENOENT: no such file"), { code: "ENOENT" });
    const { res, log } = await handle(callsNext(missing), passes);

    expect(res.statusCode).toBe(404);
    expect(log.error).not.toHaveBeenCalled();
  });

  it("answers 500 and logs the error when a static file fails", async () => {
    const failure = new Error("EACCES");
    const router = vi.fn(passes);
    const { res, log } = await handle(callsNext(failure), router);

    expect(res.statusCode).toBe(500);
    expect(log.error).toHaveBeenCalledExactlyOnceWith(failure);
    expect(router).not.toHaveBeenCalled();
  });
});

// A server whose close() waits until the test says the last connection is gone.
const fakeServer = () => {
  let closed: ((error?: Error) => void) | undefined;
  const server = {
    close: vi.fn((callback: (error?: Error) => void) => {
      closed = callback;
      return server;
    }),
    closeIdleConnections: vi.fn(),
    closeAllConnections: vi.fn(),
  };
  return {
    server: server as unknown as Server,
    calls: server,
    finishClosing: () => closed?.(),
  };
};

describe("shutDown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stops accepting connections, drops idle ones, and exits 0 once requests finish", () => {
    vi.useFakeTimers();
    const { server, calls, finishClosing } = fakeServer();
    const exit = vi.fn();

    shutDown(server, { timeoutMs: 10_000, exit, log: { error: vi.fn() } });
    expect(calls.close).toHaveBeenCalledOnce();
    expect(calls.closeIdleConnections).toHaveBeenCalledOnce();

    finishClosing();
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
  });

  it("closes every connection and exits 1 when requests outlast the timeout", () => {
    vi.useFakeTimers();
    const { server, calls } = fakeServer();
    const exit = vi.fn();
    const log = { error: vi.fn() };

    shutDown(server, { timeoutMs: 10_000, exit, log });
    vi.advanceTimersByTime(9_999);
    expect(exit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(calls.closeAllConnections).toHaveBeenCalledOnce();
    expect(log.error).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("cuts off a real request that never answers, then exits 1", async () => {
    // Loopback only: a handler that never responds keeps the connection busy.
    const server = createServer(() => undefined);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    const clientClosed = new Promise<void>((resolve) => {
      request({ port, host: "127.0.0.1", path: "/" })
        .on("error", () => {
          resolve();
        })
        .end();
    });
    await vi.waitFor(async () => {
      const connections = await new Promise<number>((resolve, reject) => {
        server.getConnections((error, count) => {
          if (error) reject(error);
          else resolve(count);
        });
      });
      expect(connections).toBe(1);
    });
    const exited = new Promise<number>((resolve) => {
      shutDown(server, { timeoutMs: 100, exit: resolve, log: { error: vi.fn() } });
    });

    expect(await exited).toBe(1);
    await clientClosed;
  });
});
