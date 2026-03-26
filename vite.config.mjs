import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";

const rootDir = resolve(__dirname);
const outDir = resolve(rootDir, "dist");

function copyToDist(sourcePath, targetPath) {
  const target = resolve(outDir, targetPath);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(resolve(rootDir, sourcePath), target, { recursive: true });
}

function copyExtensionFilesPlugin() {
  return {
    name: "copy-extension-files",
    closeBundle() {
      copyToDist("manifest.json", "manifest.json");
      copyToDist("assets", "assets");
      copyToDist("src/laser.css", "src/laser.css");
    },
  };
}

export default defineConfig({
  build: {
    outDir,
    emptyOutDir: true,
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      input: {
        background: resolve(rootDir, "src/background.js"),
        content: resolve(rootDir, "src/content.js"),
      },
      output: {
        entryFileNames: "src/[name].js",
        chunkFileNames: "src/chunks/[name]-[hash].js",
        assetFileNames: "src/assets/[name]-[hash][extname]",
      },
    },
  },
  plugins: [copyExtensionFilesPlugin()],
});
