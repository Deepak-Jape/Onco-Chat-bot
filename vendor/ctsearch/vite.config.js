import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    // visualizer({
    //   open: true,        // auto open report
    //   filename: "stats.html",
    //   gzipSize: true,
    //   brotliSize: true,
    // }),
  ],
  build: {
    cssCodeSplit: true,
    cssMinify: true,
  },
});
