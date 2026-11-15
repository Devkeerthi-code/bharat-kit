// Loads the built package the way users do (ESM, CJS and subpaths) and checks a few results.
// Runs on the oldest supported Node in CI, without the dev toolchain.
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const cjs = require("../dist/index.cjs");
const esm = await import("../dist/index.js");
const money = await import("../dist/money.js");
const gstin = require("../dist/gstin.cjs");

assert.equal(cjs.isValidGstin("27AAPFU0939F1ZV"), true);
assert.equal(esm.isValidGstin("27AAPFU0939F1ZX"), false);
assert.equal(gstin.parseGstin("29ABCPE1234F1Z7").value.stateName, "Karnataka");
assert.equal(money.formatInr(1250000), "₹12,50,000");
assert.equal(money.toWords(1250000, "hi"), "बारह लाख पचास हज़ार");
assert.equal(esm.percentOfPaise(99900, 18), 17982);
assert.equal(cjs.maskAadhaar("2345 6789 0124").value, "XXXX XXXX 0124");

process.stdout.write(`Smoke test passed on Node ${process.version}\n`);
