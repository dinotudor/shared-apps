import { ApiHealth } from "../api-health.ts";
import type { ApiClient } from "./api.ts";

/**
 * Asks the API whether it is up. A failure becomes "unreachable" so the page can show
 * it instead of failing, and the error itself goes to `report` for the server log.
 */
export const getApiHealth = async (
  api: Pick<ApiClient, "health">,
  report: (error: unknown) => void,
): Promise<ApiHealth> => {
  try {
    // The ping only ever answers { ok: true }: any answer means the API is up.
    await api.health.ping.query();
    return ApiHealth.Ok;
  } catch (error) {
    report(error);
    return ApiHealth.Unreachable;
  }
};
