import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  HOST: z.string().min(1).default("0.0.0.0"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type Config = {
  port: number;
  host: string;
  logLevel: z.infer<typeof envSchema>["LOG_LEVEL"];
};

export class ConfigError extends Error {
  override name = "ConfigError";
}

export const parseConfig = (env: Record<string, string | undefined>): Config => {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    // Name the variable and the rule only: values may be secrets.
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    throw new ConfigError(`Invalid environment:\n  ${problems.join("\n  ")}`);
  }
  const { PORT, HOST, LOG_LEVEL } = result.data;
  return { port: PORT, host: HOST, logLevel: LOG_LEVEL };
};
