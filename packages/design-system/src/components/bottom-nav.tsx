import { component$ } from "@qwik.dev/core";
import { Icon, type IconName } from "./icon.tsx";

export type BottomNavItem = { href: string; label: string; icon: IconName };

export type BottomNavProps = {
  /** Up to five destinations. Labels are always visible. */
  items: BottomNavItem[];
  /** `href` of the current destination. */
  current?: string;
  /** Name of the navigation landmark. */
  label?: string;
};

// Plain links: the package does not depend on the router. The current item gets a
// pill behind its icon as well as the action colour, so state is not colour alone.
export const BottomNav = component$<BottomNavProps>(
  ({ items, current, label = "Navegação principal" }) => (
    <nav class="wfd-bottom-nav" aria-label={label}>
      <ul class="wfd-bottom-nav__list">
        {items.map((item) => (
          <li key={item.href}>
            <a
              class="wfd-bottom-nav__link"
              href={item.href}
              aria-current={item.href === current ? "page" : undefined}
            >
              <span class="wfd-bottom-nav__indicator">
                <Icon name={item.icon} />
              </span>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  ),
);
