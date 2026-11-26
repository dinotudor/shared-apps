import type { Modules } from "../../src/router.ts";

const unusedModule = (name: string): unknown =>
  new Proxy(
    {},
    {
      get: (_, method) => () =>
        Promise.reject(
          new Error(`this test does not call module procedures (${name}.${String(method)})`),
        ),
    },
  );

/**
 * Every module, for tests that build the full app router but never reach a module:
 * the session check rejects first. A Proxy, so a new module needs no edit here.
 */
// The cast is the point: any module, any method, rejects when called.
export const unusedModules = new Proxy(
  {},
  { get: (_, name) => unusedModule(String(name)) },
) as Modules;
