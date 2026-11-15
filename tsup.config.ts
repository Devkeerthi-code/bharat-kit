import { defineConfig } from "tsup";

const modules = ["gstin", "pan", "ifsc", "upi", "mobile", "pincode", "aadhaar", "money", "vehicle"];

export default defineConfig({
  entry: ["src/index.ts", ...modules.map((name) => `src/${name}.ts`)],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
  target: "es2020",
  splitting: true,
});
