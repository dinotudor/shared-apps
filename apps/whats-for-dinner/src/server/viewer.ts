import type { RequestEventBase } from "@qwik.dev/router";
import { TRPCClientError } from "@trpc/client";
import type { ApiClient } from "./api.ts";
import { apiFor } from "./api.ts";

/** The signed-in person looking at the app, as the API describes them. */
export type Viewer = Awaited<ReturnType<ApiClient["viewer"]["me"]["query"]>>;

export type GetViewer = (event: RequestEventBase) => Promise<Viewer | null>;

const isUnauthorized = (error: unknown): boolean =>
  error instanceof TRPCClientError &&
  (error.data as { code?: unknown } | undefined)?.code === "UNAUTHORIZED";

/**
 * Who the API says is signed in, or null when nobody is. Any other failure is thrown:
 * an API that is down must show an error, not send everyone to sign-in.
 */
export const viewerFromApi = async (api: Pick<ApiClient, "viewer">): Promise<Viewer | null> => {
  try {
    return await api.viewer.me.query();
  } catch (error) {
    if (isUnauthorized(error)) return null;
    throw error;
  }
};

/** Who is signed in for this request. The API verifies the session cookie. */
export const getViewer: GetViewer = (event) => viewerFromApi(apiFor(event));
