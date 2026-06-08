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

const files = walk(ROOT);
const existing = new Set(
  files.map((f) => path.relative(ROOT, f).replace(/\\/g, "/"))
);

function resolveInternal(href, fromFile) {
  if (
    !href ||
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  ) {
    return null;
  }
  const fromDir = path.dirname(path.relative(ROOT, fromFile));
  let target = href.split("#")[0].split("?")[0];
  if (target.startsWith("/")) {
    target = target.replace(/^\/+/, "");
    if (!target || target.endsWith("/")) target += "index.html";
    else if (!target.endsWith(".html")) target += "/index.html";
    return target.replace(/\\/g, "/");
  }
  let resolved = path.normalize(path.join(fromDir, target)).replace(/\\/g, "/");
  if (resolved.endsWith("/")) resolved += "index.html";
  if (!resolved.endsWith(".html") && !path.extname(resolved)) {
    resolved += "/index.html";
  }
  return resolved;
}

const inertCtaButtons = [];
const inertNavButtons = [];
const inertContentLinks = [];
const brokenButtonLinks = [];
const emptyButtonHrefs = [];
const submitButtons = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const html = fs.readFileSync(file, "utf8");

  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = m[1];
    const text = m[1].includes("aria-label")
      ? (attrs.match(/aria-label="([^"]*)"/) || [])[1]
      : m[2].replace(/<[^>]+>/g, "").trim();

    if (/type="submit"/.test(attrs) && /\bbutton\b/.test(attrs)) {
      submitButtons.push({ file: rel, text: m[2].replace(/<[^>]+>/g, "").trim() });
      continue;
    }
    if (/data-accordion|data-video|mobile-menu-toggle/.test(attrs)) continue;
    if (/data-inert/.test(attrs)) {
      if (/\bbutton\b/.test(attrs)) {
        inertCtaButtons.push({ file: rel, text: m[2].replace(/<[^>]+>/g, "").trim() });
      } else if (/nav-link|mobile-link/.test(attrs)) {
        inertNavButtons.push({ file: rel, text: m[2].replace(/<[^>]+>/g, "").trim() });
      }
    }
  }

  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    const href = (attrs.match(/href="([^"]*)"/) || [])[1];

    if (/data-inert/.test(attrs) && !/nav-link|mobile-link/.test(attrs)) {
      inertContentLinks.push({ file: rel, text: text.slice(0, 80), href });
    }

    if (/\bbutton\b/.test(attrs)) {
      if (!href || href === "#") {
        emptyButtonHrefs.push({ file: rel, text: text.slice(0, 60), href });
      } else {
        const target = resolveInternal(href, file);
        if (target && !existing.has(target) && !target.startsWith("assets/")) {
          brokenButtonLinks.push({ file: rel, text: text.slice(0, 50), href, target });
        }
      }
    }
  }
}

const uniqueInertCta = [...new Map(inertCtaButtons.map((i) => [`${i.file}|${i.text}`, i])).values()];
const uniqueBroken = [...new Map(brokenButtonLinks.map((i) => [`${i.file}|${i.href}`, i])).values()];
const navLabels = [...new Set(inertNavButtons.map((i) => i.text))];

const inertCtaSolid = [];
const jobNavInert = [];
const extranetInert = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const html = fs.readFileSync(file, "utf8");

  for (const m of html.matchAll(
    /<button class="button[^"]*"[^>]*data-inert[^>]*>([\s\S]*?)<\/button>/gi
  )) {
    inertCtaSolid.push({ file: rel, text: m[1].replace(/<[^>]+>/g, "").trim() });
  }

  if (/<button type="button" class="nav-link" data-inert>Mitarbeiter/.test(html)) {
    jobNavInert.push(rel);
  }
  if (/<button type="button" class="nav-link" data-inert>Extranet/.test(html)) {
    extranetInert.push(rel);
  }
}

const placeholderLinks = inertContentLinks.filter((i) => i.href === "#!");

console.log(
  JSON.stringify(
    {
      totalHtmlFiles: files.length,
      linkButtonsChecked: brokenButtonLinks.length + emptyButtonHrefs.length,
      brokenLinkButtons: uniqueBroken.length,
      brokenButtonSamples: uniqueBroken.slice(0, 10),
      emptyButtonHrefs: emptyButtonHrefs.length,
      inertCtaButtons: inertCtaSolid.length,
      inertCtaByPage: [...new Map(inertCtaSolid.map((i) => [i.file, i])).values()],
      jobNavInertPages: jobNavInert.length,
      extranetInertPages: extranetInert.length,
      placeholderLinks: placeholderLinks.length,
      placeholderLinkTypes: [
        ...new Map(placeholderLinks.map((i) => [i.text, i])).values(),
      ],
      submitButtons: submitButtons.length,
    },
    null,
    2
  )
);
