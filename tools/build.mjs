// Bundles the app into one page: dist/index.html. Run: node tools/build.mjs
// The app ships with the "desk" (Study Desk) design (app/src/themes/desk.css). Older designs kept as alternatives: quilt, metro, studio.
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
const outFile = themeArg > -1 ? `dist/preview-${theme}.html` : "dist/index.html";
const units = JSON.parse(read("curriculum/units.json"));

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

const html = `<title>Math 1 Practice</title>
<meta name="description" content="Adaptive NC Math 1 practice sets for an 8th grader, built on the WCPSS units.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>
${read("app/src/styles.css")}
${themeCss}
</style>
<div id="app"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
<script>
window.M1 = window.M1 || {};
M1.curriculum = ${JSON.stringify(units)};
M1.buildInfo = ${JSON.stringify({ built: new Date().toISOString() })};
</script>
${scripts.map((s) => `<script>/* ${s} */\n${safe(read(s))}\n</script>`).join("\n")}
<script>M1.app.boot();</script>
`;
fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });
fs.writeFileSync(path.join(ROOT, outFile), html);
console.log(`${outFile} written (${(html.length / 1024).toFixed(0)} KB, ${scripts.length} scripts)`);
