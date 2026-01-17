import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
const plugins = [react(), tailwindcss()];

export default defineConfig({
  plugins,
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true, // Enable source maps for debugging
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Don't split React - let dedupe handle it
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return undefined; // Let it go to main bundle with dedupe
          }
          // Split Radix UI into its own chunk (large, stable, cacheable)
          if (id.includes('@radix-ui')) {
            return 'vendor-radix';
          }
          // Split data fetching libraries
          if (id.includes('@tanstack') || id.includes('@trpc')) {
            return 'vendor-data';
          }
          // Split utility libraries
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      "validatestrategy.com",
      ".validatestrategy.com",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
