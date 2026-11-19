import { z } from "zod";
import { App } from "@shared-apps/api-core";
import { findUserIdByEmail } from "@shared-apps/auth";
import type { Database } from "@shared-apps/db";
import type { AddResult, Membership } from "@shared-apps/membership";

export type AddMemberResult = {
  email: string;
  /** `no-account`: the person has not signed in yet, so there is nobody to add. */
  result: AddResult | "no-account";
};

/**
 * Makes each email's account a member of `app`, yielding each result as soon as it is
 * known: if a later email fails, the ones before it are already reported. Wiring across
 * two packages: the account belongs to auth, the membership to the membership module.
 * Safe to run again.
 */
export async function* addMembers(
  { db, membership }: { db: Database; membership: Pick<Membership, "add"> },
  app: App,
  emails: readonly string[],
): AsyncGenerator<AddMemberResult> {
  for (const email of emails) {
    const userId = await findUserIdByEmail(db, email);
    yield { email, result: userId ? await membership.add(app, userId) : "no-account" };
  }
}

const argsSchema = z.tuple(
  [z.enum(Object.values(App), { error: "app must be one of: " + Object.values(App).join(", ") })],
  z.email({ error: "expected an email" }),
);

const USAGE = "Usage: members:add <app> <email>...";

export class UsageError extends Error {
  override name = "UsageError";
}

/** `<app> <email>...`, as given to `pnpm members:add`. */
export const parseAddMembersArgs = (args: readonly string[]): { app: App; emails: string[] } => {
  const result = argsSchema.safeParse(args);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => issue.message).join("; ");
    throw new UsageError(`${USAGE}\n  ${problems}`);
  }
  const [app, ...emails] = result.data;
  if (emails.length === 0) throw new UsageError(`${USAGE}\n  at least one email is required`);
  return { app, emails };
};
