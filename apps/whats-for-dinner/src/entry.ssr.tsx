import { createRenderer } from "@qwik.dev/router";
import Root from "./root.tsx";

// The only place the Qwik renderer runs. In the browser, the page resumes instead.
export default createRenderer((opts) => ({
  jsx: <Root />,
  options: {
    ...opts,
    containerAttributes: { lang: "en", ...opts.containerAttributes },
  },
}));
