import type { IncomingMessage, RequestListener, Server, ServerResponse } from "node:http";

type Next = (error?: unknown) => void;
export type Middleware = (req: IncomingMessage, res: ServerResponse, next: Next) => Promise<void>;
type Log = { error: (...values: unknown[]) => void };

const isMissingFile = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === "ENOENT";

/**
 * Static files first, then Qwik Router. Either one calls next() with no error when it
 * doesn't handle the request, and with an error when it fails.
 */
export const createRequestListener = (
  { staticFile, router }: { staticFile: Middleware; router: Middleware },
  log: Log,
): RequestListener => {
  return (req, res) => {
    const fail = (error: unknown) => {
      log.error(error);
      if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain" });
      res.end();
    };
    const notFound = () => {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("Not found");
    };
    void staticFile(req, res, (error) => {
      // A path under /build or /assets whose file doesn't exist.
      if (isMissingFile(error)) {
        notFound();
        return;
      }
      if (error !== undefined) {
        fail(error);
        return;
      }
      void router(req, res, (routerError) => {
        if (routerError === undefined) notFound();
        else fail(routerError);
      });
    });
  };
};

/**
 * Stops taking connections and lets in-flight requests finish. Requests still running
 * after `timeoutMs` are cut off and the process exits 1, so one hung connection can't
 * keep a container from stopping. apps/api uses the same 10 s budget.
 */
export const shutDown = (
  server: Server,
  { timeoutMs, exit, log }: { timeoutMs: number; exit: (code: number) => void; log: Log },
): void => {
  const timer = setTimeout(() => {
    log.error(`shutdown took longer than ${String(timeoutMs)} ms; closing open connections`);
    server.closeAllConnections();
    exit(1);
  }, timeoutMs);
  // Don't let the timer itself keep the process alive.
  timer.unref();

  server.close((error) => {
    clearTimeout(timer);
    if (error) log.error(error);
    exit(error ? 1 : 0);
  });
  // Keep-alive sockets with no request in flight would otherwise hold close() open.
  server.closeIdleConnections();
};
