import { describe, expect, it } from "vitest";
import { ConfigError, parseConfig } from "../src/config.ts";

const DATABASE_URL = "postgres://app:secret@localhost:5433/app";
const required = { DATABASE_URL };

describe("parseConfig", () => {
  it("applies defaults when optional variables are missing, listening on localhost only", () => {
    expect(parseConfig(required)).toEqual({
      port: 3000,
      host: "127.0.0.1",
      logLevel: "info",
      databaseUrl: DATABASE_URL,
    });
  });

  it("reads PORT, HOST, LOG_LEVEL and DATABASE_URL from the environment", () => {
    expect(parseConfig({ ...required, PORT: "8080", HOST: "0.0.0.0", LOG_LEVEL: "debug" })).toEqual(
      { port: 8080, host: "0.0.0.0", logLevel: "debug", databaseUrl: DATABASE_URL },
    );
  });

  it("accepts the postgresql:// scheme too", () => {
    const url = "postgresql://app:secret@db:5432/app";

    expect(parseConfig({ DATABASE_URL: url }).databaseUrl).toBe(url);
  });

  it("requires DATABASE_URL", () => {
    const parse = () => parseConfig({});

    expect(parse).toThrow(ConfigError);
    expect(parse).toThrow("DATABASE_URL");
  });

  it.each([
    ["PORT", "abc"],
    ["PORT", "70000"],
    ["LOG_LEVEL", "loud"],
    // A URL can carry a password, so this one matters most.
    ["DATABASE_URL", "mysql://app:secret@localhost/app"],
    ["DATABASE_URL", "not a url secret"],
  ])("rejects an invalid %s, naming the variable but not its value", (key, value) => {
    const parse = () => parseConfig({ ...required, [key]: value });

    expect(parse).toThrow(ConfigError);
    expect(parse).toThrow(key);
    expect(parse).not.toThrow(value);
    expect(parse).not.toThrow("secret");
  });

  it("rejects an empty PORT instead of treating it as port 0", () => {
    expect(() => parseConfig({ ...required, PORT: "" })).toThrow(ConfigError);
  });

  it("rejects an empty HOST instead of falling back to the default", () => {
    expect(() => parseConfig({ ...required, HOST: "" })).toThrow(ConfigError);
  });
});
