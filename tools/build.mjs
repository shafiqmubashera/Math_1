// Bundles the app into one page: dist/index.html. Run: node tools/build.mjs
// The app ships with the "desk" (Study Desk) design (app/src/themes/desk.css). Older designs kept as alternatives: quilt, metro, studio.
// Testing copy with every unit open and its own saved progress: node tools/build.mjs --testing  (writes dist/test/index.html)
// Preview another design: node tools/build.mjs --theme quilt  (writes dist/preview-quilt.html); --theme none = base styles only
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const themeArg = process.argv.indexOf("--theme");
const DEFAULT_THEME = "desk";
const theme = themeArg > -1 ? process.argv[themeArg + 1] : DEFAULT_THEME;
const themeCss = theme && theme !== "none" ? read(`app/src/themes/${theme}.css`) : "";
const defaultFonts = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=JetBrains+Mono:wght@400;600;700&display=swap";
const fonts = themeCss.match(/^\/\* fonts: (\S+) \*\//)?.[1] || defaultFonts;
const testing = process.argv.includes("--testing");
const outFile = testing ? "dist/test/index.html" : themeArg > -1 ? `dist/preview-${theme}.html` : "dist/index.html";
const units = JSON.parse(read("curriculum/units.json"));
// Only the real student app (dist/index.html) is installable. The testing copy and design previews stay plain pages.
const installable = !testing && themeArg === -1;
const builtAt = new Date().toISOString();

// Only the units marked "live" ship their questions.
const contentFiles = [];
for (const d of fs.readdirSync(path.join(ROOT, "content")).sort()) {
  const id = "u" + d.match(/^unit-(\d+)/)?.[1];
  const u = units.units.find((x) => x.id === id);
  if (!u || u.status !== "live") continue;
  for (const f of ["generators.js", "bank.js"]) if (fs.existsSync(path.join(ROOT, "content", d, f))) contentFiles.push(`content/${d}/${f}`);
}

const scripts = ["app/src/qlib.js", ...contentFiles, "app/src/engine.js", "app/src/math.js", "app/src/tools.js", "app/src/store.js", "app/src/app.js"];
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");

// Full document head: without the doctype and viewport a phone renders a shrunken 980px desktop page,
// and "light only" keeps phone dark mode from recoloring anything.
const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>Math 1 Practice${testing ? " (testing)" : ""}</title>
${installable ? `<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="theme-color" content="#2E5E4E">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Math 1">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
` : ""}<meta name="description" content="Adaptive NC Math 1 practice sets for an 8th grader, built on the WCPSS units.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>
${read("app/src/styles.css")}
${themeCss}
</style>
<div id="app"></div>
<script>/* KaTeX 0.16.9, MIT licence (vendor/KATEX-LICENSE), bundled so math works offline and on filtered school networks */
${read("vendor/katex-0.16.9.min.js").replace(/<\/script/gi, "<\\/script")}</script>
<script>
window.M1 = window.M1 || {};
M1.curriculum = ${JSON.stringify(units)};
M1.buildInfo = ${JSON.stringify({ built: builtAt, testing })};
</script>
${scripts.map((s) => `<script>/* ${s} */\n${safe(read(s))}\n</script>`).join("\n")}
<script>M1.app.boot();</script>
${installable ? `<script>/* Offline support for the installed app. Only on a real web address (not when opened as a file). */
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
</script>
` : ""}`;
fs.mkdirSync(path.dirname(path.join(ROOT, outFile)), { recursive: true });
fs.writeFileSync(path.join(ROOT, outFile), html);
if (installable) writeInstallFiles();
console.log(`${outFile} written (${(html.length / 1024).toFixed(0)} KB, ${scripts.length} scripts)`);

// Files that let iPad, iPhone and PC install the app from the web page: a manifest, icons and a service worker.
function writeInstallFiles() {
  const dist = path.join(ROOT, "dist");
  fs.mkdirSync(path.join(dist, "icons"), { recursive: true });
  const icons = ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon-32.png"];
  for (const f of icons) fs.copyFileSync(path.join(ROOT, "app/icons", f), path.join(dist, "icons", f));
  const manifest = {
    name: "Math 1 Practice",
    short_name: "Math 1",
    description: "Adaptive NC Math 1 practice sets built on the WCPSS units.",
    id: "./",
    start_url: "./",
    scope: "./",
    display: "standalone",
    orientation: "any",
    background_color: "#2E5E4E",
    theme_color: "#2E5E4E",
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  fs.writeFileSync(path.join(dist, "manifest.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");
  // Network first, so a new version shows as soon as the device is online; the saved copy is used when offline.
  // Progress lives in the browser's own storage (localStorage), which this never touches.
  const sw = `// Math 1 Practice service worker, built ${builtAt}
const CACHE = "m1-${builtAt}";
const CORE = ["./", "manifest.webmanifest", ${icons.map((f) => JSON.stringify("icons/" + f)).join(", ")}];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("m1-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const sameSite = url.origin === location.origin, fonts = /^fonts\\.(googleapis|gstatic)\\.com$/.test(url.hostname);
  if (!sameSite && !fonts) return;
  if (url.href.startsWith(new URL("test/", self.registration.scope).href)) return; // leave the testing copy alone
  e.respondWith(fetch(req).then((res) => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === "navigate" ? caches.match("./") : Response.error()))));
});
`;
  fs.writeFileSync(path.join(dist, "sw.js"), sw);
}
