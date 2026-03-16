import { defineConfig } from "vite"

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "BlazeWidget",
      fileName: "widget",
      formats: ["iife"]
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
})