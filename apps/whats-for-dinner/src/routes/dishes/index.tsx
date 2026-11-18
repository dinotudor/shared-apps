import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { StatusMessage } from "@shared-apps/design-system";

// Placeholder for the Dishes tab, so the navigation has somewhere to go. The real
// screen is #24.
export default component$(() => (
  <div class="stack">
    <h1>Dishes</h1>
    <StatusMessage icon="dishes" title="Coming soon">
      The dish list comes in a later version.
    </StatusMessage>
  </div>
));

export const head: DocumentHead = { title: "Dishes · What's for dinner?" };
