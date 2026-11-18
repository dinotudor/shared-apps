import { component$ } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { StatusMessage } from "@shared-apps/design-system";

// Qwik Router renders this, inside the layout, for any path with no route, and
// answers with status 404. No humour: brief section 10 keeps it out of errors.
export default component$(() => (
  <StatusMessage icon="search" title="Page not found" level={1}>
    This address doesn't exist or has changed.
    <Link q:slot="action" class="wfd-button wfd-button--primary" href="/">
      Back to home
    </Link>
  </StatusMessage>
));

export const head: DocumentHead = { title: "Page not found · What's for dinner?" };
