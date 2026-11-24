import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 本地与 GitHub Pages 项目站均可：相对资源路径
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
});
