import { component$, Slot } from "@qwik.dev/core";
import type { Component, PropsOf } from "@qwik.dev/core";

/**
 * Qwik Router's Link, passed in by the app. Components take it as a prop, so their tests
 * can render them without a router and get plain links.
 */
export type LinkComponent = Component<PropsOf<"a">>;

export type AnyLinkProps = PropsOf<"a"> & { link?: LinkComponent | undefined };

/** A link that uses `link` when given, for client-side navigation, and a plain `<a>` otherwise. */
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
