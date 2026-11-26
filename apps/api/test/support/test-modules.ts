import type { Modules } from "../../src/router.ts";

const unusedModule = (name: string): unknown =>
  new Proxy(
    {},
    {
      get: (_, method) =>
        // Not a promise, and nothing to print: only method calls are stubbed.
        typeof method === "symbol" || method === "then"
          ? undefined
          : () =>
              Promise.reject(
                new Error(`this test does not use the ${name} module (${name}.${method})`),
              ),
    },
  );

/**
 * The modules for the full app router in a test: the ones it passes in `used`, and a
 * stand-in for every other one, whose methods reject. A Proxy, so a new module in
 * `Modules` needs no edit here or in tests that don't use it.
 */
export const testModules = (used: Partial<Modules> = {}): Modules =>
  // The cast is the point: any module the test didn't pass is a stand-in.
  new Proxy(used, {
    get: (target, name) =>
      typeof name === "string" && !(name in target)
        ? unusedModule(name)
        : (Reflect.get(target, name) as unknown),
  }) as Modules;
