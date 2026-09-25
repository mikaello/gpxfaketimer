import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@mikaello/gpxfaketimer": resolve(import.meta.dirname, "../src/index.ts"),
    },
  },
});
