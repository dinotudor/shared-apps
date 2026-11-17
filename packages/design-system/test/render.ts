import type { JSXOutput } from "@qwik.dev/core";
import { createDOM } from "@qwik.dev/core/testing";

/** Renders JSX into a fresh DOM and returns the container plus Qwik's event helper. */
export const render = async (jsx: JSXOutput) => {
  const dom = await createDOM();
  await dom.render(jsx);
  return { screen: dom.screen, userEvent: dom.userEvent };
};

/** Like querySelector, but fails the test when nothing matches. */
export const get = <E extends Element = HTMLElement>(root: ParentNode, selector: string): E => {
  const element = root.querySelector<E>(selector);
  if (!element) throw new Error(`No element matches ${selector}`);
  return element;
};

/** Every element that matches, as an array (the test DOM's NodeList is not iterable). */
export const all = <E extends Element = HTMLElement>(root: ParentNode, selector: string): E[] =>
  Array.from(root.querySelectorAll<E>(selector));
