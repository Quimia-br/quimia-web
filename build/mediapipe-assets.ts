import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type { Plugin } from "vite-plus";

const filenames = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

export function mediapipeAssets(): Plugin {
  const wasmDirectory = path.join(
    path.dirname(createRequire(import.meta.url).resolve("@mediapipe/tasks-vision")),
    "wasm",
  );

  return {
    name: "mediapipe-assets",
    configureServer(server) {
      const prefix = `${server.config.base}mediapipe/`;
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split("?")[0];
        if (!pathname?.startsWith(prefix)) return next();

        const filename = pathname.slice(prefix.length);
        if (!filenames.includes(filename)) {
          response.statusCode = 404;
          response.end();
          return;
        }

        readFile(path.join(wasmDirectory, filename)).then((source) => {
          response.setHeader(
            "Content-Type",
            filename.endsWith(".wasm") ? "application/wasm" : "text/javascript",
          );
          response.end(source);
        }, next);
      });
    },
    async generateBundle() {
      for (const filename of filenames) {
        this.emitFile({
          type: "asset",
          fileName: `mediapipe/${filename}`,
          source: await readFile(path.join(wasmDirectory, filename)),
        });
      }
    },
  };
}
