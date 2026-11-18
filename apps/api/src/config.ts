import { z } from "zod";

/** A comma-separated list, trimmed, without empty entries. */
const commaList = (item: z.ZodType<string, string>) =>
  z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    )
    .pipe(z.array(item).min(1));

const httpUrl = z.url({ protocol: /^https?$/ });

// Scheme, host and port only: Better Auth compares it with a request's Origin header.
const origin = httpUrl
  .refine((value) => new URL(value).origin === value.replace(/\/$/, ""), {
    message: "must be an origin, such as https://dinner.example.com, without a path",
  })
  .transform((value) => new URL(value).origin);

// Required: the API has no use without its database.
const databaseUrl = z.url({ protocol: /^postgres(ql)?$/ });

const configSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    // Localhost by default so a dev machine doesn't expose the API to its network.
    // Containers set HOST=0.0.0.0.
    HOST: z.string().min(1).default("127.0.0.1"),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    DATABASE_URL: databaseUrl,
    // Signs session cookies. Generate one with `openssl rand -base64 32`.
    BETTER_AUTH_SECRET: z.string().min(32),
    // Public URL of this API. Google sends people back to <it>/api/auth/callback/google.
    BETTER_AUTH_URL: httpUrl,
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    // Who may sign in (playbook ADR 0008). In the environment, never in code: the repo is public.
    AUTH_ALLOWED_EMAILS: commaList(z.email()),
    // The frontends' origins: Better Auth only redirects to them and accepts requests from them.
    AUTH_TRUSTED_ORIGINS: commaList(origin),
    // Production only: the parent domain of the API and the frontends, to share the cookie.
    AUTH_COOKIE_DOMAIN: z.hostname().optional(),
  })
  .transform((env) => ({
    port: env.PORT,
    host: env.HOST,
    logLevel: env.LOG_LEVEL,
    databaseUrl: env.DATABASE_URL,
    auth: {
      secret: env.BETTER_AUTH_SECRET,
      baseUrl: env.BETTER_AUTH_URL,
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
      allowedEmails: env.AUTH_ALLOWED_EMAILS,
      trustedOrigins: env.AUTH_TRUSTED_ORIGINS,
      cookieDomain: env.AUTH_COOKIE_DOMAIN,
    },
  }));

// `pnpm db:migrate` needs the database only. It uses the server's rule for DATABASE_URL,
// and the deployed release step doesn't have to hold the sign-in secrets.
const migrateConfigSchema = z
  .object({ DATABASE_URL: databaseUrl })
  .transform((env) => ({ databaseUrl: env.DATABASE_URL }));

// Derived from the schema, so a new variable can't be parsed but forgotten here.
export type Config = z.output<typeof configSchema>;
export type MigrateConfig = z.output<typeof migrateConfigSchema>;

export class ConfigError extends Error {
  override name = "ConfigError";
}

const parseWith =
  <T>(schema: z.ZodType<T>) =>
  (env: Record<string, string | undefined>): T => {
    const result = schema.safeParse(env);
    if (!result.success) {
      // Name the variable and the rule only: values may be secrets.
      const problems = result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
      throw new ConfigError(`Invalid environment:\n  ${problems.join("\n  ")}`);
    }
    return result.data;
  };

export const parseConfig: (env: Record<string, string | undefined>) => Config =
  parseWith(configSchema);

export const parseMigrateConfig: (env: Record<string, string | undefined>) => MigrateConfig =
  parseWith(migrateConfigSchema);
