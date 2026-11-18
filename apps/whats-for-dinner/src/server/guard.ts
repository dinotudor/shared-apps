import type { RequestEvent, RequestEventBase } from "@qwik.dev/router";
import type { GetViewer, Viewer } from "./viewer.ts";

/**
 * Where signed-out visitors go, with `?next=<page>`. Sign-in sends people back to `next`
 * only through safeNext() (auth.ts), which keeps it on this site.
 */
export const SIGN_IN_PATH = "/sign-in/";

// Pages a signed-out visitor may open. Everything else needs a viewer.
const PUBLIC_PATHS = [SIGN_IN_PATH];

const VIEWER_KEY = "viewer";

// Query parameters Qwik adds for its own requests (actions, server functions, data).
const INTERNAL_PARAMS = ["qaction", "qfunc", "qdata"];

/** The page the visitor asked for, as a path with its query, minus Qwik's own parameters. */
const requestedPage = (url: URL): string => {
  const search = new URLSearchParams(url.search);
  for (const name of INTERNAL_PARAMS) search.delete(name);
  const query = search.toString();
  return url.pathname + (query ? `?${query}` : "");
};

/**
 * Runs before every page: sends signed-out visitors to sign-in and keeps the viewer in
 * sharedMap, so loaders read it without asking for it again. `next` holds the page they
 * asked for, so sign-in can return them to it.
 *
 * Client-side navigation fetches data from `<page>/q-loader-<id>.<hash>.json`. Qwik Router
 * (2.0.0-rc.5) trims that suffix, and `q-route.json`, from `event.url` before onRequest
 * runs, and turns this redirect into a JSON one the client follows. So the pathname here is
 * always the page's own. Recheck this when upgrading Qwik.
 */
export const requireViewer = async (event: RequestEvent, getViewer: GetViewer): Promise<void> => {
  if (PUBLIC_PATHS.includes(event.url.pathname)) return;
  const viewer = await getViewer(event);
  if (!viewer) {
    const next = encodeURIComponent(requestedPage(event.url));
    // Qwik ends the request when the redirect is thrown.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw event.redirect(302, `${SIGN_IN_PATH}?next=${next}`);
  }
  event.sharedMap.set(VIEWER_KEY, viewer);
};

/** The viewer requireViewer found for this request, or null on public pages. */
export const viewerFrom = (event: RequestEventBase): Viewer | null =>
  (event.sharedMap.get(VIEWER_KEY) as Viewer | undefined) ?? null;
