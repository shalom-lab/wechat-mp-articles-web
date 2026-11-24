import { copyFileSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const REPO = "wechat-mp-articles-web";

/** GitHub Pages SPA：404.html + 关键路由 index.html 回退 */
function spaPagesFallback(routes = ["settings", "categories", "toc"]) {
  return {
    name: "spa-pages-fallback",
    closeBundle() {
      const dist = join(process.cwd(), "dist");
      const index = join(dist, "index.html");
      if (!existsSync(index)) return;
      copyFileSync(index, join(dist, "404.html"));
      const html = readFileSync(index, "utf8");
      for (const route of routes) {
        const dir = join(dist, route);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, "index.html"), html);
      }
    },
  };
}

// 项目站：https://<owner>.github.io/wechat-mp-articles-web/
export default defineConfig({
  base: `/${REPO}/`,
  plugins: [react(), spaPagesFallback()],
  build: { outDir: "dist", emptyOutDir: true },
});
