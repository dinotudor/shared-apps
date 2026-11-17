import type { RequestEventBase } from "@qwik.dev/router";
import { createTRPCClient, httpLink } from "@trpc/client";
import type { TRPCClient } from "@trpc/client";
import type { AppRouter } from "@shared-apps/api";
import { parseApiUrl } from "./config.ts";

export type ApiClient = TRPCClient<AppRouter>;

/**
 * A tRPC client for one request. Call it only from server code (routeLoader$,
 * routeAction$, server$): the browser never talks to the API (playbook ADR 0006).
 * It forwards the session cookie, and the API verifies it on every call.
 */
export const apiFor = (event: RequestEventBase): ApiClient =>
  createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: `${parseApiUrl(event.env.get("API_URL"))}/trpc`,
        headers: () => ({ cookie: event.request.headers.get("cookie") ?? "" }),
      }),
    ],
  });
