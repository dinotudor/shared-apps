// What other packages may reference from auth's tables: `user`, for foreign keys such as
// membership's `app_member.user_id`. Sessions, accounts and verification tokens stay
// private to this package. schema.ts keeps every table, since drizzle-kit reads it by glob.
export { user } from "./schema.ts";
