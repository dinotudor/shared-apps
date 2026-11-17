export class ConfigError extends Error {
  override name = "ConfigError";
}

/** Validates API_URL and returns it without a trailing slash. */
export const parseApiUrl = (value: string | undefined): string => {
  if (!value) throw new ConfigError("API_URL is not set");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    // Name the variable only: the value may hold credentials.
    throw new ConfigError("API_URL is not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ConfigError("API_URL must use http or https");
  }
  return url.href.replace(/\/+$/, "");
};

/** Where `pnpm dev` starts apps/api (its default HOST and PORT). */
export const DEV_API_URL = "http://127.0.0.1:3000";

/**
 * API_URL for a request. In dev it falls back to the local API, so a fresh clone runs
 * with `pnpm dev` alone. In production it must be set.
 */
export const resolveApiUrl = (value: string | undefined, { dev }: { dev: boolean }): string =>
  parseApiUrl(value ?? (dev ? DEV_API_URL : undefined));

export type ServerConfig = { port: number; host: string; apiUrl: string };

/** Config for the production Node server. It refuses to start if this throws. */
export const parseServerConfig = (env: Record<string, string | undefined>): ServerConfig => {
  const port = Number(env.PORT ?? "3001");
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new ConfigError("PORT must be an integer from 1 to 65535");
  }
  // Localhost by default, like apps/api. Containers set HOST=0.0.0.0.
  return { port, host: env.HOST ?? "127.0.0.1", apiUrl: parseApiUrl(env.API_URL) };
};
