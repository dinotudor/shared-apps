import { eq, lt } from "drizzle-orm";
import type { Database } from "@shared-apps/db";
import { session, verification } from "./schema.ts";

export type PurgeResult = { sessions: number; verifications: number };

/** Deletes one session, so its cookie stops working and can't be renewed. */
export const deleteSession = async (db: Database, sessionId: string): Promise<void> => {
  await db.delete(session).where(eq(session.id, sessionId));
};

/**
 * Deletes sessions and verifications (sign-in states) that expired before `now`. Better
 * Auth ignores them already, but it never deletes an expired session.
 */
export const deleteExpired = async (db: Database, now: Date): Promise<PurgeResult> => {
  const sessions = await db.delete(session).where(lt(session.expiresAt, now));
  const verifications = await db.delete(verification).where(lt(verification.expiresAt, now));
  return { sessions: sessions.rowCount ?? 0, verifications: verifications.rowCount ?? 0 };
};
