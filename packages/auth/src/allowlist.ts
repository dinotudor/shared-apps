/** Emails compare without case: Google may return them with capitals the env var doesn't use. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** Whether `email` may sign in. An empty allowlist lets nobody in. */
export const createAllowlist = (emails: readonly string[]): ((email: unknown) => boolean) => {
  const allowed = new Set(emails.map(normalizeEmail));
  return (email) => typeof email === "string" && allowed.has(normalizeEmail(email));
};
