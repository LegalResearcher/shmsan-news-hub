import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import viteTsconfigPaths from "vite-tsconfig-paths";

// Standard Vite + TanStack Start + Nitro config.
// Vercel auto-detects TanStack Start + Nitro, so no explicit `preset` is
// needed here — see https://vercel.com/docs/frameworks/full-stack/tanstack-start
//
// Not included (editor/sandbox-only tooling, not needed for a standalone
// deploy): a devtools plugin, a custom error-logger plugin, and dev-server
// port/host auto-detection. Add `@tanstack/devtools-vite` yourself if you
// want the local dev devtools panel back.
export default defineConfig({
  plugins: [
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    viteTsconfigPaths(),
    nitro(),
  ],
  resolve: {
    // Avoid duplicate React copies if any dependency ships its own.
    dedupe: ["react", "react-dom"],
  },
});
