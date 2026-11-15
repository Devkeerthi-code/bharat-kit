import { fileURLToPath } from "node:url";
import { defineConfig, type HeadConfig } from "vitepress";

const fonts =
  "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+Devanagari:wght@400;500&display=swap";

// Optional, cookie-free page counts for the docs site. Set GOATCOUNTER_CODE at build time to enable.
const goatcounter = process.env.GOATCOUNTER_CODE?.trim();
const analytics: HeadConfig[] = goatcounter
  ? [["script", { "data-goatcounter": `https://${goatcounter}.goatcounter.com/count`, async: "", src: "https://gc.zgo.at/count.js" }]]
  : [];

const base = process.env.DOCS_BASE ?? "/bharat-kit/";

export default defineConfig({
  title: "bharat-kit",
  description:
    "A dependency-free TypeScript library for GSTIN, PAN, IFSC, UPI, mobile numbers, pincodes, Aadhaar checksums, money in lakhs and crores, and vehicle numbers.",
  base,
  lang: "en-IN",
  cleanUrls: true,
  lastUpdated: false,
  appearance: true,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` }],
    ["meta", { name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" }],
    ["meta", { name: "theme-color", content: "#0f0f0e", media: "(prefers-color-scheme: dark)" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    ["link", { rel: "stylesheet", href: fonts }],
    ...analytics,
  ],
  markdown: {
    theme: { light: "min-light", dark: "min-dark" },
    // The module pages' "On this page" list reads these, so it renders on the server.
    headers: { level: [2] },
  },
  vite: {
    resolve: {
      alias: { "bharat-kit": fileURLToPath(new URL("../../src/index.ts", import.meta.url)) },
    },
  },
});
