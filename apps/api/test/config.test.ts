import { describe, expect, it } from "vitest";
import { ConfigError, parseConfig } from "../src/config.ts";

const DATABASE_URL = "postgres://app:secret@localhost:5433/app";
const SECRET = "a-test-secret-that-is-at-least-32-chars";
const required = {
  DATABASE_URL,
  BETTER_AUTH_SECRET: SECRET,
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "client-id.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "client-secret",
  AUTH_ALLOWED_EMAILS: "ana@example.com, bruno@example.com",
  AUTH_TRUSTED_ORIGINS: "http://localhost:5173",
};
const auth = {
  secret: SECRET,
  baseUrl: "http://localhost:3000",
  google: { clientId: "client-id.apps.googleusercontent.com", clientSecret: "client-secret" },
  allowedEmails: ["ana@example.com", "bruno@example.com"],
  trustedOrigins: ["http://localhost:5173"],
  cookieDomain: undefined,
};

describe("parseConfig", () => {
  it("applies defaults when optional variables are missing, listening on localhost only", () => {
    expect(parseConfig(required)).toEqual({
      port: 3000,
      host: "127.0.0.1",
      logLevel: "info",
      databaseUrl: DATABASE_URL,
      auth,
    });
  });

  it("reads PORT, HOST, LOG_LEVEL and DATABASE_URL from the environment", () => {
    expect(parseConfig({ ...required, PORT: "8080", HOST: "0.0.0.0", LOG_LEVEL: "debug" })).toEqual(
      { port: 8080, host: "0.0.0.0", logLevel: "debug", databaseUrl: DATABASE_URL, auth },
    );
  });

  it("accepts the postgresql:// scheme too", () => {
    const url = "postgresql://app:secret@db:5432/app";

    expect(parseConfig({ ...required, DATABASE_URL: url }).databaseUrl).toBe(url);
  });

  it.each(Object.keys(required))("requires %s", (key) => {
    const parse = () => parseConfig({ ...required, [key]: undefined });

    expect(parse).toThrow(ConfigError);
    expect(parse).toThrow(key);
  });

  it.each([
    ["PORT", "abc"],
    ["PORT", "70000"],
    ["LOG_LEVEL", "loud"],
    // A URL can carry a password, so this one matters most.
    ["DATABASE_URL", "mysql://app:secret@localhost/app"],
    ["DATABASE_URL", "not a url secret"],
    // Better Auth signs cookies with it: a short secret is easy to guess.
    ["BETTER_AUTH_SECRET", "too-short-secret"],
    ["BETTER_AUTH_URL", "ftp://localhost:3000/secret"],
    ["AUTH_ALLOWED_EMAILS", "ana@example.com, secret-not-an-email"],
    ["AUTH_TRUSTED_ORIGINS", "localhost:5173/secret"],
    // An origin is scheme, host and port. A path would never match a request's origin.
    ["AUTH_TRUSTED_ORIGINS", "http://localhost:5173/secret"],
    ["AUTH_COOKIE_DOMAIN", "https://example.com/secret"],
  ])("rejects an invalid %s, naming the variable but not its value", (key, value) => {
    const parse = () => parseConfig({ ...required, [key]: value });

    expect(parse).toThrow(ConfigError);
    expect(parse).toThrow(key);
    expect(parse).not.toThrow(value);
    expect(parse).not.toThrow("secret");
  });

  it("rejects an allowlist with no emails, which would let nobody sign in", () => {
    expect(() => parseConfig({ ...required, AUTH_ALLOWED_EMAILS: " , " })).toThrow(
      "AUTH_ALLOWED_EMAILS",
    );
  });

  it("reads several trusted origins and an optional cookie domain", () => {
    const config = parseConfig({
      ...required,
      AUTH_TRUSTED_ORIGINS: "https://dinner.example.com/,https://other.example.com",
      AUTH_COOKIE_DOMAIN: "example.com",
    });

    expect(config.auth.trustedOrigins).toEqual([
      "https://dinner.example.com",
      "https://other.example.com",
    ]);
    expect(config.auth.cookieDomain).toBe("example.com");
  });

  it("rejects an empty PORT instead of treating it as port 0", () => {
    expect(() => parseConfig({ ...required, PORT: "" })).toThrow(ConfigError);
  });

  it("rejects an empty HOST instead of falling back to the default", () => {
    expect(() => parseConfig({ ...required, HOST: "" })).toThrow(ConfigError);
  });
});
