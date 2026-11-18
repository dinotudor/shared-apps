import type { RequestEventBase } from "@qwik.dev/router";
import { createTRPCClient, httpLink } from "@trpc/client";
import type { TRPCClient } from "@trpc/client";
import type { AppRouter } from "@shared-apps/api";
import { resolveApiUrl } from "./config.ts";
import { passCookiesOn } from "./cookies.ts";

export type ApiClient = TRPCClient<AppRouter>;

/**
 * A tRPC client for one request. Call it only from server code (routeLoader$,
 * routeAction$, server$): the browser never talks to the API (playbook ADR 0006).
 * It forwards the session cookie, and the API verifies it on every call. When the API
 * renews the session, the new cookie goes on to the browser with this page.
 */
export const apiFor = (event: RequestEventBase): ApiClient =>
  createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: `${resolveApiUrl(event.env.get("API_URL"), { dev: import.meta.env.DEV })}/trpc`,
        headers: () => ({ cookie: event.request.headers.get("cookie") ?? "" }),
        fetch: async (url, init) => {
          const response = await fetch(url, init);
          passCookiesOn(response, event);
          return response;
        },
      }),
    ],
  });
