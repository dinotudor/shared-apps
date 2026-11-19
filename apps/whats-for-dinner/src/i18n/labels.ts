import { _ } from "compiled-i18n";
import type { DesignSystemLabels } from "@shared-apps/design-system";

/** The design system's own copy, in the request's locale. The root component provides it. */
export const designSystemLabels = (): DesignSystemLabels => ({
  appName: _`What's for dinner?`,
  close: _`Close`,
  warning: _`Warning`,
  information: _`Information`,
  success: _`Success`,
  mainNavigation: _`Main navigation`,
  loading: _`Thinking about dinner…`,
  offlineTitle: _`No connection.`,
  offlineBody: _`What you've already seen is still here.`,
});
