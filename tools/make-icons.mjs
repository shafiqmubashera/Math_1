// Draws the app icons (PNG) from app/icons/icon.svg. Run once after changing the SVG: node tools/make-icons.mjs
// Needs Playwright with Chromium. The PNGs are committed, so the normal build doesn't need this.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svg = fs.readFileSync(path.join(ROOT, "app/icons/icon.svg"), "utf8");
const sizes = { "icon-192.png": 192, "icon-512.png": 512, "apple-touch-icon.png": 180, "favicon-32.png": 32 };
const browser = await chromium.launch();
for (const [name, size] of Object.entries(sizes)) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: path.join(ROOT, "app/icons", name) });
  await page.close();
  console.log(`app/icons/${name} (${size}px)`);
}
await browser.close();
