import { createRenderer } from "@qwik.dev/router";
import { extractBase, setSsrLocaleGetter } from "compiled-i18n/qwik";
import { DEFAULT_LOCALE } from "./i18n/locale.ts";
import Root from "./root.tsx";

// `_` reads the locale that the layout's onRequest chose (src/server/locale.ts). The
// helper imports @builder.io/qwik, which Qwik 2's Vite plugin aliases to @qwik.dev/core.
// The alias is undocumented: if Qwik drops it, copy setSsrLocaleGetter and extractBase
// (about 10 lines) into src/i18n/ instead (playbook ADR 0015, project ADR 0009).
setSsrLocaleGetter();

// The only place the Qwik renderer runs. In the browser, the page resumes instead.
export default createRenderer((opts) => ({
  jsx: <Root />,
  options: {
    ...opts,
    // Each locale has its own client build, under /build/<locale>/.
    base: extractBase,
    containerAttributes: {
      lang: opts.serverData.locale ?? DEFAULT_LOCALE,
      ...opts.containerAttributes,
    },
  },
}));
