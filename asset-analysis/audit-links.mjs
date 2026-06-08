import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP = new Set([
  "leadwerk_importer",
  "leadwerk_theme",
  "leadwerk-fields",
  "asset-analysis",
  "node_modules",
]);

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (e.name.endsWith(".html")) files.push(p);
  }
  return files;
}

const htmlFiles = walk(ROOT);
const existing = new Set(
  htmlFiles.map((f) => path.relative(ROOT, f).replace(/\\/g, "/"))
);

function resolveInternal(href, fromFile) {
  if (
    !href ||
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#") ||
    href.startsWith("javascript:")
  ) {
    return null;
  }

  const fromDir = path.dirname(path.relative(ROOT, fromFile));
  let target = href.split("#")[0].split("?")[0];
  if (!target) return null;

  if (target.startsWith("/")) {
    target = target.replace(/^\/+/, "");
    if (!target || target.endsWith("/")) target += "index.html";
    else if (!target.endsWith(".html") && !path.extname(target)) target += "/index.html";
    return target.replace(/\\/g, "/");
  }

  let resolved = path.normalize(path.join(fromDir, target)).replace(/\\/g, "/");
  if (resolved.endsWith("/")) resolved += "index.html";
  if (!resolved.endsWith(".html") && !path.extname(resolved)) {
    resolved += "/index.html";
  }
  return resolved;
}

const broken = [];
const inertControls = [];
const placeholderHrefs = [];
const anchorOnly = [];

for (const file of htmlFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const html = fs.readFileSync(file, "utf8");

  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").trim().slice(0, 60);
    const href = (attrs.match(/href="([^"]*)"/) || [])[1];

    if (/data-inert/.test(attrs)) {
      inertControls.push({ file: rel, text, href: href || "" });
      continue;
    }

    if (!href || href === "#" || href === "#!") {
      placeholderHrefs.push({ file: rel, text, href: href || "(empty)" });
      continue;
    }

    const target = resolveInternal(href, file);
    if (!target) continue;

    const exists =
      existing.has(target) ||
      fs.existsSync(path.join(ROOT, target)) ||
      target.startsWith("assets/") ||
      target.startsWith("Bildmaterial_final/");

    if (!exists) {
      broken.push({ file: rel, text, href, target });
    }
  }

  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = m[1];
    if (!/data-inert/.test(attrs)) continue;
    if (/data-accordion|data-video|mobile-menu-toggle/.test(attrs)) continue;
    const text = m[2].replace(/<[^>]+>/g, "").trim().slice(0, 60);
    inertControls.push({ file: rel, text, href: "(button)" });
  }
}

const uniqueBroken = [...new Map(broken.map((i) => [`${i.file}|${i.href}`, i])).values()];
const inertByLabel = new Map();
for (const item of inertControls) {
  inertByLabel.set(item.text, (inertByLabel.get(item.text) || 0) + 1);
}

console.log(
  JSON.stringify(
    {
      pagesScanned: htmlFiles.length,
      brokenInternalLinks: uniqueBroken.length,
      brokenSamples: uniqueBroken.slice(0, 25),
      placeholderAnchors: placeholderHrefs.length,
      placeholderSamples: placeholderHrefs.slice(0, 10),
      inertControlsTotal: inertControls.length,
      inertControlLabels: Object.fromEntries(
        [...inertByLabel.entries()].sort((a, b) => b[1] - a[1])
      ),
    },
    null,
    2
  )
);
