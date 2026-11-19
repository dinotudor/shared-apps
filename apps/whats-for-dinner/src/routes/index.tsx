import { component$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { _ } from "compiled-i18n";
import { Alert, Card, Icon } from "@shared-apps/design-system";
import { ApiHealth } from "../api-health.ts";
import { apiFor } from "../server/api.ts";
import { getApiHealth } from "../server/health.ts";

// routeLoader$ runs only on the server. Qwik also fails the build if anything from
// src/server/ is used by client code, so the tRPC client never reaches the browser.
export const useApiHealth = routeLoader$((event) =>
  getApiHealth(apiFor(event), (error) => {
    console.error("API health check failed", error);
  }),
);

export default component$(() => {
  const health = useApiHealth();

  return (
    <div class="stack">
      <h1>{_`Week`}</h1>
      {health.value === ApiHealth.Ok ? (
        <Card>
          <p class="row">
            <Icon name="check" label={_`Success`} />
            {_`API connected.`}
          </p>
        </Card>
      ) : (
        <Alert variant="warning" title={_`API unavailable`}>
          {_`Couldn't reach the API. Please try again in a moment.`}
        </Alert>
      )}
    </div>
  );
});

export const head: DocumentHead = () => ({ title: _`What's for dinner?` });
