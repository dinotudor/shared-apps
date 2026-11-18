import { nodeServerAdapter } from "@qwik.dev/router/adapters/node-server/vite";
import { extendConfig } from "@qwik.dev/router/vite";
import baseConfig from "../../vite.config.ts";

// The production server: a long-running Node process (playbook ADR 0005).
export default extendConfig(baseConfig, () => ({
  build: {
    ssr: true,
    rollupOptions: { input: ["src/entry.node-server.tsx", "@qwik-router-config"] },
  },
  // No static pages: every page, the 404 page included, depends on who is signed in, and
  // there is no API to ask at build time. The server renders them on each request.
  plugins: [nodeServerAdapter({ name: "node-server", ssg: null })],
}));
