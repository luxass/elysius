import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/find.ts",
    "./src/walk.ts",
  ],
  format: ["esm"],
  clean: true,
  dts: true,
  treeshake: true,
  exports: true,
  publint: true,
});
