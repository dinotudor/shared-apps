import type { FastifyInstance } from "fastify";
import type { Send } from "@shared-apps/auth/testing";

/**
 * Sends a fetch Request through Fastify's inject, as a browser or the frontend would.
 * Takes a getter because test files build the app in beforeAll.
 */
export const sendTo =
  (getApp: () => FastifyInstance): Send =>
  async (request) => {
    const url = new URL(request.url);
    const body = request.body ? await request.text() : undefined;
    const response = await getApp().inject({
      method: request.method as "GET" | "POST",
      url: url.pathname + url.search,
      headers: Object.fromEntries(request.headers),
      ...(body === undefined ? {} : { payload: body }),
    });
    const headers = new Headers();
    for (const [name, value] of Object.entries(response.headers)) {
      for (const item of [value ?? []].flat()) headers.append(name, String(item));
    }
    const hasBody = response.rawPayload.length > 0 && response.statusCode !== 204;
    return new Response(hasBody ? new Uint8Array(response.rawPayload) : null, {
      status: response.statusCode,
      headers,
    });
  };
