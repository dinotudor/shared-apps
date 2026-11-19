import type { RequestEventBase } from "@qwik.dev/router";
import { resolveApiUrl } from "./config.ts";
import { passCookiesOn } from "./cookies.ts";
import { SIGN_IN_PATH } from "./guard.ts";

const HOME = "/";
// Any C0 control character or DEL. Browsers strip tabs and newlines from URLs, which can
// turn "/\t/evil.example" into "//evil.example".
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
// Only used to check that `next` stays on this origin; never requested.
const PROBE_ORIGIN = "http://same-origin.invalid";

/**
 * The page to send someone to after sign-in: `next` if it is a path on this site,
 * otherwise the home page. Anything else would make sign-in an open redirect.
 */
export const safeNext = (next: string | null): string => {
  if (!next?.startsWith("/") || next.startsWith("//")) return HOME;
  // Browsers treat "\" as "/", so "/\evil.example" means "//evil.example".
  if (next.includes("\\") || CONTROL_CHARACTERS.test(next)) return HOME;
  const url = new URL(next, PROBE_ORIGIN);
  if (url.origin !== PROBE_ORIGIN) return HOME;
  // Sending a signed-in person back to sign-in would loop.
  if (url.pathname === SIGN_IN_PATH) return HOME;
  return next;
};

type AuthEvent = Pick<RequestEventBase, "env" | "url" | "request" | "cookie" | "clientConn">;

/** Calls Better Auth on the API, as this site, with the visitor's cookies. */
const callAuth = async (event: AuthEvent, path: string, body?: object): Promise<Response> => {
  const apiUrl = resolveApiUrl(event.env.get("API_URL"), { dev: import.meta.env.DEV });
  const headers = new Headers({
    // Better Auth only accepts requests from the origins in AUTH_TRUSTED_ORIGINS.
    origin: event.url.origin,
    cookie: event.request.headers.get("cookie") ?? "",
  });
  // Better Auth rate-limits by client IP, and without this it would see this server's.
  // The browser's own x-forwarded-for is never passed on: it could say anything. The API
  // reads this header only once its trustProxy lists this server (#34/#35).
  if (event.clientConn.ip) headers.set("x-forwarded-for", event.clientConn.ip);
  if (body) headers.set("content-type", "application/json");
  const response = await fetch(`${apiUrl}/api/auth${path}`, {
    method: "POST",
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  // The status only: the body may echo request details.
  if (!response.ok) throw new Error(`Better Auth ${path} answered ${String(response.status)}`);
  passCookiesOn(response, event);
  return response;
};

/**
 * Starts Google sign-in and returns Google's URL to redirect the browser to. Google
 * sends the browser to the API's callback, which then redirects to `next` (when safe),
 * or back to the sign-in page with `?error=` when the email is refused.
 */
export const startGoogleSignIn = async (event: AuthEvent, next: string | null): Promise<string> => {
  const response = await callAuth(event, "/sign-in/social", {
    provider: "google",
    callbackURL: `${event.url.origin}${safeNext(next)}`,
    errorCallbackURL: `${event.url.origin}${SIGN_IN_PATH}`,
  });
  const { url } = (await response.json()) as { url?: unknown };
  if (typeof url !== "string") throw new Error("Better Auth did not return Google's URL");
  return url;
};

/** Ends the session at the API and clears the cookie in the browser. */
export const signOut = async (event: AuthEvent): Promise<void> => {
  await callAuth(event, "/sign-out");
};
