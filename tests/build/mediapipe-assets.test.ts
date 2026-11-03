// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { build, createServer } from "vite-plus";
import { expect, it } from "vite-plus/test";
import { mediapipeAssets } from "../../build/mediapipe-assets";

const wasmDirectory = path.join(path.dirname(createRequire(import.meta.url).resolve("@mediapipe/tasks-vision")), "wasm");
const filenames = ["vision_wasm_internal.js", "vision_wasm_internal.wasm", "vision_wasm_nosimd_internal.js", "vision_wasm_nosimd_internal.wasm"];

it("serves the installed MediaPipe runtime under the configured base with browser content types", async () => {
  const server = await createServer({ configFile: false, base: "/quimia/", plugins: [mediapipeAssets()], server: { host: "127.0.0.1", port: 0, watch: null }, optimizeDeps: { noDiscovery: true } });
  try {
    await server.listen();
    const address = server.httpServer!.address();
    if (!address || typeof address === "string") throw new Error("Missing HTTP server address");
    for (const filename of filenames) {
      const response = await fetch(`http://127.0.0.1:${address.port}/quimia/mediapipe/${filename}?v=1`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(filename.endsWith(".wasm") ? "application/wasm" : "text/javascript");
      expect(Buffer.from(await response.arrayBuffer())).toEqual(await readFile(path.join(wasmDirectory, filename)));
    }
    const privateFile = await fetch(`http://127.0.0.1:${address.port}/quimia/mediapipe/package.json`, { headers: { accept: "application/octet-stream" } });
    expect(privateFile.status).toBe(404);
  } finally {
    await server.close();
  }
}, 20000);

it("includes the installed runtime in production builds without changing its bytes", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "quimia-mediapipe-"));
  try {
    await writeFile(path.join(root, "index.html"), "<html><body>Quimia</body></html>");
    await build({ configFile: false, root, plugins: [mediapipeAssets()], logLevel: "silent", build: { outDir: "dist" } });
    for (const filename of filenames) {
      expect(await readFile(path.join(root, "dist/mediapipe", filename))).toEqual(await readFile(path.join(wasmDirectory, filename)));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 20000);
