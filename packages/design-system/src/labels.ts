import { createContextId, useContext, useContextProvider } from "@qwik.dev/core";

/**
 * The text the components write themselves. The package has no translations: an app
 * passes these in its own language once, through useLabelsProvider in its layout.
 */
export type DesignSystemLabels = {
  /** The logo's alt text. */
  appName: string;
  /** The close button of Dialog, BottomSheet and Toast. */
  close: string;
  /** The names of the Alert variants' icons. */
  warning: string;
  information: string;
  success: string;
  /** BottomNav's accessible name, unless it gets `label`. */
  mainNavigation: string;
  /** LoadingState's text, unless it gets `label`. */
  loading: string;
  offlineTitle: string;
  offlineBody: string;
};

/** English, the source language. Used when no app provides labels, as in this package's tests. */
export const DEFAULT_LABELS: DesignSystemLabels = {
  appName: "What's for dinner?",
  close: "Close",
  warning: "Warning",
  information: "Information",
  success: "Success",
  mainNavigation: "Main navigation",
  loading: "Thinking about dinner…",
  offlineTitle: "No connection.",
  offlineBody: "What you've already seen is still here.",
};

const LabelsContext = createContextId<DesignSystemLabels>("wfd.labels");

/** Gives every component below this one the app's labels. Call it once, in the root layout. */
export const useLabelsProvider = (labels: DesignSystemLabels): void => {
  useContextProvider(LabelsContext, labels);
};

/** The labels for this component: the app's, or the English defaults. */
export const useLabels = (): DesignSystemLabels => useContext(LabelsContext, DEFAULT_LABELS);
