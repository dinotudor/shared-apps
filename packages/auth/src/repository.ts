import { lt } from "drizzle-orm";
import type { Database } from "@shared-apps/db";
import { session, verification } from "./schema.ts";

export type PurgeResult = { sessions: number; verifications: number };

/**
 * Deletes sessions and verifications (sign-in states) that expired before `now`. Better
 * Auth ignores them already, but it never deletes an expired session.
 */
export const deleteExpired = async (db: Database, now: Date): Promise<PurgeResult> => {
  const sessions = await db.delete(session).where(lt(session.expiresAt, now));
  const verifications = await db.delete(verification).where(lt(verification.expiresAt, now));
  return { sessions: sessions.rowCount ?? 0, verifications: verifications.rowCount ?? 0 };
};
