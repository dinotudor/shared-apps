import { vi } from "vitest";
import type { CookieOptions } from "@qwik.dev/router/middleware/request-handler";

/**
 * A request event's cookie jar that records what is set. Qwik doesn't export its own,
 * and `cookie.set` is where Qwik takes the cookies it sends with the page.
 */
export const fakeCookie = () => {
  const set = vi.fn<(name: string, value: string, options?: CookieOptions) => void>();
  return { event: { cookie: { set } }, set };
};
