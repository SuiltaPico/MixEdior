import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    solid(),
    dts({
      rollupTypes: true,
      tsconfigPath: "./tsconfig.app.json",
    }),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      // name: "MixEditorBrowserView",
      // fileName: "index",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["solid-js", "@mixeditor/core", "@mixeditor/common"],
      output: {
        globals: {
          "solid-js": "Solid",
        },
      },
    },
  },
});
