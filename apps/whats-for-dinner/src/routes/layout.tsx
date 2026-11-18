import { component$, Slot, sync$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { Link, routeLoader$, useLocation } from "@qwik.dev/router";
import type { RequestHandler } from "@qwik.dev/router";
import { Avatar, Logo, OfflineNotice } from "@shared-apps/design-system";
import { AppNav } from "../components/app-nav.tsx";
import { useConnectionProvider } from "../connection.ts";
import { requireViewer, viewerFrom } from "../server/guard.ts";
import { getViewer } from "../server/viewer.ts";
import "../global.css";

// Every page needs a signed-in viewer, except sign-in itself (src/server/guard.ts).
export const onRequest: RequestHandler = (event) => requireViewer(event, getViewer);

// Only what the header shows goes to the browser.
export const useViewer = routeLoader$((event) => {
  const viewer = viewerFrom(event);
  return viewer ? { name: viewer.name } : null;
});

/**
 * After a client-side navigation, moves focus to the new page's heading, so screen
 * readers announce the page and keyboard users start from its top. The first load is
 * left alone: the browser already starts there.
 */
const useFocusOnNavigation = () => {
  const location = useLocation();
  const lastPath = useSignal<string>();
  // It has to run in the browser after the new page is in the DOM; idle is soon enough.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(
    ({ track }) => {
      const pathname = track(() => location.url.pathname);
      const navigating = track(() => location.isNavigating);
      if (navigating) return;
      const previous = lastPath.value;
      lastPath.value = pathname;
      if (previous === undefined || previous === pathname) return;
      const main = document.getElementById("main");
      const target = main?.querySelector<HTMLElement>("h1") ?? main;
      if (!target) return;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus();
    },
    { strategy: "document-idle" },
  );
};

// Qwik Router handles #hash links itself and cancels the browser's default, which would
// have moved focus to <main>. sync$ runs inline, with no code to fetch, so it works offline.
const focusMain = sync$(() => {
  document.getElementById("main")?.focus();
});

export default component$(() => {
  const viewer = useViewer();
  const location = useLocation();
  useConnectionProvider();
  useFocusOnNavigation();

  // Signed out (only the sign-in page gets here): no header or navigation.
  if (!viewer.value) {
    return (
      <main id="main" class="app__main">
        <Slot />
      </main>
    );
  }

  return (
    <div class="app">
      <a class="app__skip" href="#main" onClick$={focusMain}>
        Skip to content
      </a>
      <header class="app__header">
        <Link href="/" class="app__home">
          <Logo variant="lockup" height={30} />
        </Link>
        <Avatar name={viewer.value.name} size={32} />
      </header>
      {/* Always on the page, so the notice is announced when it appears. CSS shows it
          while <html> has data-offline (see useConnectionProvider). */}
      <div class="app__offline" role="status">
        <OfflineNotice />
      </div>
      <main id="main" class="app__main" tabIndex={-1}>
        <Slot />
      </main>
      <div class="app__nav">
        <AppNav pathname={location.url.pathname} link={Link} />
      </div>
    </div>
  );
});
