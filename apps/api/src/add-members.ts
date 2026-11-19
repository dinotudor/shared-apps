// `pnpm --filter @shared-apps/api members:add <app> <email>...`: makes people members of
// an app (GLOSSARY: Member). Each person must have signed in once, so their account exists.
import { createDatabase } from "@shared-apps/db";
import { ConfigError, parseMigrateConfig } from "./config.ts";
import { addMembers, parseAddMembersArgs, UsageError } from "./members.ts";

const MESSAGES = {
  added: "added",
  "already-member": "already a member",
  "no-account": "no account: they must sign in once before they can be added",
} as const;

const load = () => {
  try {
    // Needs only DATABASE_URL, with the server's rule for it, like `pnpm db:migrate`.
    return {
      config: parseMigrateConfig(process.env),
      args: parseAddMembersArgs(process.argv.slice(2)),
    };
  } catch (error) {
    console.error(
      error instanceof ConfigError || error instanceof UsageError ? error.message : error,
    );
    process.exit(1);
  }
};

const { config, args } = load();
const database = createDatabase(config.databaseUrl, {
  onError: (error) => {
    console.error("database connection lost:", error);
  },
});
try {
  const results = await addMembers(database.db, args.app, args.emails);
  // The person running the script typed these emails: printing them back is not a log.
  for (const { email, result } of results) console.info(`${email}: ${MESSAGES[result]}`);
  if (results.some(({ result }) => result === "no-account")) process.exitCode = 1;
} catch (error) {
  console.error("adding members failed:", error);
  process.exitCode = 1;
} finally {
  await database.close();
}
