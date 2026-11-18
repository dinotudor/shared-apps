import { describe, expect, it } from "vitest";
import { passCookiesOn } from "../src/server/cookies.ts";
import { fakeCookie } from "./fake-cookie.ts";

const responseSetting = (...cookies: string[]) => {
  const headers = new Headers();
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { headers });
};

describe("passCookiesOn", () => {
  it("passes every cookie on, not just the last one", () => {
    const { event, set } = fakeCookie();

    passCookiesOn(
      responseSetting(
        "better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
        "better-auth.session_data=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
        "better-auth.dont_remember=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
      ),
      event,
    );

    expect(set.mock.calls.map(([name]) => name)).toEqual([
      "better-auth.session_token",
      "better-auth.session_data",
      "better-auth.dont_remember",
    ]);
  });

  it("keeps the value exactly as the API signed it, and every attribute", () => {
    const { event, set } = fakeCookie();

    passCookiesOn(
      responseSetting(
        "__Secure-better-auth.session_token=abc.d%2Be%3D; Max-Age=604800; Domain=example.com; " +
          "Path=/; HttpOnly; Secure; SameSite=Lax",
      ),
      event,
    );

    expect(set).toHaveBeenCalledExactlyOnceWith(
      "__Secure-better-auth.session_token",
      "abc.d%2Be%3D",
      {
        maxAge: 604800,
        domain: "example.com",
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
    );
  });

  it("keeps an Expires date", () => {
    const { event, set } = fakeCookie();

    passCookiesOn(
      responseSetting("better-auth.state=s1; Expires=Wed, 18 Nov 2026 10:00:00 GMT; Path=/"),
      event,
    );

    expect(set).toHaveBeenCalledExactlyOnceWith("better-auth.state", "s1", {
      expires: "Wed, 18 Nov 2026 10:00:00 GMT",
      path: "/",
    });
  });

  it("does nothing when the response sets no cookie", () => {
    const { event, set } = fakeCookie();

    passCookiesOn(responseSetting(), event);

    expect(set).not.toHaveBeenCalled();
  });
});
