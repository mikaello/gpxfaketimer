import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@mikaello/gpxfaketimer": resolve(__dirname, "../src/index.ts"),
    },
  },
});
