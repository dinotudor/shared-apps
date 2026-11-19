import type { App } from "@shared-apps/api-core";
import type { Database } from "@shared-apps/db";
import { hasMember, insertMember } from "./repository.ts";

export type AddResult = "added" | "already-member";

export type Membership = {
  /** Whether the collaborator may use the app. */
  isMember: (app: App, userId: string) => Promise<boolean>;
  /** Makes the collaborator a member. Safe to repeat, so seeds and scripts can rerun. */
  add: (app: App, userId: string) => Promise<AddResult>;
};

export const createMembership = (db: Database): Membership => ({
  isMember: (app, userId) => hasMember(db, app, userId),
  add: async (app, userId) => ((await insertMember(db, app, userId)) ? "added" : "already-member"),
});
