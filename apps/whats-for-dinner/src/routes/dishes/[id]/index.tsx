import { component$ } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { _ } from "compiled-i18n";
import { StatusMessage } from "@shared-apps/design-system";
import { DISHES_PATH } from "../../../dishes/paths.ts";

// STUB(#25): the Dish screen. Here so a dish card doesn't lead to a 404.
export default component$(() => (
  <StatusMessage icon="dishes" title={_`Coming soon`} level={1}>
    {_`The dish page comes in a later version.`}
    <Link q:slot="action" class="wfd-button wfd-button--secondary" href={DISHES_PATH}>
      {_`Back to dishes`}
    </Link>
  </StatusMessage>
));

export const head: DocumentHead = () => ({ title: _`Dishes · What's for dinner?` });
