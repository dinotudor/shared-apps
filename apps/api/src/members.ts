import { z } from "zod";
import { App } from "@shared-apps/api-core";
import { findUserIdByEmail } from "@shared-apps/auth";
import type { Database } from "@shared-apps/db";
import { createMembership } from "@shared-apps/membership";
import type { AddResult } from "@shared-apps/membership";

export type AddMemberResult = {
  email: string;
  /** `no-account`: the person has not signed in yet, so there is nobody to add. */
  result: AddResult | "no-account";
};

/**
 * Makes each email's account a member of `app`. Wiring across two packages: the account
 * belongs to auth and the membership to the membership module. Safe to run again.
 */
export const addMembers = async (
  db: Database,
  app: App,
  emails: readonly string[],
): Promise<AddMemberResult[]> => {
  const membership = createMembership(db);
  const results: AddMemberResult[] = [];
  for (const email of emails) {
    const userId = await findUserIdByEmail(db, email);
    results.push({ email, result: userId ? await membership.add(app, userId) : "no-account" });
  }
  return results;
};

const argsSchema = z.tuple(
  [z.enum(Object.values(App), { error: "app must be one of: " + Object.values(App).join(", ") })],
  z.email({ error: "expected an email" }),
);

export class UsageError extends Error {
  override name = "UsageError";
}

/** `<app> <email>...`, as given to `pnpm members:add`. */
export const parseAddMembersArgs = (args: readonly string[]): { app: App; emails: string[] } => {
  const result = argsSchema.safeParse(args);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => issue.message).join("; ");
    throw new UsageError(`Usage: members:add <app> <email>...\n  ${problems}`);
  }
  const [app, ...emails] = result.data;
  if (emails.length === 0)
    throw new UsageError("Usage: members:add <app> <email>...\n  at least one email is required");
  return { app, emails };
};
