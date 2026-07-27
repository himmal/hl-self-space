import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path is set to the repository name so assets resolve correctly
// when served from GitHub Pages (https://<user>.github.io/hl-self-space/).
export default defineConfig({
  base: "/hl-self-space/",
  plugins: [react()],
});
