import { eq, sql } from "drizzle-orm";
import type { Database } from "@shared-apps/db";
import { normalizeEmail } from "./allowlist.ts";
import { user } from "./schema.ts";

/**
 * The account behind `email`, matched like the allowlist (trimmed, without case). Null
 * until that person has signed in once: Better Auth creates the account at first sign-in.
 */
export const findUserIdByEmail = async (db: Database, email: string): Promise<string | null> => {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(sql`lower(${user.email})`, normalizeEmail(email)))
    .limit(1);
  return rows[0]?.id ?? null;
};
