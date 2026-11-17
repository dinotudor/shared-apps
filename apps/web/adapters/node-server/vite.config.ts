import { nodeServerAdapter } from "@qwik.dev/router/adapters/node-server/vite";
import { extendConfig } from "@qwik.dev/router/vite";
import baseConfig from "../../vite.config.ts";

// The production server: a long-running Node process (playbook ADR 0005).
export default extendConfig(baseConfig, () => ({
  build: {
    ssr: true,
    rollupOptions: { input: ["src/entry.node-server.tsx", "@qwik-router-config"] },
  },
  plugins: [nodeServerAdapter({ name: "node-server" })],
}));
