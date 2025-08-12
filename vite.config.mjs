// vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  base: "/",                // serwujemy z root domeny
  plugins: [react(), wasm(), topLevelAwait()],
  build: {
    outDir: "dist",         // folder publikacji na Render
    emptyOutDir: true       // czyści dist przed buildem
  }
});
