import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Auth } from "@shared-apps/auth";

export const AUTH_ROUTE = "/api/auth/*";

/** Fastify's headers as fetch Headers, keeping repeated ones. */
export const toHeaders = (incoming: FastifyRequest["headers"]): Headers => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming)) {
    for (const item of [value ?? []].flat()) headers.append(name, item);
  }
  return headers;
};

/**
 * Mounts Better Auth at /api/auth/* directly, without the community plugin (playbook
 * ADR 0008). Google sends the browser here after sign-in, and the frontends' servers
 * call it to start sign-in and to sign out.
 */
export const registerAuthRoute = (app: FastifyInstance, auth: Pick<Auth, "handler">): void => {
  app.route({
    method: ["GET", "POST"],
    url: AUTH_ROUTE,
    handler: async (request, reply) => {
      const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
      const headers = toHeaders(request.headers);
      // Better Auth rate-limits by the IP in x-forwarded-for. It gets Fastify's request.ip,
      // never the caller's own header: anyone could send that to get a fresh limit.
      // request.ip honours x-forwarded-for only from proxies in Fastify's trustProxy.
      headers.set("x-forwarded-for", request.ip);
      const response = await auth.handler(
        new Request(url, {
          method: request.method,
          headers,
          // Fastify has already parsed JSON bodies. Better Auth only takes JSON.
          ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
        }),
      );
      reply.status(response.status);
      response.headers.forEach((value, name) => {
        // Set-Cookie is the one header that can't be joined with commas: each cookie
        // goes out on its own line, or the browser keeps only the first.
        if (name !== "set-cookie") void reply.header(name, value);
      });
      const cookies = response.headers.getSetCookie();
      if (cookies.length > 0) void reply.header("set-cookie", cookies);
      return reply.send(Buffer.from(await response.arrayBuffer()));
    },
  });
};
