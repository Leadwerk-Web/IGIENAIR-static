import fs from "fs";
import path from "path";

const root = path.resolve(".");
const skip = ["leadwerk_importer", "leadwerk_theme", "asset-analysis", "node_modules"];

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (skip.some((s) => p.includes(s))) continue;
      walk(p, files);
    } else if (e.name === "index.html") {
      files.push(p);
    }
  }
  return files;
}

function extract(html) {
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
  const desc =
    html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]?.trim() ??
    html.match(/<meta\s+content="([^"]*)"\s+name="description"/i)?.[1]?.trim() ??
    null;
  const robots =
    html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i)?.[1]?.trim() ?? null;
  const canonical =
    html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i)?.[1]?.trim() ?? null;
  return { title, desc, robots, canonical };
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&uuml;/g, "ü")
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&szlig;/g, "ß")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

const files = walk(root).sort();
const pages = files.map((f) => {
  const rel = path.relative(root, f).replace(/\\/g, "/");
  const url = rel === "index.html" ? "/" : `/${rel.replace("/index.html", "/")}`;
  const html = fs.readFileSync(f, "utf8");
  const meta = extract(html);
  return {
    rel,
    url,
    ...meta,
    title: meta.title ? decodeEntities(meta.title) : null,
    desc: meta.desc ? decodeEntities(meta.desc) : null,
    titleLen: meta.title?.length ?? 0,
    descLen: meta.desc?.length ?? 0,
  };
});

const titleMap = {};
const descMap = {};
for (const p of pages) {
  if (p.title) (titleMap[p.title] ??= []).push(p.url);
  if (p.desc) (descMap[p.desc] ??= []).push(p.url);
}

const summary = {
  total: pages.length,
  dupTitles: Object.entries(titleMap).filter(([, a]) => a.length > 1),
  dupDescs: Object.entries(descMap).filter(([, a]) => a.length > 1),
  missingTitle: pages.filter((p) => !p.title).map((p) => p.url),
  missingDesc: pages.filter((p) => !p.desc).map((p) => p.url),
  longTitles: pages.filter((p) => p.titleLen > 65),
  shortTitles: pages.filter((p) => p.title && p.titleLen < 30),
  longDescs: pages.filter((p) => p.descLen > 165),
  shortDescs: pages.filter((p) => p.desc && p.descLen < 90),
  pages,
};

const outDir = path.join(root, "asset-analysis", "output");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "meta-audit-raw.json"), JSON.stringify(summary, null, 2));
console.log(`Pages: ${summary.total}`);
console.log(`Duplicate titles: ${summary.dupTitles.length}`);
console.log(`Duplicate descriptions: ${summary.dupDescs.length}`);
console.log(`Missing title: ${summary.missingTitle.length}`);
console.log(`Missing desc: ${summary.missingDesc.length}`);
console.log(`Long titles (>65): ${summary.longTitles.length}`);
console.log(`Short titles (<30): ${summary.shortTitles.length}`);
console.log(`Long descs (>165): ${summary.longDescs.length}`);
console.log(`Short descs (<90): ${summary.shortDescs.length}`);
