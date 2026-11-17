import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { Logo } from "@shared-apps/design-system";

// Placeholder: where the guard sends signed-out visitors (src/server/guard.ts). #15
// adds Google sign-in here and uses the `next` query parameter to send people back.
export default component$(() => (
  <div class="stack sign-in">
    <Logo variant="mark" height={56} decorative />
    <h1>Entrar</h1>
    <p>O login com Google chega em breve.</p>
  </div>
));

export const head: DocumentHead = { title: "Entrar · What's for dinner?" };
