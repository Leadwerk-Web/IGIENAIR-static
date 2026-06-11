import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = ".";
const skip = ["leadwerk_importer", "leadwerk_theme", "asset-analysis"];

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (skip.some((s) => p.includes(s))) continue;
      walk(p, files);
    } else if (e.name === "index.html") files.push(p);
  }
  return files;
}

function extract(html) {
  return {
    title: html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null,
    desc: html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? null,
  };
}

function decode(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&uuml;/g, "ü")
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&szlig;/g, "ß");
}

const changes = [];
for (const f of walk(ROOT)) {
  const rel = f.replace(/\\/g, "/");
  let oldHtml;
  try {
    oldHtml = execSync(`git show HEAD:${rel}`, { encoding: "utf8" });
  } catch {
    continue;
  }
  const newHtml = fs.readFileSync(f, "utf8");
  const old = extract(oldHtml);
  const neu = extract(newHtml);
  const titleChanged = old.title !== neu.title;
  const descChanged = old.desc !== neu.desc;
  if (!titleChanged && !descChanged) continue;

  const url = rel === "index.html" ? "/" : `/${rel.replace("/index.html", "/")}`;
  changes.push({
    url,
    oldTitle: decode(old.title),
    newTitle: decode(neu.title),
    titleLen: neu.title?.length ?? 0,
    oldDesc: decode(old.desc),
    newDesc: decode(neu.desc),
    descLen: neu.desc?.length ?? 0,
    titleChanged,
    descChanged,
    status: "Optimiert",
  });
}

const unchanged = 176 - changes.length;
fs.writeFileSync(
  "asset-analysis/output/meta-optimization-summary.json",
  JSON.stringify(
    {
      stats: {
        checked: 176,
        optimized: changes.length,
        unchangedGood: unchanged,
        titlesChanged: changes.filter((c) => c.titleChanged).length,
        descsChanged: changes.filter((c) => c.descChanged).length,
      },
      changes,
    },
    null,
    2
  )
);

console.log(JSON.stringify(changes.length, null, 0));
