import type { RequestEventBase } from "@qwik.dev/router";
import type { CookieOptions } from "@qwik.dev/router/middleware/request-handler";

type ParsedCookie = { name: string; value: string; options: CookieOptions };

/** Reads one Set-Cookie header. Attributes Qwik can't write (Partitioned, Priority) are dropped. */
const parseSetCookie = (header: string): ParsedCookie | null => {
  const [pair = "", ...attributes] = header.split(";").map((part) => part.trim());
  const equals = pair.indexOf("=");
  if (equals < 1) return null;
  const options: CookieOptions = {};
  for (const attribute of attributes) {
    const [key = "", ...rest] = attribute.split("=");
    const value = rest.join("=");
    switch (key.toLowerCase()) {
      case "max-age":
        options.maxAge = Number(value);
        break;
      case "expires":
        options.expires = value;
        break;
      case "domain":
        options.domain = value;
        break;
      case "path":
        options.path = value;
        break;
      case "httponly":
        options.httpOnly = true;
        break;
      case "secure":
        options.secure = true;
        break;
      case "samesite":
        options.sameSite = value as CookieOptions["sameSite"];
        break;
    }
  }
  return { name: pair.slice(0, equals), value: pair.slice(equals + 1), options };
};

/**
 * Copies the cookies an API response sets onto this page's response, so they reach the
 * browser: the sign-in state, a renewed session or a cleared one. The browser never talks
 * to the API itself, except when Google sends it to the API's callback.
 *
 * They go through Qwik's cookie API, not `event.headers`: Qwik Router's Node adapter
 * (2.0.0-rc.5) writes each header with setHeader, so of several Set-Cookie headers only
 * the last one reaches the browser, and any cookie set through the cookie API replaces
 * them all. Recheck this when upgrading Qwik.
 */
export const passCookiesOn = (
  response: Response,
  event: { cookie: Pick<RequestEventBase["cookie"], "set"> },
): void => {
  for (const header of response.headers.getSetCookie()) {
    const cookie = parseSetCookie(header);
    // The value is passed as a string, so Qwik writes it unchanged (it is already encoded).
    if (cookie) event.cookie.set(cookie.name, cookie.value, cookie.options);
  }
};
