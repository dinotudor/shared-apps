import { component$ } from "@qwik.dev/core";
import type { Component, PropsOf } from "@qwik.dev/core";
import { useLabels } from "../labels.ts";
import { Icon, type IconName } from "./icon.tsx";

export type BottomNavItem = { href: string; label: string; icon: IconName };

export type BottomNavProps = {
  /** Up to five destinations. Labels are always visible. */
  items: BottomNavItem[];
  /** The current path. The item with the longest matching href is marked current. */
  current?: string;
  /** Name of the navigation landmark. The default is labels.mainNavigation. */
  label?: string;
  /**
   * Renders each link instead of a plain `<a>`, such as Qwik Router's `Link` for client-side
   * navigation. It receives the anchor attributes and must render an `<a>` with them.
   */
  link?: Component<PropsOf<"a">>;
};

/** "/dishes/" and "/dishes" are the same page (Qwik Router adds trailing slashes). */
const normalize = (path: string): string => (path.length > 1 ? path.replace(/\/+$/, "") : path);

/** "/" matches only itself; any other href matches its own path and the paths below it. */
const matches = (href: string, current: string): boolean =>
  href === "/" ? current === "/" : current === href || current.startsWith(`${href}/`);

/** The href of the most specific item that matches the current path, if any. */
const currentHref = (items: BottomNavItem[], current: string | undefined) => {
  if (current === undefined) return undefined;
  const path = normalize(current);
  return items
    .map((item) => normalize(item.href))
    .filter((href) => matches(href, path))
    .sort((a, b) => b.length - a.length)[0];
};

const linkProps = (item: BottomNavItem, active: string | undefined): PropsOf<"a"> => ({
  class: "wfd-bottom-nav__link",
  href: item.href,
  "aria-current": normalize(item.href) === active ? "page" : undefined,
});

const LinkContent = component$<{ item: BottomNavItem }>(({ item }) => (
  <>
    <span class="wfd-bottom-nav__indicator">
      <Icon name={item.icon} />
    </span>
    {item.label}
  </>
));

// Plain links unless the app passes `link`: the package does not depend on the router.
// The current item gets a pill behind its icon as well as the action colour, so state
// is not colour alone.
export const BottomNav = component$<BottomNavProps>(({ items, current, label, link: Link }) => {
  const labels = useLabels();
  const active = currentHref(items, current);
  return (
    <nav class="wfd-bottom-nav" aria-label={label ?? labels.mainNavigation}>
      <ul class="wfd-bottom-nav__list">
        {items.map((item) => (
          <li key={item.href}>
            {Link ? (
              <Link {...linkProps(item, active)}>
                <LinkContent item={item} />
              </Link>
            ) : (
              <a {...linkProps(item, active)}>
                <LinkContent item={item} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
});
