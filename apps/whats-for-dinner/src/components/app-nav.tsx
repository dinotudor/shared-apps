import { component$ } from "@qwik.dev/core";
import type { Component, PropsOf } from "@qwik.dev/core";
import { BottomNav } from "@shared-apps/design-system";
import { navCurrent, navItems } from "../navigation.ts";

export type AppNavProps = {
  pathname: string;
  /** Qwik Router's Link in the app. Tests leave it out and get plain links. */
  link?: Component<PropsOf<"a">>;
};

/**
 * The bottom navigation. BottomNav only marks a tab whose href prefixes the path, so the
 * app maps the path to its tab first: a day page (/day/…) marks Week, whose href is "/".
 */
export const AppNav = component$<AppNavProps>(({ pathname, link }) => (
  <BottomNav items={navItems()} current={navCurrent(pathname)} link={link} />
));
