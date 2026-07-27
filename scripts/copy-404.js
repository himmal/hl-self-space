// Copies dist/index.html to dist/404.html after the build.
// GitHub Pages serves 404.html for unknown routes, so duplicating index.html
// there allows client-side routing to handle deep links correctly.
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");
const indexPath = resolve(distDir, "index.html");
const notFoundPath = resolve(distDir, "404.html");

copyFileSync(indexPath, notFoundPath);
