import { describe, expect, it } from "vitest";
import { ConfigError, parseConfig } from "../src/config.ts";

describe("parseConfig", () => {
  it("applies defaults when optional variables are missing, listening on localhost only", () => {
    expect(parseConfig({})).toEqual({ port: 3000, host: "127.0.0.1", logLevel: "info" });
  });

  it("reads PORT, HOST and LOG_LEVEL from the environment", () => {
    expect(parseConfig({ PORT: "8080", HOST: "0.0.0.0", LOG_LEVEL: "debug" })).toEqual({
      port: 8080,
      host: "0.0.0.0",
      logLevel: "debug",
    });
  });

  it.each([
    ["PORT", "abc"],
    ["PORT", "70000"],
    ["LOG_LEVEL", "loud"],
  ])("rejects an invalid %s, naming the variable but not its value", (key, value) => {
    const parse = () => parseConfig({ [key]: value });

    expect(parse).toThrow(ConfigError);
    expect(parse).toThrow(key);
    expect(parse).not.toThrow(value);
  });

  it("rejects an empty PORT instead of treating it as port 0", () => {
    expect(() => parseConfig({ PORT: "" })).toThrow(ConfigError);
  });

  it("rejects an empty HOST instead of falling back to the default", () => {
    expect(() => parseConfig({ HOST: "" })).toThrow(ConfigError);
  });
});
