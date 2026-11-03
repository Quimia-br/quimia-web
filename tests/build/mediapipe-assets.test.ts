// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { build, createServer } from "vite-plus";
import { expect, it } from "vite-plus/test";
import { mediapipeAssets } from "../../build/mediapipe-assets";

const wasmDirectory = path.join(
  path.dirname(createRequire(import.meta.url).resolve("@mediapipe/tasks-vision")),
  "wasm",
);
const filenames = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];
const modelChecksum = "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff";

it("serves the installed MediaPipe runtime under the configured base with browser content types", async () => {
  const server = await createServer({
    configFile: false,
    base: "/quimia/",
    plugins: [mediapipeAssets()],
    server: { host: "127.0.0.1", port: 0, watch: null },
    optimizeDeps: { noDiscovery: true },
  });
  try {
    await server.listen();
    const address = server.httpServer!.address();
    if (!address || typeof address === "string") throw new Error("Missing HTTP server address");
    for (const filename of filenames) {
      const response = await fetch(
        `http://127.0.0.1:${address.port}/quimia/mediapipe/${filename}?v=1`,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        filename.endsWith(".wasm") ? "application/wasm" : "text/javascript",
      );
      expect(
        Buffer.from(await response.arrayBuffer()).equals(
          await readFile(path.join(wasmDirectory, filename)),
        ),
      ).toBe(true);
    }
    const model = await fetch(
      `http://127.0.0.1:${address.port}/quimia/models/face_landmarker.task`,
    );
    expect(model.status).toBe(200);
    expect(
      createHash("sha256")
        .update(Buffer.from(await model.arrayBuffer()))
        .digest("hex"),
    ).toBe(modelChecksum);
    const privateFile = await fetch(
      `http://127.0.0.1:${address.port}/quimia/mediapipe/package.json`,
      { headers: { accept: "application/octet-stream" } },
    );
    expect(privateFile.status).toBe(404);
  } finally {
    await server.close();
  }
}, 20000);

it("includes the installed runtime in production builds without changing its bytes", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "quimia-mediapipe-"));
  try {
    await writeFile(path.join(root, "index.html"), "<html><body>Quimia</body></html>");
    await build({
      configFile: false,
      root,
      publicDir: path.resolve(import.meta.dirname, "../../public"),
      plugins: [mediapipeAssets()],
      logLevel: "silent",
      build: { outDir: "dist" },
    });
    for (const filename of filenames) {
      expect(
        (await readFile(path.join(root, "dist/mediapipe", filename))).equals(
          await readFile(path.join(wasmDirectory, filename)),
        ),
      ).toBe(true);
    }
    expect(
      createHash("sha256")
        .update(await readFile(path.join(root, "dist/models/face_landmarker.task")))
        .digest("hex"),
    ).toBe(modelChecksum);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 20000);
