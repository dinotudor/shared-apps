import { component$, Slot } from "@qwik.dev/core";
import { Link, useLocation } from "@qwik.dev/router";
import { BottomNav, Logo } from "@shared-apps/design-system";
import type { BottomNavItem } from "@shared-apps/design-system";
import "../global.css";

const NAV_ITEMS: BottomNavItem[] = [
  { href: "/", label: "Início", icon: "pot" },
  { href: "/design-system/", label: "Componentes", icon: "sticker" },
];

export default component$(() => {
  const location = useLocation();

  return (
    <div class="app">
      <header class="app__header">
        <Logo variant="lockup" height={30} />
      </header>
      <main class="app__main">
        <Slot />
      </main>
      <div class="app__nav">
        <BottomNav items={NAV_ITEMS} current={location.url.pathname} link={Link} />
      </div>
    </div>
  );
});
