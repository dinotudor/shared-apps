import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { StatusMessage } from "@shared-apps/design-system";

// Placeholder for the Dishes tab, so the navigation has somewhere to go. The real
// screen is #24.
export default component$(() => (
  <div class="stack">
    <h1>Pratos</h1>
    <StatusMessage icon="dishes" title="Em breve">
      A lista de pratos chega numa próxima versão.
    </StatusMessage>
  </div>
));

export const head: DocumentHead = { title: "Pratos · What's for dinner?" };
