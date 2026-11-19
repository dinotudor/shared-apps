import { eq, lt } from "drizzle-orm";
import type { Database } from "@shared-apps/db";
import { normalizeEmail } from "./allowlist.ts";
import { session, user, verification } from "./schema.ts";

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

/**
 * The account behind `email`, matched like the allowlist (trimmed, without case). Null
 * until that person has signed in once: Better Auth creates the account at first sign-in.
 */
export const findUserIdByEmail = async (db: Database, email: string): Promise<string | null> => {
  // Better Auth stores emails lowercased, so this compares directly and uses the unique index.
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, normalizeEmail(email)))
    .limit(1);
  return rows[0]?.id ?? null;
};

// Only for @shared-apps/auth/testing: in the app, Better Auth creates accounts.
export const insertUser = async (
  db: Database,
  values: { id: string; email: string; name: string },
): Promise<void> => {
  await db.insert(user).values(values);
};

// Only for @shared-apps/auth/testing: nothing deletes accounts in the app yet.
export const deleteUser = async (db: Database, id: string): Promise<void> => {
  await db.delete(user).where(eq(user.id, id));
};
