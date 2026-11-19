import { and, eq } from "drizzle-orm";
import type { App } from "@shared-apps/api-core";
import type { Database } from "@shared-apps/db";
import { appMember } from "./schema.ts";

export const hasMember = async (db: Database, app: App, userId: string): Promise<boolean> => {
  const rows = await db
    .select({ userId: appMember.userId })
    .from(appMember)
    .where(and(eq(appMember.appId, app), eq(appMember.userId, userId)))
    .limit(1);
  return rows.length > 0;
};

/** Returns whether a row was inserted: false when the collaborator was a member already. */
export const insertMember = async (db: Database, app: App, userId: string): Promise<boolean> => {
  const result = await db.insert(appMember).values({ appId: app, userId }).onConflictDoNothing();
  return (result.rowCount ?? 0) > 0;
};
