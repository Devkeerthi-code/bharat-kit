// Measures what each exported function costs a bundle on its own (minified + gzip),
// and writes the numbers the docs' spec tables show.
import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const modules = ["gstin", "pan", "ifsc", "upi", "mobile", "pincode", "aadhaar", "money", "vehicle"];
const outFile = resolve(root, "docs/.vitepress/theme/data/sizes.json");

async function bundle(contents) {
  const result = await build({
    stdin: { contents, resolveDir: root, loader: "ts" },
    bundle: true,
    minify: true,
    write: false,
    format: "esm",
    target: "es2020",
    metafile: true,
    logLevel: "silent",
  });
  return result;
}

async function exportsOf(name) {
  const result = await bundle(`export * from "./src/${name}.ts";`);
  const [output] = Object.values(result.metafile.outputs);
  return output.exports.filter((e) => /^[a-z]/.test(e));
}

async function gzippedSize(name, fn) {
  const result = await bundle(`export { ${fn} } from "./src/${name}.ts";`);
  return gzipSync(result.outputFiles[0].contents, { level: 9 }).length;
}

const sizes = {};
for (const name of modules) {
  sizes[name] = {};
  for (const fn of await exportsOf(name)) sizes[name][fn] = await gzippedSize(name, fn);
}

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify(sizes, null, 2)}\n`);
process.stdout.write(`Wrote sizes for ${modules.length} modules to ${outFile}\n`);
