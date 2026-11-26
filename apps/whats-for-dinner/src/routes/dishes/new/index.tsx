import { component$ } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { _ } from "compiled-i18n";
import { StatusMessage } from "@shared-apps/design-system";
import { DISHES_PATH } from "../../../dishes/paths.ts";

// STUB(#26): the New dish screen. Here so the Dishes page's "New dish" doesn't lead to a 404.
export default component$(() => (
  <StatusMessage icon="plus" title={_`New dish`} level={1}>
    {_`Saving a dish comes in a later version.`}
    <Link q:slot="action" class="wfd-button wfd-button--secondary" href={DISHES_PATH}>
      {_`Back to dishes`}
    </Link>
  </StatusMessage>
));

export const head: DocumentHead = () => ({ title: _`New dish · What's for dinner?` });
