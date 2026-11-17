import { describe, expect, it } from "vitest";
import { parseApiUrl, parseServerConfig } from "../src/server/config.ts";

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

describe("parseServerConfig", () => {
  it("defaults to port 3001 on localhost", () => {
    expect(parseServerConfig({ API_URL: "http://api.test" })).toEqual({
      port: 3001,
      host: "127.0.0.1",
      apiUrl: "http://api.test",
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
