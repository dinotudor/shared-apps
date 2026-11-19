import { afterEach, describe, expect, it, vi } from "vitest";
import type { RequestEventBase } from "@qwik.dev/router";
import { safeNext, signOut, startGoogleSignIn } from "../src/server/auth.ts";
import { fakeCookie } from "./fake-cookie.ts";

const GOOGLE_URL = "https://accounts.google.com/o/oauth2/v2/auth?state=abc";

// Only the parts of the request event these functions use.
const eventFor = (cookie = "") => {
  const jar = fakeCookie();
  const event = {
    env: { get: (key: string) => ({ API_URL: "http://api.test" })[key] },
    url: new URL("http://localhost:5173/sign-in/"),
    request: new Request("http://localhost:5173/sign-in/", { headers: { cookie } }),
    clientConn: { ip: "203.0.113.7" },
    ...jar.event,
  } as unknown as RequestEventBase;
  /** The cookies passed on to the browser, by name. */
  const cookiesSet = () => jar.set.mock.calls.map(([name, value]) => `${name}=${value}`);
  return Object.assign(event, { cookiesSet });
};

/** Answers every fetch with `response`, and returns the request the code sent. */
const stubApi = (response: Response) => {
  const fetch = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetch);
  return () => {
    const [url, init] = fetch.mock.calls[0] ?? ["", {}];
    return { url, init, headers: new Headers(init.headers), body: init.body as string };
  };
};

const withCookies = (body: BodyInit | null, cookies: string[], status = 200) => {
  const headers = new Headers({ "content-type": "application/json" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(body, { status, headers });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("startGoogleSignIn", () => {
  it("asks the API for Google's URL, coming back to the page asked for", async () => {
    const sent = stubApi(withCookies(JSON.stringify({ url: GOOGLE_URL, redirect: true }), []));

    const url = await startGoogleSignIn(eventFor(), "/dishes/");

    expect(url).toBe(GOOGLE_URL);
    expect(sent().url).toBe("http://api.test/api/auth/sign-in/social");
    expect(sent().init.method).toBe("POST");
    // Better Auth only accepts requests from trusted origins.
    expect(sent().headers.get("origin")).toBe("http://localhost:5173");
    expect(JSON.parse(sent().body)).toEqual({
      provider: "google",
      callbackURL: "http://localhost:5173/dishes/",
      errorCallbackURL: "http://localhost:5173/sign-in/",
    });
  });

  it("tells the API the browser's IP, for its rate limit", async () => {
    const sent = stubApi(withCookies(JSON.stringify({ url: GOOGLE_URL, redirect: true }), []));

    await startGoogleSignIn(eventFor(), "/");

    expect(sent().headers.get("x-forwarded-for")).toBe("203.0.113.7");
  });

  it("never comes back to another site, whatever next says", async () => {
    const sent = stubApi(withCookies(JSON.stringify({ url: GOOGLE_URL, redirect: true }), []));

    await startGoogleSignIn(eventFor(), "//evil.example/");

    const body = JSON.parse(sent().body) as { callbackURL: string };
    expect(body.callbackURL).toBe("http://localhost:5173/");
  });

  it("passes the sign-in state cookies on to the browser", async () => {
    stubApi(
      withCookies(JSON.stringify({ url: GOOGLE_URL, redirect: true }), [
        "better-auth.state=s1; Path=/; HttpOnly",
        "better-auth.other=o1; Path=/; HttpOnly",
      ]),
    );
    const event = eventFor();

    await startGoogleSignIn(event, "/");

    expect(event.cookiesSet()).toEqual(["better-auth.state=s1", "better-auth.other=o1"]);
  });

  it("fails when the API refuses", async () => {
    stubApi(withCookies(JSON.stringify({ message: "forbidden" }), [], 403));

    await expect(startGoogleSignIn(eventFor(), "/")).rejects.toThrow("403");
  });
});

describe("signOut", () => {
  it("ends the session at the API and passes the cleared cookie on to the browser", async () => {
    const sent = stubApi(
      withCookies(JSON.stringify({ success: true }), ["better-auth.session_token=; Max-Age=0"]),
    );
    const event = eventFor("better-auth.session_token=abc");

    await signOut(event);

    expect(sent().url).toBe("http://api.test/api/auth/sign-out");
    expect(sent().init.method).toBe("POST");
    expect(sent().headers.get("cookie")).toBe("better-auth.session_token=abc");
    expect(sent().headers.get("x-forwarded-for")).toBe("203.0.113.7");
    expect(event.cookiesSet()).toEqual(["better-auth.session_token="]);
  });
});

describe("safeNext", () => {
  it.each([
    ["/", "/"],
    ["/dishes/", "/dishes/"],
    ["/dishes/42/?tab=notes#ratings", "/dishes/42/?tab=notes#ratings"],
    // Encoded slashes stay part of the path: the browser doesn't decode them in Location.
    ["/%2F%2Fevil.example/", "/%2F%2Fevil.example/"],
  ])("keeps the same-origin path %s", (next, expected) => {
    expect(safeNext(next)).toBe(expected);
  });

  it.each([
    ["missing", null],
    ["empty", ""],
    ["an absolute URL", "https://evil.example/"],
    ["a scheme-relative URL", "//evil.example/"],
    // Browsers read a backslash as a slash, so /\evil.example is //evil.example.
    ["a path starting with /\\", "/\\evil.example/"],
    ["a backslash anywhere", "/dishes\\..\\@evil.example"],
    ["a javascript: URL", "javascript:alert(1)"],
    ["a relative path", "dishes/"],
    // Browsers drop tabs and newlines from URLs, so "/\t/evil.example" is //evil.example.
    ["a tab", "/\t/evil.example/"],
    ["a newline", "/\n/evil.example/"],
    ["a NUL", "/dishes/\u0000"],
    ["a DEL", "/dishes/\u007f"],
    ["the sign-in page, which would loop", "/sign-in/?next=%2F"],
  ])("replaces %s with the home page", (_, next) => {
    expect(safeNext(next)).toBe("/");
  });
});
