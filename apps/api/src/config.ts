import { z } from "zod";

const configSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    // Localhost by default so a dev machine doesn't expose the API to its network.
    // Containers set HOST=0.0.0.0.
    HOST: z.string().min(1).default("127.0.0.1"),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    // Required: the API has no use without its database.
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  })
  .transform((env) => ({
    port: env.PORT,
    host: env.HOST,
    logLevel: env.LOG_LEVEL,
    databaseUrl: env.DATABASE_URL,
  }));

// Derived from the schema, so a new variable can't be parsed but forgotten here.
export type Config = z.output<typeof configSchema>;

export class ConfigError extends Error {
  override name = "ConfigError";
}

export const parseConfig = (env: Record<string, string | undefined>): Config => {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    // Name the variable and the rule only: values may be secrets.
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    throw new ConfigError(`Invalid environment:\n  ${problems.join("\n  ")}`);
  }
  return result.data;
};
