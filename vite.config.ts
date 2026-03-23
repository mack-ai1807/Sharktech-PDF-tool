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
    warmup: {
      clientFiles: [
        "./src/main.tsx",
        "./src/App.tsx",
        "./src/components/layout/Toolbar.tsx",
        "./src/components/viewer/PdfDocument.tsx",
      ],
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
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react/jsx-runtime")
          ) {
            return "vendor-react";
          }
          if (id.includes("node_modules/pdfjs-dist/")) {
            return "vendor-pdfjs";
          }
          if (id.includes("node_modules/pdf-lib/")) {
            return "vendor-pdflib";
          }
          if (id.includes("node_modules/zustand/")) {
            return "vendor-zustand";
          }
        },
      },
    },
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
