import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// `@ct` resolves into the ctsearch submodule (vendor/ctsearch). Keeping it
// repo-relative -- rather than an absolute machine path -- is what lets the same
// import work locally and inside a Docker build later on.
const ctsearchSrc = fileURLToPath(new URL("../vendor/ctsearch/src", import.meta.url));

const r = (p) => fileURLToPath(new URL(p, import.meta.url));
const NODE_MODULES = r("./node_modules");

/* The vendored ctsearch files live outside this project root, so Node
   resolution looks for bare imports (recharts, chart.js, maplibre-gl,
   lucide-react, ...) in THEIR directory tree -- where no node_modules is
   installed -- and the build fails.

   This plugin redirects any bare specifier originating from a vendored file
   into this app's node_modules, so dependencies resolve here without having to
   alias each package by hand as more components get wired up. Relative imports
   are left alone so the components keep importing their own siblings. */
const resolveVendorDeps = () => ({
  name: "resolve-ctsearch-deps",
  enforce: "pre",
  async resolveId(source, importer) {
    if (!importer || !importer.includes("vendor")) return null;
    if (source.startsWith(".") || source.startsWith("/") || source.startsWith("@ct")) return null;
    return this.resolve(source, `${NODE_MODULES}/_.js`, { skipSelf: true });
  },
});

export default defineConfig({
  plugins: [resolveVendorDeps(), react()],
  resolve: {
    // Array form so specifiers can be matched EXACTLY (object aliases are
    // prefix matches, which would also rewrite deep paths like "react-dom/client").
    alias: [
      // ctsearch's EvidenceTraceCard imports { Link } from react-router-dom.
      // The real package depends on cookie@1.1.1, a CJS module Vite cannot
      // interop cleanly (the browser executes bare `exports.parse = ...` and
      // throws "exports is not defined"), which takes down every component
      // below it. This app has no routes, so a Link-only stub is sufficient
      // and removes the dependency entirely. See src/shims/react-router-dom.jsx.
      { find: /^react-router-dom$/, replacement: r("./src/shims/react-router-dom.jsx") },
      { find: /^react-router$/, replacement: r("./src/shims/react-router-dom.jsx") },
      { find: "@ct", replacement: ctsearchSrc },
      // ctsearch files live outside this project root, so Node resolution would
      // look for THEIR node_modules (which the submodule does not install).
      // Pinning the shared singletons here makes every import -- ours and
      // theirs -- land on this app's single copy. Without this, `react` and
      // `react/jsx-runtime` fail to resolve from the vendored files, and MUI
      // would otherwise risk loading twice and breaking its context.
      { find: /^react$/, replacement: r("./node_modules/react") },
      { find: /^react-dom$/, replacement: r("./node_modules/react-dom") },
      { find: /^@mui\/material$/, replacement: r("./node_modules/@mui/material") },
      { find: /^@emotion\/react$/, replacement: r("./node_modules/@emotion/react") },
      { find: /^@emotion\/styled$/, replacement: r("./node_modules/@emotion/styled") },
    ],
    // Let Vite compile .jsx that lives outside the project root.
    preserveSymlinks: false,
  },
  optimizeDeps: {
    // The vendored ctsearch components are outside this project's root, so Vite
    // does not crawl them when deciding what to pre-bundle -- their CommonJS
    // dependencies then reach the browser raw and fail with errors like
    // "does not provide an export named 'default'" (prop-types via MUI).
    // Listing them forces the CJS -> ESM conversion.
    include: [
      "react", "react-dom", "react-dom/client", "react/jsx-runtime",
      "prop-types", "hoist-non-react-statics", "react-is",
      "@mui/material", "@mui/material/styles", "@mui/system",
      "@mui/utils", "@mui/icons-material", "@mui/styles", "@mui/lab",
      "@emotion/react", "@emotion/styled", "@emotion/cache",
      "react-redux", "redux", "redux-thunk", "@reduxjs/toolkit",
      "axios", "clsx", "lucide-react", "recharts",
      // CJS with __esModule set but no exports.default assignment, so Vite's
      // static scan reports "does not provide an export named 'default'" even
      // though the property exists at runtime. Pre-bundling materialises it.
      "react-world-flags",
      "chart.js", "react-chartjs-2", "maplibre-gl", "react-map-gl/maplibre",
    ],
  },
  server: {
    port: 5173,
    fs: {
      // vendor/ctsearch sits OUTSIDE this project root, so the dev server
      // refuses to serve it by default and every lazy chart import fails with
      // "Failed to fetch dynamically imported module". Allow the repo root
      // (which contains both frontend/ and vendor/).
      allow: [r("."), r(".."), ctsearchSrc],
      strict: false,
    },
    // The Python app owns the data API; proxy so the browser sees one origin
    // and no CORS handling is needed on either side.
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/ask": { target: "http://127.0.0.1:8000", changeOrigin: true },
      // ctsearch's axios client calls search/ExecutiveSummary; VITE_API_BASE_URL
      // is "/" so it lands here and is proxied to the Python app.
      "/search": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
