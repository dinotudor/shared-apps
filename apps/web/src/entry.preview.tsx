import { createQwikRouter } from "@qwik.dev/router/middleware/node";
import render from "./entry.ssr.tsx";

// Entry for `vite preview` (pnpm preview): the production build without the Node server.
export default createQwikRouter({ render });
