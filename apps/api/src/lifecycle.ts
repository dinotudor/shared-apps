import type { FastifyInstance } from "fastify";

type Signal = "SIGINT" | "SIGTERM";
type SignalSource = { once: (signal: Signal, listener: () => void) => unknown };

export type RunOptions = {
  port: number;
  host: string;
  /** Budget for a graceful shutdown. apps/web uses the same 10 s. */
  timeoutMs: number;
  /** `process` in production; tests pass an EventEmitter. */
  signals: SignalSource;
  exit: (code: number) => void;
};

/**
 * Listens, then shuts down on the first SIGINT or SIGTERM: stops taking requests,
 * lets in-flight ones finish and runs the onClose hooks (which close the database).
 * After `timeoutMs`, open connections are cut and the process exits 1, so one hung
 * request can't keep a container from stopping. A second signal gets Node's
 * default handling and ends the process at once.
 *
 * Resolves once the server is listening or has failed to.
 */
export const runServer = async (app: FastifyInstance, options: RunOptions): Promise<void> => {
  const { port, host, timeoutMs, signals, exit } = options;
  let exited = false;
  const exitOnce = (code: number) => {
    if (exited) return;
    exited = true;
    exit(code);
  };

  // An object, not a let: TypeScript doesn't see the signal handler change a let.
  const state = { shuttingDown: false };
  const listening = app.listen({ port, host });

  const shutDown = async (signal: Signal) => {
    state.shuttingDown = true;
    app.log.info({ signal }, "shutting down");
    const timer = setTimeout(() => {
      app.log.error(`shutdown took longer than ${String(timeoutMs)} ms; closing open connections`);
      app.server.closeAllConnections();
      exitOnce(1);
    }, timeoutMs);
    // Don't let the timer itself keep the process alive.
    timer.unref();

    // Closing while listen() is pending can leave the server listening after close,
    // so let listen settle first. If it failed, the failure is handled below.
    await listening.catch(() => undefined);
    try {
      await app.close();
      exitOnce(0);
    } catch (error) {
      app.log.error({ err: error }, "shutdown failed");
      exitOnce(1);
    } finally {
      clearTimeout(timer);
    }
  };

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    signals.once(signal, () => void shutDown(signal));
  }

  try {
    await listening;
  } catch (error) {
    // A signal during startup is a shutdown, not a failed start.
    if (state.shuttingDown) return;
    app.log.fatal({ err: error }, "failed to start");
    exitOnce(1);
  }
};
