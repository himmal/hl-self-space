import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages has no server-side rewrite rules, so unknown deep-link paths
// 404 by default. Duplicating the built `index.html` as `404.html` lets
// Pages serve the SPA shell for any route, which client-side routing then
// resolves (including our own `*` catch-all -> NotFoundUI).
const spaFallback404 = (): Plugin => ({
  name: "spa-fallback-404",
  apply: "build",
  closeBundle() {
    const outDir = resolve(process.cwd(), "dist");
    const indexPath = resolve(outDir, "index.html");
    const notFoundPath = resolve(outDir, "404.html");

    if (!existsSync(indexPath)) {
      this.warn(`Cannot create 404.html: ${indexPath} not found.`);
      return;
    }

    copyFileSync(indexPath, notFoundPath);
  },
});

// Base path is set to the repository name so assets resolve correctly
// when served from GitHub Pages (https://<user>.github.io/hl-self-space/).
export default defineConfig({
  base: "/hl-self-space/",
  plugins: [react(), spaFallback404()],
});
