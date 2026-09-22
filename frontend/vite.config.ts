import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // P7.4 — recharts (+ its d3/victory-vendor deps) is by far the heaviest
        // dependency and is only used by the dashboard; keep it in its own
        // cached chunk. Function form is REQUIRED under Vite 8/rolldown —
        // the object form throws "manualChunks is not a function" at build.
        manualChunks(id: string) {
          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3-") ||
            id.includes("node_modules/victory-vendor")
          ) {
            return "recharts";
          }
        },
      },
    },
  },
  // Vitest (P7.1) — jsdom + jest-dom via setup file; `npm test` / `npm run test:run`.
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
