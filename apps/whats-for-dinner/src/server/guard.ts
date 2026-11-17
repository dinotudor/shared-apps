import type { RequestEvent, RequestEventBase } from "@qwik.dev/router";
import type { GetViewer, Viewer } from "./viewer.ts";

export const SIGN_IN_PATH = "/sign-in/";

// Pages a signed-out visitor may open. Everything else needs a viewer.
const PUBLIC_PATHS = [SIGN_IN_PATH];

const VIEWER_KEY = "viewer";

/**
 * Runs before every page: sends signed-out visitors to sign-in and keeps the viewer in
 * sharedMap, so loaders read it without asking for it again. `next` holds the page they
 * asked for, so sign-in (#15) can return them to it.
 */
export const requireViewer = async (event: RequestEvent, getViewer: GetViewer): Promise<void> => {
  if (PUBLIC_PATHS.includes(event.url.pathname)) return;
  const viewer = await getViewer(event);
  if (!viewer) {
    const next = encodeURIComponent(event.url.pathname + event.url.search);
    // Qwik ends the request when the redirect is thrown.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw event.redirect(302, `${SIGN_IN_PATH}?next=${next}`);
  }
  event.sharedMap.set(VIEWER_KEY, viewer);
};

/** The viewer requireViewer found for this request, or null on public pages. */
export const viewerFrom = (event: RequestEventBase): Viewer | null =>
  (event.sharedMap.get(VIEWER_KEY) as Viewer | undefined) ?? null;
