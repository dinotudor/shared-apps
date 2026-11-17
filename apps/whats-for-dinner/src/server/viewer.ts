import type { RequestEventBase } from "@qwik.dev/router";

/** The signed-in person looking at the app. */
export type Viewer = { id: string; name: string };

export type GetViewer = (event: RequestEventBase) => Promise<Viewer | null>;

// A made-up person, so the shell has someone to show until sign-in exists.
const DEV_VIEWER: Viewer = { id: "dev-viewer", name: "Dev Local" };

/**
 * Who is signed in for this request, or null when nobody is.
 *
 * Placeholder until #15 (Better Auth): it always returns DEV_VIEWER, so the sign-in
 * redirect never fires yet. #15 replaces it with a call to the API that verifies the
 * session cookie. Everything else (the guard, the avatar) reads the viewer from here.
 */
export const getViewer: GetViewer = () => Promise.resolve(DEV_VIEWER);
