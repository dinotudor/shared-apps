import type { BottomNavItem } from "@shared-apps/design-system";
import { _ } from "compiled-i18n";

/**
 * The bottom navigation tabs (brief section 6). Week is the home screen. A function, not a
 * constant: the server renders every locale from the same module, so labels are translated
 * per render.
 */
export const navItems = (): BottomNavItem[] => [
  { href: "/", label: _`Week`, icon: "week" },
  { href: "/dishes/", label: _`Dishes`, icon: "dishes" },
];

// Each tab also owns the pages reached from it: a day and its planning page belong to
// Week, so Week stays marked while you are inside one of its days.
const SECTIONS: { tab: string; paths: string[] }[] = [
  { tab: "/", paths: ["/day"] },
  { tab: "/dishes/", paths: ["/dishes"] },
];

const isUnder = (pathname: string, path: string): boolean =>
  pathname === path || pathname.startsWith(`${path}/`);

/** The href of the tab that `pathname` belongs to, or undefined for pages outside the tabs. */
export const navCurrent = (pathname: string): string | undefined => {
  if (pathname === "/") return "/";
  return SECTIONS.find(({ paths }) => paths.some((path) => isUnder(pathname, path)))?.tab;
};
