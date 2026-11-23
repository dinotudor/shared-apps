import { describe, expect, it } from "vitest";
import {
  ConfigError,
  DEV_API_URL,
  parseApiUrl,
  DEFAULT_TIME_ZONE,
  parseServerConfig,
  resolveApiUrl,
  resolveTimeZone,
} from "../src/server/config.ts";

describe("parseApiUrl", () => {
  it("accepts an http URL and drops trailing slashes", () => {
    expect(parseApiUrl("http://127.0.0.1:3000/")).toBe("http://127.0.0.1:3000");
  });

  it.each([
    [undefined, "API_URL is not set"],
    ["", "API_URL is not set"],
    ["not a url", "API_URL is not a valid URL"],
    ["ftp://api.test", "API_URL must use http or https"],
  ])("rejects %j", (value, message) => {
    expect(() => parseApiUrl(value)).toThrow(message);
  });

  it("does not repeat the value in the error, since it may hold credentials", () => {
    expect(() => parseApiUrl("secret-token")).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("secret-token") as unknown }),
    );
  });
});

describe("resolveApiUrl", () => {
  it("falls back to the local API in dev when API_URL is not set", () => {
    expect(resolveApiUrl(undefined, { dev: true })).toBe(DEV_API_URL);
  });

  it("requires API_URL outside dev", () => {
    expect(() => resolveApiUrl(undefined, { dev: false })).toThrow("API_URL is not set");
  });

  it("prefers API_URL when it is set", () => {
    expect(resolveApiUrl("http://api.test/", { dev: true })).toBe("http://api.test");
  });
});

describe("parseServerConfig", () => {
  it("defaults to port 3001 on localhost", () => {
    expect(parseServerConfig({ API_URL: "http://api.test" })).toEqual({
      port: 3001,
      host: "127.0.0.1",
      apiUrl: "http://api.test",
      timeZone: "America/Sao_Paulo",
    });
  });

  it.each(["0", "70000", "abc", "3.5"])("rejects PORT=%s", (port) => {
    expect(() => parseServerConfig({ PORT: port, API_URL: "http://api.test" })).toThrow(
      "PORT must be an integer from 1 to 65535",
    );
  });

  it("requires API_URL, so the server does not start without it", () => {
    expect(() => parseServerConfig({})).toThrow("API_URL is not set");
  });
});

describe("resolveTimeZone", () => {
  it("defaults to the family's time zone (brief D1)", () => {
    expect(resolveTimeZone(undefined)).toBe(DEFAULT_TIME_ZONE);
    expect(DEFAULT_TIME_ZONE).toBe("America/Sao_Paulo");
  });

  it("accepts any IANA time zone", () => {
    expect(resolveTimeZone("Europe/Lisbon")).toBe("Europe/Lisbon");
  });

  it("rejects a name Intl doesn't know", () => {
    expect(() => resolveTimeZone("Mars/Olympus")).toThrow(
      "TIME_ZONE is not a valid IANA time zone",
    );
  });

  it("keeps Intl's error as the cause of a rejected name", () => {
    let thrown: unknown;
    try {
      resolveTimeZone("Mars/Olympus");
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(ConfigError);
    expect(thrown instanceof ConfigError && thrown.cause).toBeInstanceOf(RangeError);
  });
});
