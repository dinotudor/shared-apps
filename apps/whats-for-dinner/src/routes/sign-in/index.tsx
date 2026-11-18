import { component$ } from "@qwik.dev/core";
import { Form, routeAction$, useLocation } from "@qwik.dev/router";
import type { DocumentHead, RequestHandler } from "@qwik.dev/router";
import { Alert, Button, Logo } from "@shared-apps/design-system";
import { safeNext, startGoogleSignIn } from "../../server/auth.ts";
import { getViewer } from "../../server/viewer.ts";

// Someone already signed in has nothing to do here.
export const onGet: RequestHandler = async (event) => {
  const viewer = await getViewer(event);
  if (viewer) {
    // Qwik ends the request when the redirect is thrown.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw event.redirect(302, safeNext(event.url.searchParams.get("next")));
  }
};

export const useSignInWithGoogle = routeAction$(async (form, event) => {
  const next = typeof form.next === "string" ? form.next : null;
  let googleUrl: string;
  try {
    googleUrl = await startGoogleSignIn(event, next);
  } catch (error) {
    console.error("could not start Google sign-in:", error);
    return event.fail(503, { failed: true });
  }
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw event.redirect(302, googleUrl);
});

// Better Auth sends refused sign-ins back here with ?error=<code>.
const errorMessage = (code: string | null): string | null => {
  if (!code) return null;
  if (code === "email_not_allowed") {
    return "This email doesn't have access. Ask someone in the family to add you.";
  }
  return "Couldn't sign in. Please try again.";
};

export default component$(() => {
  const location = useLocation();
  const signIn = useSignInWithGoogle();
  const error = signIn.value?.failed
    ? "Couldn't sign in right now. Please try again in a moment."
    : errorMessage(location.url.searchParams.get("error"));

  return (
    <div class="stack sign-in">
      <Logo variant="mark" height={56} decorative />
      <h1>Sign in</h1>
      {error && <Alert variant="warning">{error}</Alert>}
      {/* A full-page post: the browser follows the redirect to Google itself. */}
      <Form action={signIn} reloadDocument>
        <input type="hidden" name="next" value={location.url.searchParams.get("next") ?? ""} />
        <Button type="submit">Sign in with Google</Button>
      </Form>
    </div>
  );
});

export const head: DocumentHead = { title: "Sign in · What's for dinner?" };
