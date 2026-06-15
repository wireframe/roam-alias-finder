#!/usr/bin/env node
import { build } from "esbuild";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

await build({
  entryPoints: [resolve(root, "src/alias-finder.js")],
  bundle: true,
  format: "esm",
  target: "es2020",
  outfile: resolve(root, "extension.js"),
  logLevel: "info",
});
