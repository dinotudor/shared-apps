import { component$, Slot } from "@qwik.dev/core";
import type { Component, PropsOf } from "@qwik.dev/core";

export type AnyLinkProps = PropsOf<"a"> & {
  /** Qwik Router's Link in the app. Tests leave it out and get a plain link. */
  link?: Component<PropsOf<"a">> | undefined;
};

/**
 * A link that uses Qwik Router's Link when the app passes it in, for client-side
 * navigation, and a plain `<a>` otherwise. Components take `link` as a prop so their
 * tests can render them without a router.
 */
export const AnyLink = component$<AnyLinkProps>(({ link: Link, ...rest }) =>
  Link ? (
    <Link {...rest}>
      <Slot />
    </Link>
  ) : (
    <a {...rest}>
      <Slot />
    </a>
  ),
);
