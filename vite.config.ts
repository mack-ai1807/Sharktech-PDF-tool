import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    host: true,
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  optimizeDeps: {
    include: [
      "pdfjs-dist",
      "pdf-lib",
      "react",
      "react-dom",
      "react/jsx-runtime",
      "zustand",
      "zustand/middleware",
    ],
  },
  worker: {
    format: "es",
  },

  // ── Vitest configuration ──────────────────────────────────────────────────
  test: {
    globals: true,
    environment: "jsdom",
    pool: "threads",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Exclude large packages from Vitest's dep optimizer — pdfjs-dist is always
    // mocked in tests; bundling it causes a multi-minute hang in low-memory envs.
    server: {
      deps: {
        external: ["pdfjs-dist", "pdfjs-dist/build/pdf.worker.mjs"],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/stores/**", "src/pdf/**", "src/hooks/**"],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
}));
